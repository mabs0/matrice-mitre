/* ============================================================================
   Notation.

   Deux étages, repris de l'Excel :

     1. niveau d'une mitigation, depuis les réponses de son questionnaire
        (formule L11 de chaque onglet M10xx)
     2. score d'une technique, en agrégeant les mitigations qui la couvrent
        (formules =MOYENNE(...) de l'onglet Matrice)

   Les deux étages sont paramétrables : le modèle de maturité à retenir n'est
   pas arbitré, et le résultat change beaucoup selon la règle choisie. Le mode
   retenu est donc porté par le layer et affiché dans l'interface, plutôt que
   figé dans le code.
   ========================================================================= */

import { resolvedEntries } from "./shared-questions.js";

export const SCORING_MODES = {
    "last-yes": {
        label: "Niveau du dernier « Oui »",
        hint: "Reproduit la formule de l'Excel : le niveau de la dernière question répondue « Oui ».",
    },
    "cumulative": {
        label: "Cumulatif strict",
        hint: "N'accorde le niveau N que si toutes les questions des niveaux 1 à N sont « Oui ». Lecture cumulative de la maturité.",
    },
    "average": {
        label: "Moyenne des questions",
        hint: "Moyenne des niveaux des questions répondues « Oui », rapportée aux questions non « N/A ».",
    },
};

export const AGGREGATION_MODES = {
    "average": { label: "Moyenne", hint: "La technique vaut la moyenne des mitigations qui la couvrent." },
    "min": { label: "Minimum", hint: "Vue pessimiste : la technique vaut sa mitigation la plus faible." },
    "max": { label: "Maximum", hint: "Vue optimiste : la technique vaut sa mitigation la plus forte." },
};

/* -------------------------------------------------------------- mitigations */

/**
 * Niveau de maturité 0..4 d'une mitigation.
 * @param {object} questionnaire entrée du catalogue
 * @param {Record<string, {value: string}>} answers réponses indexées par numéro de question
 * @param {keyof SCORING_MODES} mode
 * @returns {number|null} null si aucune question n'a été répondue
 */
export function mitigationLevel(questionnaire, answers = {}, mode = "last-yes", layer = null) {
    const base = ownLevel(questionnaire, answers, mode);
    if (base === null || base === 0) return base;
    // Le bonus/malus ne s'applique qu'à un niveau déjà acquis : c'est le
    // court-circuit de la formule, qui rend 0 sans rien ajouter.
    return clamp(base + contributionOf(questionnaire, layer));
}

/** Niveau tiré des seules questions de la mitigation. */
function ownLevel(questionnaire, answers = {}, mode = "last-yes") {
    if (!questionnaire) return null;

    const rows = reachable(questionnaire.questions.map(q => ({ q, value: answers[q.num]?.value ?? null })));
    if (!rows.some(r => r.value)) return null;          // questionnaire non commencé

    const yes = rows.filter(r => r.value === "Oui");

    if (mode === "average") {
        // On ignore les N/A : elles ne concernent pas le périmètre du répondant.
        const scoped = rows.filter(r => r.value && r.value !== "N/A");
        if (!scoped.length) return 0;
        const sum = scoped.reduce((acc, r) => acc + (r.value === "Oui" ? r.q.level : 0), 0);
        return clamp(sum / scoped.length);
    }

    if (mode === "cumulative") {
        // On monte niveau par niveau, et on s'arrête au premier palier incomplet.
        let attained = 0;
        for (let level = 1; level <= 4; level++) {
            const atLevel = rows.filter(r => r.q.level === level);
            if (!atLevel.length) continue;                                  // palier sans question
            const pending = atLevel.filter(r => !r.value);
            const failing = atLevel.filter(r => r.value === "Non");
            if (pending.length || failing.length) break;                    // palier non acquis
            attained = level;
        }
        return clamp(attained);
    }

    // « last-yes » : niveau de la dernière question répondue « Oui », dans
    // l'ordre du questionnaire. Équivaut au maximum tant que les niveaux visés
    // sont croissants au fil du questionnaire, ce qui est le cas partout.
    if (!yes.length) return 0;
    return clamp(yes[yes.length - 1].q.level);
}

/**
 * Ne garde que les questions que le parcours atteint réellement.
 *
 * Le questionnaire est progressif : un « Non » le clôt, et ce qui suit n'aurait
 * jamais été posé. La note s'arrête donc là, sans considérer ce qui pourrait
 * subsister au-delà — typiquement la réponse à une question commune, conservée
 * parce qu'une autre mitigation en a besoin. Une mitigation est notée sur son
 * propre parcours, pas sur le contenu du stockage.
 */
function reachable(rows) {
    const stop = rows.findIndex(r => r.value === "Non");
    return stop < 0 ? rows : rows.slice(0, stop + 1);
}

const clamp = n => Math.max(0, Math.min(4, n));

/**
 * Bonus/malus apporté par des questions d'autres mitigations.
 *
 * Le classeur en contient au moins un cas : la note de M1016 est ajustée de
 * ±0,25 selon la réponse à la question 5 de M1049, qui est affichée dans
 * l'onglet M1016 par simple renvoi de cellule. La question n'est donc posée
 * qu'une fois et sa réponse alimente deux mitigations.
 *
 * Une contribution se déclare dans le catalogue :
 *   contributions: [{ from: "M1049", question: 5, weight: 0.25 }]
 *
 * « Oui » ajoute le poids, « Non » le retire, « N/A » et l'absence de réponse
 * ne changent rien.
 */
function contributionOf(questionnaire, layer) {
    if (!questionnaire?.contributions?.length || !layer) return 0;

    let delta = 0;
    for (const { from, question, weight } of questionnaire.contributions) {
        // Résolu, au cas où la question source serait elle-même commune.
        const value = resolvedEntries(layer, from)[question]?.value;
        if (value === "Oui") delta += weight;
        else if (value === "Non") delta -= weight;
    }
    return delta;
}

/* --------------------------------------------------------------- techniques */

export const CELL_STATE = {
    NO_MITIGATION: "no-mitigation",   // aucune mitigation ATT&CK ne couvre la technique
    UNSCORED: "unscored",             // couverte, mais aucun questionnaire renseigné
    SCORED: "scored",
};

/**
 * Construit les scores de la matrice à partir d'un layer.
 * @returns {Map<string, {state: string, score: number|null, level: number|null,
 *                        mitigations: Array<{id: string, level: number|null}>}>}
 */
export function buildMatrixScores(data, layer) {
    const out = new Map();
    const levels = mitigationLevels(layer);

    for (const tech of data.techniques) {
        const covering = data.coverage.get(tech.id);

        if (!covering || covering.size === 0) {
            out.set(tech.id, { state: CELL_STATE.NO_MITIGATION, score: null, level: null, mitigations: [] });
            continue;
        }

        const mitigations = [...covering].sort().map(id => ({ id, level: levels.get(id) ?? null }));
        const scored = mitigations.filter(m => m.level !== null).map(m => m.level);

        if (!scored.length) {
            out.set(tech.id, { state: CELL_STATE.UNSCORED, score: null, level: null, mitigations });
            continue;
        }

        const score = aggregate(scored, layer.aggregation);
        out.set(tech.id, {
            state: CELL_STATE.SCORED,
            score,
            level: Math.round(score),
            mitigations,
        });
    }
    return out;
}

function aggregate(values, mode = "average") {
    if (mode === "min") return Math.min(...values);
    if (mode === "max") return Math.max(...values);
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Niveau moyen de chaque tactique, pour la rosace du tableau de bord.
 *
 * Par tactique et non par mitigation : c'est l'axe de lecture d'ATT&CK, celui
 * de la matrice, et celui de la question qu'on se pose devant elle — « où
 * sommes-nous faibles ? » se répond en phases d'attaque.
 *
 * Une tactique dont aucune technique n'est notée vaut `null` et non zéro : rien
 * n'a été évalué, ce qui ne veut pas dire que rien n'est en place. Le tracé la
 * pose au centre, mais elle ne pèse pas sur la moyenne.
 *
 * @returns {Map<string, number|null>} indexée par `shortname` de tactique
 */
export function tacticLevels(data, scores) {
    const out = new Map();
    for (const tactic of data.tactics) {
        const notes = (data.byTactic.get(tactic.shortname) ?? [])
            .map(tech => scores.get(tech.id))
            .filter(cell => cell?.state === CELL_STATE.SCORED)
            .map(cell => cell.score);
        out.set(tactic.shortname, notes.length
            ? notes.reduce((a, b) => a + b, 0) / notes.length
            : null);
    }
    return out;
}

/**
 * Niveau de chaque mitigation dont le questionnaire a été entamé.
 *
 * On parcourt le catalogue et non les réponses enregistrées : une mitigation
 * peut n'avoir aucune réponse en propre et être tout de même notée, si sa
 * première question est commune et portée par une autre.
 */
export function mitigationLevels(layer) {
    const out = new Map();
    for (const id of layer.catalog?.keys() ?? []) {
        const questionnaire = layer.catalog.get(id);
        // Le layer est passé pour que les contributions d'autres mitigations
        // puissent être lues.
        const level = mitigationLevel(questionnaire, resolvedEntries(layer, id), layer.scoring, layer);
        if (level !== null) out.set(id, level);
    }
    return out;
}
