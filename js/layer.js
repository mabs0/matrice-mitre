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

// Le layer travaille sur les mitigations évaluables : celle qui n'a pas de
// questionnaire n'a pas de maturité à mesurer, elle n'entre ni dans le parcours
// ni dans l'avancement.
import { QUESTIONNAIRES, ANSWERS } from "./catalog.js";
import { resolvedEntries, writeTarget, groupOf, primaryOf, SHARED_GROUPS } from "./shared-questions.js";

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
        catalog: QUESTIONNAIRES,   // référence de travail, jamais sérialisée
    };
}

/**
 * Enregistre une réponse.
 *
 * Si la question est commune à plusieurs mitigations, la réponse est écrite chez
 * son porteur : elle vaut alors pour toutes, chacune l'appliquant à son propre
 * niveau. Voir shared-questions.js.
 *
 * @returns {number} nombre de réponses devenues inatteignables et effacées
 */
export function setAnswer(layer, mitigationId, num, { value, tool, note } = {}) {
    const target = writeTarget(mitigationId, num);
    if (!layer.answers[target.mitigation]) layer.answers[target.mitigation] = {};
    const previous = layer.answers[target.mitigation][target.question] || {};
    layer.answers[target.mitigation][target.question] = {
        ...previous,
        value: value ?? previous.value ?? null,
        tool: tool ?? previous.tool ?? "",
        note: note ?? previous.note ?? "",
        at: new Date().toISOString(),          // horodatage par question, pour l'auditabilité
    };
    // Le curseur suit la mitigation où l'on répond, pas celle qui porte.
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
 *
 * Les questions communes échappent à cet effacement : leur réponse appartient au
 * groupe, pas au parcours de cette mitigation, et elle reste atteignable dans
 * les autres. L'effacer ferait perdre une réponse réellement donnée.
 */
function dropUnreachable(layer, mitigationId, num) {
    const questionnaire = layer.catalog?.get(mitigationId);
    if (!questionnaire) return 0;

    const from = questionnaire.questions.findIndex(q => String(q.num) === String(num));
    if (from < 0) return 0;

    let dropped = 0;
    for (const q of questionnaire.questions.slice(from + 1)) {
        if (groupOf(mitigationId, q.num)) continue;
        if (layer.answers[mitigationId]?.[q.num]) {
            delete layer.answers[mitigationId][q.num];
            dropped++;
        }
    }
    return dropped;
}

export const answerOf = (layer, mitigationId, num) =>
    resolvedEntries(layer, mitigationId)[num]?.value ?? null;

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
 * La mitigation a-t-elle réellement été travaillée par le répondant ?
 *
 * On ne peut pas se contenter de « elle a au moins une réponse » : une question
 * commune répondue depuis une autre mitigation en pré-remplit une ici, sans que
 * celle-ci ait jamais été ouverte. On regarde donc ses questions propres. Sans
 * quoi une mitigation pré-remplie serait reléguée en fin de première passe,
 * alors que le répondant ne l'a pas vue.
 */
function engaged(layer, mitigationId, questionnaire) {
    const own = layer.answers?.[mitigationId] ?? {};
    const proper = questionnaire.questions.filter(q => !groupOf(mitigationId, q.num));
    if (!proper.length) return Object.keys(own).length > 0;
    return proper.some(q => own[q.num]?.value);
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
        const state = questionnaireState(questionnaire, resolvedEntries(layer, id));
        per.set(id, {
            ...state,
            engaged: engaged(layer, id, questionnaire),
            total: questionnaire.questions.length,
        });
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
        startedMitigations: [...per.values()].filter(p => p.engaged).length,
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
        const state = questionnaireState(questionnaire, resolvedEntries(layer, id));
        if (state.complete) continue;
        pending.push({ id, state, engaged: engaged(layer, id, questionnaire) });
    }

    const untouched = pending.find(p => !p.engaged);
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
        const state = questionnaireState(layer.catalog.get(id), resolvedEntries(layer, id));
        if (state.blockedAt !== null) return { mitigation: id, question: state.blockedAt };
        if (!state.complete) return { mitigation: id, question: state.nextNum };
    }
    return null;
}

/** Mitigations acquises : terminées sans aucun « Non ». */
export function acquiredMitigations(layer) {
    const out = [];
    for (const [id, questionnaire] of layer.catalog) {
        const state = questionnaireState(questionnaire, resolvedEntries(layer, id));
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
    const layer = { ...createLayer({ name: raw.name }), ...raw, catalog: QUESTIONNAIRES };
    layer.answers = sanitiseAnswers(raw.answers);
    if (!layer.respondent) layer.respondent = { name: "", org: "", email: "" };
    return layer;
}

/**
 * Ne garde que des réponses reconnues, pour ne pas propager un fichier abîmé,
 * et ramène chaque question commune chez son porteur.
 *
 * Cette remise en ordre est indispensable : la lecture privilégie la réponse
 * propre à la mitigation, donc une réponse restée chez un membre non porteur
 * masquerait celle du groupe.
 */
export function sanitiseAnswers(answers) {
    const out = {};
    for (const [mitigationId, entries] of Object.entries(answers || {})) {
        if (!entries || typeof entries !== "object") continue;
        const questionnaire = QUESTIONNAIRES.get(mitigationId);
        for (const [num, entry] of Object.entries(entries)) {
            const value = typeof entry === "string" ? entry : entry?.value;
            if (!ANSWERS.includes(value)) continue;
            // Une réponse à une question qui n'existe pas fausserait la note.
            if (questionnaire && !questionnaire.questions.some(q => String(q.num) === String(num))) continue;
            (out[mitigationId] ??= {})[num] = {
                value,
                tool: entry?.tool || "",
                note: entry?.note || "",
                at: entry?.at || null,
            };
        }
    }
    return canonicaliseShared(out);
}

/**
 * Déplace la réponse de chaque groupe chez son porteur et vide les autres
 * membres. En cas de désaccord entre membres — possible depuis un classeur
 * rempli à la main — le premier membre renseigné, dans l'ordre de déclaration
 * du groupe, fait foi.
 */
function canonicaliseShared(answers) {
    for (const group of SHARED_GROUPS) {
        const held = group.members
            .map(m => ({ m, entry: answers[m.mitigation]?.[m.question] }))
            .filter(x => x.entry);
        if (!held.length) continue;

        const primary = primaryOf(group);
        const kept = held[0].entry;
        for (const { m } of held) delete answers[m.mitigation][m.question];
        (answers[primary.mitigation] ??= {})[primary.question] = kept;
    }

    // Une mitigation vidée de ses seules réponses communes ne doit pas laisser
    // d'entrée creuse, qui se retrouverait dans le fichier exporté.
    for (const [id, entries] of Object.entries(answers)) {
        if (!Object.keys(entries).length) delete answers[id];
    }
    return answers;
}
