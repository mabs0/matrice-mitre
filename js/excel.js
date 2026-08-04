/* ============================================================================
   Le classeur Excel : construction, mise en forme, relecture.

   Cinq feuilles, deux usages. « Réponses » est le contrat de relecture — c'est
   elle, et elle seule, que l'import relit. « Matrice » donne la silhouette
   reconnaissable, à lire et à imprimer. « Techniques », « Mitigations » sont à
   plat : elles se trient, se filtrent et se croisent, ce qu'une grille ne sait
   pas faire. « Métadonnées » trace la version du référentiel et la méthode.

   La bibliothèque est passée en paramètre plutôt qu'importée : le banc lui
   donne le module npm, le navigateur l'objet chargé depuis le CDN, et rien ici
   ne dépend d'un global.
   ========================================================================= */

import { ANSWERS, LEVEL_LABELS } from "./catalog.js";
import { resolvedEntries } from "./shared-questions.js";
import { createLayer, sanitiseAnswers } from "./layer.js";
import { CELL_STATE } from "./scoring.js";

const RESPONSE_SHEET = "Réponses";

/* ------------------------------------------------------------------ couleurs

   La rampe est celle du **thème clair** de `tokens.css` : un classeur a un fond
   blanc, la rampe sombre y serait illisible. Elle est recopiée ici parce que le
   navigateur n'est pas seul à produire le fichier — le banc l'écrit sans CSS —
   et une assertion vérifie que les deux jeux ne divergent pas. */

export const RAMPE = ["FFFEA195", "FFEF852E", "FFC27B00", "FF53890C", "FF067138"];
const ENCRE = ["FF0B0B0B", "FF0B0B0B", "FF0B0B0B", "FF0B0B0B", "FFFFFFFF"];

const ENTETE = "FF2A3140";          // bandeau d'en-tête, texte blanc
const NEUTRE = "FFEFEFEB";          // surface-3 du thème clair
const GRIS = "FFA8A6A0";            // ce qui n'est pas chiffrable
const TRAIT = "FFDCDCD5";           // border du thème clair

/** Teintes pâles de la colonne des réponses : lisibles derrière du texte. */
const REPONSE_FONDS = { Oui: "FFDCEFD2", Non: "FFFBD9D3", "N/A": "FFECECE8" };

const remplir = argb => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const dxf = argb => ({ fill: { type: "pattern", pattern: "solid", bgColor: { argb } } });

/* ------------------------------------------------------ éléments récurrents */

/**
 * Prépare une feuille tabulaire : bandeau d'en-tête, volets gelés sur la
 * première ligne, filtre automatique. Ce trio est ce qui rend une feuille
 * utilisable — sans gel, on perd les intitulés au premier défilement.
 */
function tableau(wb, nom, colonnes) {
    const ws = wb.addWorksheet(nom, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = colonnes;

    const tete = ws.getRow(1);
    tete.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    tete.fill = remplir(ENTETE);
    tete.alignment = { vertical: "middle", wrapText: true };
    tete.height = 26;
    return ws;
}

/** Ferme le filtre sur l'étendue réellement remplie. */
function filtrer(ws) {
    if (ws.rowCount < 2) return;
    ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: ws.columnCount },
    };
}

/** Trait de séparation léger sous chaque ligne : un tableau long se suit mieux. */
function rayer(ws) {
    for (let r = 2; r <= ws.rowCount; r++) {
        ws.getRow(r).border = { bottom: { style: "hair", color: { argb: TRAIT } } };
    }
}

/**
 * Mise en forme conditionnelle de la maturité.
 *
 * Conditionnelle et non peinte à la main : la couleur suit alors le tri, le
 * filtre et une valeur retouchée. Les niveaux sont des entiers, les scores
 * agrégés des décimaux — d'où deux formes de règle.
 */
function couleursMaturite(ws, ref, { decimal = false } = {}) {
    const rules = [];
    for (let n = 0; n <= 4; n++) {
        rules.push(decimal
            ? {
                type: "cellIs", operator: "between", priority: n + 1,
                // Chaque score se rattache au palier dont il est le plus proche.
                formulae: [n === 0 ? "-0.001" : String(n - 0.5), n === 4 ? "4.001" : String(n + 0.4999)],
                style: dxf(RAMPE[n]),
            }
            : {
                type: "cellIs", operator: "equal", priority: n + 1,
                formulae: [String(n)],
                style: dxf(RAMPE[n]),
            });
    }
    ws.addConditionalFormatting({ ref, rules });
}

/* --------------------------------------------------------------- le classeur */

/**
 * Construit le classeur.
 * @param {object} ExcelJS la bibliothèque
 * @param {object} layer
 * @param {object} data référentiel ATT&CK normalisé
 * @param {Map} scores par technique, tel que produit par `buildMatrixScores`
 * @param {Map} levels niveau par mitigation
 */
export function buildWorkbook(ExcelJS, layer, data, scores, levels) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "CTRM";
    wb.created = new Date();

    feuilleReponses(wb, layer);
    feuilleMitigations(wb, layer, data, levels);
    feuilleTechniques(wb, data, scores);
    feuilleMatrice(wb, data, scores);
    feuilleMetadonnees(wb, layer, data);

    return wb;
}

/* --- Réponses : le contrat de relecture ------------------------------------ */

function feuilleReponses(wb, layer) {
    const ws = tableau(wb, RESPONSE_SHEET, [
        { header: "Mitigation", key: "id", width: 12 },
        { header: "Nom", key: "nom", width: 30 },
        { header: "Numéro", key: "num", width: 8 },
        { header: "Question", key: "question", width: 72 },
        { header: "Réponse", key: "reponse", width: 11 },
        { header: "Outil (si applicable)", key: "outil", width: 22 },
        { header: "Niveau attribué", key: "niveau", width: 9 },
        { header: "Vérification documentaire", key: "doc", width: 13 },
        { header: "Références", key: "refs", width: 30 },
        { header: "Répondu le", key: "date", width: 12 },
    ]);

    for (const [id, questionnaire] of layer.catalog) {
        // Réponses résolues : une question commune apparaît renseignée sur
        // chacune des mitigations concernées, ce qui est ce qu'on attend en
        // lisant l'export.
        const entries = resolvedEntries(layer, id);
        for (const q of questionnaire.questions) {
            const entry = entries[q.num];
            ws.addRow({
                id,
                nom: questionnaire.name,
                num: q.num,
                question: q.text,
                reponse: entry?.value || "",
                outil: entry?.tool || "",
                niveau: q.level,
                doc: q.docRequired ? "Oui" : "Non",
                refs: q.references,
                date: entry?.at ? entry.at.slice(0, 10) : "",
            });
        }
    }

    ws.getColumn("question").alignment = { wrapText: true, vertical: "top" };
    ws.getColumn("refs").alignment = { wrapText: true, vertical: "top" };
    for (const key of ["num", "niveau", "doc", "reponse"]) {
        ws.getColumn(key).alignment = { horizontal: "center", vertical: "top" };
    }
    filtrer(ws);
    rayer(ws);

    const derniere = ws.rowCount;
    if (derniere < 2) return ws;

    // La colonne des réponses est la seule qu'on retouche à la main dans le
    // classeur : liste fermée pour ne pas y écrire une valeur que l'import
    // ignorerait en silence, et couleur pour la relire d'un coup d'œil.
    ws.dataValidations.add(`E2:E${derniere}`, {
        type: "list",
        allowBlank: true,
        formulae: [`"${ANSWERS.join(",")}"`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Réponse attendue",
        error: `Valeurs acceptées à la relecture : ${ANSWERS.join(", ")}.`,
    });
    ws.addConditionalFormatting({
        ref: `E2:E${derniere}`,
        rules: ANSWERS.map((valeur, i) => ({
            type: "cellIs", operator: "equal", priority: i + 1,
            formulae: [`"${valeur}"`],
            style: dxf(REPONSE_FONDS[valeur] ?? NEUTRE),
        })),
    });
    return ws;
}

/* --- Mitigations ---------------------------------------------------------- */

function feuilleMitigations(wb, layer, data, levels) {
    const ws = tableau(wb, "Mitigations", [
        { header: "ID", key: "id", width: 10 },
        { header: "Mitigation", key: "nom", width: 42 },
        { header: "Niveau (0-4)", key: "niveau", width: 11 },
        { header: "Palier atteint", key: "palier", width: 16 },
        { header: "Questionnaire disponible", key: "dispo", width: 13 },
        { header: "Techniques couvertes", key: "couvertes", width: 12 },
    ]);

    for (const m of data.mitigations) {
        const niveau = levels.has(m.id) ? levels.get(m.id) : "";
        ws.addRow({
            id: m.id,
            nom: m.name,
            niveau,
            palier: niveau === "" ? "non évalué" : LEVEL_LABELS[niveau] ?? "",
            dispo: layer.catalog.has(m.id) ? "Oui" : "Non",
            couvertes: m.techniques.length,
        });
    }

    for (const key of ["niveau", "dispo", "couvertes"]) {
        ws.getColumn(key).alignment = { horizontal: "center" };
    }
    ws.getColumn("niveau").font = { bold: true };
    filtrer(ws);
    rayer(ws);
    if (ws.rowCount > 1) couleursMaturite(ws, `C2:C${ws.rowCount}`);
    return ws;
}

/* --- Techniques, à plat --------------------------------------------------- */

function feuilleTechniques(wb, data, scores) {
    const ws = tableau(wb, "Techniques", [
        { header: "Tactique", key: "tactique", width: 22 },
        { header: "ID", key: "id", width: 10 },
        { header: "Technique", key: "nom", width: 40 },
        { header: "Score", key: "score", width: 8 },
        { header: "État", key: "etat", width: 17 },
        { header: "Mitigations couvrantes", key: "nb", width: 12 },
        { header: "Mitigations", key: "liste", width: 34 },
        { header: "Sous-techniques", key: "sous", width: 12 },
    ]);

    // Une ligne par couple tactique / technique : une technique rattachée à
    // deux tactiques apparaît deux fois, exactement comme dans la grille. C'est
    // ce qui permet de croiser par tactique sans se tromper de total.
    for (const tactique of data.tactics) {
        for (const tech of data.byTactic.get(tactique.shortname) ?? []) {
            const cell = scores.get(tech.id);
            const chiffrable = cell?.state === CELL_STATE.SCORED;
            ws.addRow({
                tactique: tactique.name,
                id: tech.id,
                nom: tech.name,
                score: chiffrable ? round2(cell.score) : "",
                etat: cell?.state === CELL_STATE.NO_MITIGATION ? "pas de mitigation"
                    : chiffrable ? "évalué" : "non évalué",
                nb: cell?.mitigations?.length ?? 0,
                liste: (cell?.mitigations ?? []).map(m => m.id).join(" "),
                sous: data.subTechniques.filter(s => s.id.startsWith(`${tech.id}.`)).length,
            });
        }
    }

    ws.getColumn("score").numFmt = "0.00";
    for (const key of ["score", "nb", "sous"]) {
        ws.getColumn(key).alignment = { horizontal: "center" };
    }
    ws.getColumn("liste").alignment = { wrapText: true, vertical: "top" };
    filtrer(ws);
    rayer(ws);
    if (ws.rowCount > 1) couleursMaturite(ws, `D2:D${ws.rowCount}`, { decimal: true });
    return ws;
}

/* --- Matrice : la grille -------------------------------------------------- */

function feuilleMatrice(wb, data, scores) {
    // Les deux premières lignes sont figées : les noms de tactiques et leur
    // effectif. Les colonnes, elles, ne le sont pas — on lit de gauche à droite.
    const ws = wb.addWorksheet("Matrice", { views: [{ state: "frozen", ySplit: 2 }] });

    const colonnes = data.tactics.map(t => data.byTactic.get(t.shortname) ?? []);
    const hauteur = Math.max(...colonnes.map(c => c.length), 0);

    const tete = ws.getRow(1);
    const compte = ws.getRow(2);
    data.tactics.forEach((t, i) => {
        const c = tete.getCell(i + 1);
        c.value = t.name;
        c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        c.fill = remplir(ENTETE);
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

        const n = compte.getCell(i + 1);
        n.value = `${colonnes[i].length} techniques`;
        n.font = { size: 8, color: { argb: GRIS } };
        n.alignment = { horizontal: "center" };

        ws.getColumn(i + 1).width = 26;
    });
    tete.height = 30;

    for (let r = 0; r < hauteur; r++) {
        const ligne = ws.getRow(r + 3);
        ligne.height = 26;
        colonnes.forEach((techniques, col) => {
            const tech = techniques[r];
            if (!tech) return;
            const cell = ligne.getCell(col + 1);
            const état = scores.get(tech.id);
            const chiffrable = état?.state === CELL_STATE.SCORED;

            // La couleur ne porte jamais l'information seule : la cellule
            // imprime son score sous le nom de la technique.
            cell.value = `${tech.id} · ${tech.name}\n${
                chiffrable ? round2(état.score).toFixed(2).replace(".", ",")
                    : état?.state === CELL_STATE.NO_MITIGATION ? "pas de mitigation" : "non évalué"}`;
            cell.alignment = { wrapText: true, vertical: "middle", indent: 1 };
            cell.border = { bottom: { style: "hair", color: { argb: TRAIT } } };
            cell.font = { size: 9, color: { argb: chiffrable ? ENCRE[état.level] : GRIS } };
            // Peinte et non conditionnelle : la valeur de la cellule est du
            // texte, aucune règle ne saurait en déduire un palier.
            cell.fill = remplir(chiffrable ? RAMPE[état.level] : NEUTRE);
        });
    }

    legende(ws, hauteur + 4);
    return ws;
}

/** Rappel de la rampe sous la grille : sans elle, les couleurs sont muettes. */
function legende(ws, ligne) {
    const titre = ws.getRow(ligne).getCell(1);
    titre.value = "Échelle de maturité";
    titre.font = { bold: true, size: 9 };

    const paliers = ws.getRow(ligne + 1);
    for (let n = 0; n <= 4; n++) {
        const c = paliers.getCell(n + 1);
        c.value = `${n} — ${LEVEL_LABELS[n]}`;
        c.fill = remplir(RAMPE[n]);
        c.font = { size: 9, color: { argb: ENCRE[n] } };
        c.alignment = { horizontal: "center" };
    }
    const suite = ws.getRow(ligne + 2);
    suite.getCell(1).value = "Fond gris : technique sans mitigation, ou mitigations non encore évaluées.";
    suite.getCell(1).font = { size: 9, color: { argb: GRIS } };
}

/* --- Métadonnées ---------------------------------------------------------- */

function feuilleMetadonnees(wb, layer, data) {
    const ws = wb.addWorksheet("Métadonnées");
    ws.columns = [{ width: 30 }, { width: 46 }];

    const lignes = [
        ["Layer", layer.name],
        ["Version ATT&CK Enterprise", data.version],
        ["Exporté le", new Date().toISOString().slice(0, 19).replace("T", " ")],
        ["Répondant", layer.respondent?.name || ""],
        ["Organisation", layer.respondent?.org || ""],
        ["Courriel", layer.respondent?.email || ""],
        ["Mode de notation", layer.scoring],
        ["Mode d'agrégation", layer.aggregation],
    ];
    for (const [libelle, valeur] of lignes) {
        const row = ws.addRow([libelle, valeur]);
        row.getCell(1).font = { bold: true, size: 10 };
        row.getCell(1).alignment = { vertical: "top" };
        row.getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
    return ws;
}

const round2 = n => Math.round(n * 100) / 100;

/* ------------------------------------------------------------- la relecture */

/**
 * Relit un classeur produit par l'outil, sa feuille « Réponses ».
 *
 * Un seul format est accepté, celui qu'on écrit. Le classeur de travail
 * d'origine n'est pas lu : il n'est pas le point d'entrée de l'outil, et le
 * reconnaître demandait de deviner une disposition de cellules qui n'a rien de
 * contractuel.
 */
export function readWorkbook(wb, { name } = {}) {
    const layer = createLayer({ name });
    const ws = wb.getWorksheet(RESPONSE_SHEET);

    if (!ws) {
        throw new Error(
            `Feuille « ${RESPONSE_SHEET} » absente. Attendu : un classeur exporté par cet outil.`
        );
    }

    // Les colonnes sont retrouvées par leur intitulé, pas par leur rang : on
    // peut ainsi en insérer une sans casser la relecture.
    const entete = new Map();
    ws.getRow(1).eachCell((cell, col) => entete.set(texte(cell.value), col));
    const colonne = nom => entete.get(nom);

    let found = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
        const ligne = ws.getRow(r);
        const lire = nom => {
            const col = colonne(nom);
            return col ? texte(ligne.getCell(col).value) : "";
        };
        const id = lire("Mitigation");
        const num = Number(lire("Numéro"));
        const value = lire("Réponse");
        if (!id || !num || !ANSWERS.includes(value)) continue;
        (layer.answers[id] ??= {})[num] = {
            value,
            tool: lire("Outil (si applicable)"),
            note: "",
            at: null,
        };
        found++;
    }

    if (!found) {
        throw new Error(
            `La feuille « ${RESPONSE_SHEET} » ne contient aucune réponse exploitable. ` +
            "Attendu : les colonnes Mitigation, Numéro et Réponse."
        );
    }
    layer.answers = sanitiseAnswers(layer.answers);
    return layer;
}

/**
 * Valeur d'une cellule en texte. ExcelJS rend selon le cas une chaîne, un
 * nombre, une formule, un texte enrichi ou un lien : tout est ramené au texte
 * affiché, seul contenu qui ait un sens ici.
 */
function texte(valeur) {
    if (valeur === null || valeur === undefined) return "";
    if (typeof valeur === "object") {
        if (Array.isArray(valeur.richText)) return valeur.richText.map(t => t.text).join("").trim();
        if ("text" in valeur) return String(valeur.text).trim();
        if ("result" in valeur) return String(valeur.result).trim();
        return "";
    }
    return String(valeur).trim();
}

/* ------------------------------------------------- chargement à la demande */

const CDN = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
let chargement = null;

/**
 * Charge la bibliothèque au premier besoin, et une seule fois.
 *
 * Elle ne sert qu'à l'export et à l'import : la faire attendre épargne 250 Ko
 * au démarrage, alors que la page a déjà le référentiel ATT&CK à télécharger.
 * Le banc, lui, la pose sur `globalThis` et rien n'est demandé au réseau.
 */
export function loadExcel() {
    if (globalThis.ExcelJS) return Promise.resolve(globalThis.ExcelJS);
    chargement ??= new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = CDN;
        s.onload = () => globalThis.ExcelJS
            ? resolve(globalThis.ExcelJS)
            : reject(new Error("bibliothèque Excel chargée mais introuvable"));
        s.onerror = () => {
            chargement = null;
            reject(new Error("bibliothèque Excel inaccessible — vérifiez la connexion"));
        };
        document.head.appendChild(s);
    });
    return chargement;
}
