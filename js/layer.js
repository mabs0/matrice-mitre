/* ============================================================================
   Le layer : l'état d'une évaluation.

   Rien n'est stocké par le navigateur. Un layer vit en mémoire le temps de la
   session et se transporte par fichier — c'est le fonctionnement de MITRE
   ATT&CK Navigator, et c'est ce qui permet d'héberger l'outil sur GitHub Pages
   sans aucun serveur. « Ouvrir un layer existant » veut donc dire : importer
   son JSON ou son Excel, puis le reprendre là où il s'était arrêté.

   Conséquence à assumer côté interface : fermer l'onglet perd le travail non
   exporté. L'interface le rappelle et propose l'export avant de quitter.
   ========================================================================= */

import { CATALOG, ANSWERS } from "./catalog.js";

export const SCHEMA = "ctrm-layer/1";

export function createLayer({ name, attackVersion, respondent } = {}) {
    const now = new Date().toISOString();
    return {
        schema: SCHEMA,
        name: name?.trim() || "Évaluation sans titre",
        created: now,
        modified: now,
        attackVersion: attackVersion || null,
        // Auditabilité : qui a répondu, pour quelle organisation.
        respondent: { name: "", org: "", email: "", ...(respondent || {}) },
        scoring: "last-yes",
        aggregation: "average",
        /** { [mitigationId]: { [questionNum]: { value, tool, note, at } } } */
        answers: {},
        cursor: { mitigation: null, question: null },
        catalog: CATALOG,      // référence de travail, jamais sérialisée
    };
}

/**
 * Enregistre une réponse.
 *
 * @returns {number} nombre de réponses devenues inatteignables et effacées
 */
export function setAnswer(layer, mitigationId, num, { value, tool, note } = {}) {
    if (!layer.answers[mitigationId]) layer.answers[mitigationId] = {};
    const previous = layer.answers[mitigationId][num] || {};
    layer.answers[mitigationId][num] = {
        ...previous,
        value: value ?? previous.value ?? null,
        tool: tool ?? previous.tool ?? "",
        note: note ?? previous.note ?? "",
        at: new Date().toISOString(),          // horodatage par question, pour l'auditabilité
    };
    layer.cursor = { mitigation: mitigationId, question: Number(num) };
    layer.modified = new Date().toISOString();

    return value === "Non" ? dropUnreachable(layer, mitigationId, num) : 0;
}

/**
 * Efface les réponses situées après un « Non ».
 *
 * Le questionnaire est progressif : on ne pose une question que parce que la
 * précédente était « Oui ». Si on revient en arrière pour passer une réponse à
 * « Non », les réponses suivantes n'auraient jamais dû être posées — les garder
 * ferait remonter un niveau que le parcours ne justifie plus.
 */
function dropUnreachable(layer, mitigationId, num) {
    const questionnaire = layer.catalog?.get(mitigationId);
    if (!questionnaire) return 0;

    const from = questionnaire.questions.findIndex(q => String(q.num) === String(num));
    if (from < 0) return 0;

    let dropped = 0;
    for (const q of questionnaire.questions.slice(from + 1)) {
        if (layer.answers[mitigationId][q.num]) {
            delete layer.answers[mitigationId][q.num];
            dropped++;
        }
    }
    return dropped;
}

export const answerOf = (layer, mitigationId, num) =>
    layer.answers?.[mitigationId]?.[num]?.value ?? null;

/* ------------------------------------------------------------- avancement */

/**
 * État d'un questionnaire, en tenant compte du parcours progressif : un « Non »
 * clôt la mitigation, donc on n'attend pas que les questions suivantes soient
 * répondues pour la considérer traitée.
 *
 * @returns {{answered: number, reached: number, complete: boolean,
 *            nextNum: number|null, touched: boolean}}
 */
export function questionnaireState(questionnaire, entries = {}) {
    let answered = 0;
    let complete = false;
    let nextNum = null;
    let blockedAt = null;      // la question dont le « Non » a clos le parcours

    for (const [i, q] of questionnaire.questions.entries()) {
        const value = entries[q.num]?.value;

        if (!value) { nextNum = q.num; break; }        // on s'arrête là où il faut reprendre
        answered++;

        if (value === "Non") { complete = true; blockedAt = q.num; break; }   // le « Non » clôt
        if (i === questionnaire.questions.length - 1) complete = true;        // fin du parcours
    }

    return {
        answered,
        // Le dénominateur utile est le nombre de questions effectivement atteintes.
        reached: complete ? answered : answered + 1,
        complete,
        nextNum,
        blockedAt,
        touched: answered > 0,
    };
}

/**
 * Avancement global et par mitigation, sur le périmètre du catalogue disponible.
 * L'avancement affiché se compte en mitigations traitées, pas en questions : une
 * mitigation close par un « Non » à la première question est bel et bien traitée.
 */
export function progress(layer) {
    const per = new Map();
    let answered = 0;
    let questions = 0;

    for (const [id, questionnaire] of layer.catalog) {
        const state = questionnaireState(questionnaire, layer.answers[id] || {});
        per.set(id, { ...state, total: questionnaire.questions.length });
        answered += state.answered;
        questions += questionnaire.questions.length;
    }

    const mitigations = per.size;
    const done = [...per.values()].filter(p => p.complete).length;

    return {
        per,
        answered,                                   // questions répondues
        questions,                                  // questions du catalogue
        mitigations,
        completeMitigations: done,
        startedMitigations: [...per.values()].filter(p => p.touched).length,
        pct: mitigations ? Math.round((done / mitigations) * 100) : 0,
        complete: mitigations > 0 && done === mitigations,
    };
}

/**
 * Où reprendre. Les mitigations jamais ouvertes passent avant celles laissées
 * en cours : au premier usage on parcourt donc l'ensemble des mitigations une
 * fois, et on ne revient sur une mitigation entamée qu'après avoir tout vu.
 *
 * @returns {{mitigation: string, question: number}|null} null si tout est traité
 */
export function nextTarget(layer) {
    const pending = [];

    for (const [id, questionnaire] of layer.catalog) {
        const state = questionnaireState(questionnaire, layer.answers[id] || {});
        if (state.complete) continue;
        pending.push({ id, state });
    }

    const untouched = pending.find(p => !p.state.touched);
    const chosen = untouched || pending[0];
    if (!chosen) return null;

    return { mitigation: chosen.id, question: chosen.state.nextNum };
}

/**
 * Où reprendre une fois tout traité, pour une passe de relecture.
 *
 * On repart du début du catalogue, et on ne s'arrête que sur ce qui mérite
 * d'être rejoué : les mitigations closes par un « Non », directement à cette
 * question. Une mitigation terminée sans aucun « Non » est acquise — rien à y
 * revoir, on la saute. Repasser sur les « Oui » se fait par la matrice, en
 * ouvrant la technique concernée.
 *
 * @param {string|null} after ne considère que ce qui suit cette mitigation
 * @returns {{mitigation: string, question: number}|null}
 */
export function reviewTarget(layer, after = null) {
    const ids = [...layer.catalog.keys()];
    const from = after ? ids.indexOf(after) + 1 : 0;

    for (const id of ids.slice(Math.max(0, from))) {
        const state = questionnaireState(layer.catalog.get(id), layer.answers[id] || {});
        if (state.blockedAt !== null) return { mitigation: id, question: state.blockedAt };
        if (!state.complete) return { mitigation: id, question: state.nextNum };
    }
    return null;
}

/** Mitigations acquises : terminées sans aucun « Non ». */
export function acquiredMitigations(layer) {
    const out = [];
    for (const [id, questionnaire] of layer.catalog) {
        const state = questionnaireState(questionnaire, layer.answers[id] || {});
        if (state.complete && state.blockedAt === null) out.push(id);
    }
    return out;
}

/* ------------------------------------------------------------------- JSON */

function serialisable(layer) {
    const { catalog, ...rest } = layer;   // le catalogue n'a pas à voyager
    return rest;
}

export function toJSON(layer) {
    return JSON.stringify(serialisable(layer), null, 2);
}

export function fromJSON(text) {
    const raw = JSON.parse(text);
    if (raw.schema !== SCHEMA) {
        throw new Error(`Format de layer inconnu (« ${raw.schema ?? "non renseigné"} »).`);
    }
    return hydrate(raw);
}

function hydrate(raw) {
    const layer = { ...createLayer({ name: raw.name }), ...raw, catalog: CATALOG };
    layer.answers = sanitiseAnswers(raw.answers);
    if (!layer.respondent) layer.respondent = { name: "", org: "", email: "" };
    return layer;
}

/** Ne garde que des réponses reconnues, pour ne pas propager un fichier abîmé. */
function sanitiseAnswers(answers) {
    const out = {};
    for (const [mitigationId, entries] of Object.entries(answers || {})) {
        if (!entries || typeof entries !== "object") continue;
        for (const [num, entry] of Object.entries(entries)) {
            const value = typeof entry === "string" ? entry : entry?.value;
            if (!ANSWERS.includes(value)) continue;
            (out[mitigationId] ??= {})[num] = {
                value,
                tool: entry?.tool || "",
                note: entry?.note || "",
                at: entry?.at || null,
            };
        }
    }
    return out;
}

/* ------------------------------------------------------------------ Excel */

const RESPONSE_SHEET = "Réponses";

/**
 * Construit le classeur d'export.
 * Trois feuilles : les réponses à plat (ré-importables), le niveau par
 * mitigation, et une matrice reprenant la disposition de l'onglet Matrice
 * du classeur d'origine.
 */
export function toWorkbook(layer, data, scores, levels) {
    const wb = XLSX.utils.book_new();

    /* --- Réponses --- */
    const rows = [];
    for (const [id, questionnaire] of layer.catalog) {
        for (const q of questionnaire.questions) {
            const entry = layer.answers[id]?.[q.num];
            rows.push({
                "Mitigation": id,
                "Nom": questionnaire.name,
                "Numéro": q.num,
                "Question": q.text,
                "Réponse": entry?.value || "",
                "Outil (si applicable)": entry?.tool || "",
                "Niveau attribué": q.level,
                "Vérification documentaire": q.docRequired ? "Oui" : "Non",
                "Références": q.references,
                "Répondu le": entry?.at ? entry.at.slice(0, 10) : "",
            });
        }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), RESPONSE_SHEET);

    /* --- Mitigations --- */
    const mitigationRows = data.mitigations.map(m => ({
        "ID": m.id,
        "Mitigation": m.name,
        "Niveau (0-4)": levels.has(m.id) ? levels.get(m.id) : "",
        "Questionnaire disponible": layer.catalog.has(m.id) ? "Oui" : "Non",
        "Techniques couvertes": m.techniques.length,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mitigationRows), "Mitigations");

    /* --- Matrice : une colonne par tactique, trois lignes par technique --- */
    const columns = data.tactics.map(t => {
        const cells = [t.name, String(data.byTactic.get(t.shortname)?.length ?? 0)];
        for (const tech of data.byTactic.get(t.shortname) || []) {
            const cell = scores.get(tech.id);
            cells.push(tech.id, tech.name,
                cell?.state === "no-mitigation" ? "pas de mitigation"
                    : cell?.score === null || cell?.score === undefined ? ""
                        : round2(cell.score));
        }
        return cells;
    });
    const height = Math.max(...columns.map(c => c.length));
    const grid = Array.from({ length: height }, (_, r) => columns.map(c => c[r] ?? ""));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grid), "Matrice");

    /* --- Métadonnées : tracer la version du référentiel et la méthode retenue --- */
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Layer", layer.name],
        ["Version ATT&CK Enterprise", data.version],
        ["Exporté le", new Date().toISOString().slice(0, 19).replace("T", " ")],
        ["Répondant", layer.respondent?.name || ""],
        ["Organisation", layer.respondent?.org || ""],
        ["Courriel", layer.respondent?.email || ""],
        ["Mode de notation", layer.scoring],
        ["Mode d'agrégation", layer.aggregation],
    ]), "Métadonnées");

    return wb;
}

const round2 = n => Math.round(n * 100) / 100;

/**
 * Lit un classeur.
 *
 * Deux formats acceptés :
 *  - l'export de l'outil (feuille « Réponses », colonnes Mitigation/Numéro/Réponse) ;
 *  - le classeur d'origine « Mitigations MITRE ATT&CK v9.xlsx », dont chaque
 *    onglet M10xx porte les réponses en colonne E à partir de la ligne 12.
 */
export function fromWorkbook(wb, { name } = {}) {
    const layer = createLayer({ name });
    let found = 0;

    if (wb.SheetNames.includes(RESPONSE_SHEET)) {
        for (const row of XLSX.utils.sheet_to_json(wb.Sheets[RESPONSE_SHEET])) {
            const id = String(row["Mitigation"] ?? "").trim();
            const num = Number(row["Numéro"]);
            const value = String(row["Réponse"] ?? "").trim();
            if (!id || !num || !ANSWERS.includes(value)) continue;
            (layer.answers[id] ??= {})[num] = {
                value,
                tool: String(row["Outil (si applicable)"] ?? "").trim(),
                note: "",
                at: null,
            };
            found++;
        }
    } else {
        for (const sheetName of wb.SheetNames) {
            const id = sheetName.trim();
            if (!/^M\d{4}$/.test(id)) continue;
            const sheet = wb.Sheets[sheetName];
            // Le questionnaire commence en ligne 12 ; A=Numéro, E=Réponse, F=Outil.
            for (let row = 12; row <= 60; row++) {
                const num = Number(sheet[`A${row}`]?.v);
                const value = String(sheet[`E${row}`]?.v ?? "").trim();
                if (!num || !ANSWERS.includes(value)) continue;
                (layer.answers[id] ??= {})[num] = {
                    value,
                    tool: String(sheet[`F${row}`]?.v ?? "").trim(),
                    note: "",
                    at: null,
                };
                found++;
            }
        }
    }

    if (!found) {
        throw new Error(
            "Aucune réponse trouvée. Attendu : la feuille « Réponses » d'un export de l'outil, " +
            "ou le classeur d'origine avec les réponses en colonne E des onglets M10xx."
        );
    }
    layer.answers = sanitiseAnswers(layer.answers);
    return layer;
}
