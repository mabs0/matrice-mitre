/* Génère js/catalog.js depuis docs/Mitigations MITRE ATT&CK v9.xlsx.

   Lancé à la main après chaque évolution du classeur, jamais au runtime : le
   site publié ne lit pas le classeur, il embarque le catalogue généré.

       node tools/build-catalog.mjs

   Dépend de la copie de `xlsx` installée pour les tests (cd test && npm install).
   Le script affiche aussi les réutilisations de questions déclarées par le
   classeur et les lignes de contribution, qui ne sont pas des questions. */

import * as XLSX from "../test/node_modules/xlsx/xlsx.mjs";
import * as fs from "node:fs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

XLSX.set_fs(fs);

const near = rel => fileURLToPath(new URL(rel, import.meta.url));
const WB = near("../docs/Mitigations MITRE ATT&CK v9.xlsx");
const OUT = near("../js/catalog.js");

const wb = XLSX.readFile(WB);
const sheetNames = wb.SheetNames.filter(n => /^M1[0-9]{3}$/.test(n));

/** Apostrophes typographiques -> droites, espaces normalisés. Contenu inchangé. */
function clean(v) {
    if (v === null || v === undefined) return "";
    return String(v)
        .replace(/[‘’ʼ]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/ /g, " ")
        .replace(/\s*\n\s*/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\s+([;,])/g, "$1")
        .trim();
}

/** "Réutiliser automatiquement la réponse de M1018 Q2 …" -> { from, question } */
function parseReuse(note) {
    const m = /M(1[0-9]{3})\s*Q\s*(\d+)/i.exec(note);
    return m ? { from: `M${m[1]}`, question: Number(m[2]) } : null;
}

const mitigations = [];
const reuseNotes = [];
const contributionRows = [];

for (const name of sheetNames) {
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const cell = a => (ws[a] ? ws[a].v : null);

    const entry = {
        id: name,
        name: clean(cell("B2")),
        description: clean(cell("B3")),
        bareme: ["A8", "B8", "C8", "D8", "E8"].map(a => clean(cell(a))),
        questions: [],
    };
    if (entry.bareme.every(b => b === "")) entry.bareme = [];

    let pending = null;   // annotation de réutilisation vue juste au-dessus
    for (let R = 11; R <= range.e.r; R++) {
        const a = cell(`A${R + 1}`);
        const b = clean(cell(`B${R + 1}`));
        if (a === null && b === "") continue;

        if (typeof a !== "number") {
            const note = clean(a);
            const parsed = parseReuse(note);
            if (parsed) pending = { ...parsed, note };
            continue;
        }

        // Une ligne de contribution porte un poids (0,25) là où une question
        // porte un niveau visé entier. C'est ce qui les distingue.
        const level = cell(`G${R + 1}`);
        if (!Number.isInteger(Number(level)) || Number(level) < 0 || Number(level) > 4) {
            contributionRows.push({ mitigation: name, row: R + 1, weight: level, mirrors: b.slice(0, 60) });
            continue;
        }

        const question = {
            num: a,
            level: level === null ? null : Number(level),
            docRequired: clean(cell(`H${R + 1}`)).toLowerCase() === "oui",
            references: clean(cell(`I${R + 1}`)) || "MITRE ATT&CK",
            text: b,
        };
        if (pending) {
            // L'annotation du classeur n'est pas reprise dans le catalogue : les
            // regroupements de questions relèvent d'un arbitrage, ils sont tenus
            // à la main dans js/shared-questions.js. On se contente de vérifier
            // que le classeur et cet arbitrage ne se contredisent pas.
            reuseNotes.push({ target: { mitigation: name, question: a },
                              source: { mitigation: pending.from, question: pending.question },
                              level: question.level, note: pending.note, text: b });
            pending = null;
        }
        entry.questions.push(question);
    }
    mitigations.push(entry);
}

/* ---- rendu ---------------------------------------------------------------- */

const q = s => JSON.stringify(s);

function renderQuestion(x) {
    const lines = [
        `        {`,
        `            num: ${x.num}, level: ${x.level}, docRequired: ${x.docRequired},`,
    ];
    lines.push(`            references: ${q(x.references)},`);
    lines.push(`            text: ${q(x.text)},`);
    lines.push(`        },`);
    return lines.join("\n");
}

function renderMitigation(m) {
    const out = [`const ${m.id} = {`, `    id: ${q(m.id)},`, `    name: ${q(m.name)},`,
                 `    description: ${q(m.description)},`];
    out.push(m.bareme.length ? `    bareme: [\n${m.bareme.map(b => `        ${q(b)},`).join("\n")}\n    ],`
                             : `    bareme: [],`);
    if (m.id === "M1016") out.push(`    contributions: [{ from: "M1049", question: 5, weight: 0.25 }],`);
    out.push(m.questions.length ? `    questions: [\n${m.questions.map(renderQuestion).join("\n")}\n    ],`
                                : `    questions: [],   // pseudo-mitigation : rien à évaluer`);
    out.push(`};`);
    return out.join("\n");
}

const total = mitigations.reduce((n, m) => n + m.questions.length, 0);

const header = `/* ============================================================================
   Catalogue du questionnaire — généré depuis docs/Mitigations MITRE ATT&CK v9.xlsx.

   Un onglet M10xx du classeur devient une entrée de ce catalogue :

     B1:B3     -> id, name, description
     A7:E7     -> les cinq niveaux          A8:E8 -> bareme[0..4]
     colonne A -> num                       colonne G -> level
     colonne B -> text                      colonne H -> docRequired
                                            colonne I -> references

   Les colonnes E (Réponse) et F (Outil) sont saisies par l'utilisateur : elles
   vivent dans le layer, pas ici.

   ${mitigations.length} mitigations, ${total} questions. M1055 n'a pas de questionnaire : la
   catégorie décrit les cas où l'on choisit délibérément de ne pas atténuer, il
   n'y a donc pas de maturité à mesurer.

   Deux mécanismes relient les mitigations entre elles, et ne se déclarent pas
   ici :

   - les **questions communes** à plusieurs mitigations, posées une seule fois et
     appliquées au niveau propre de chacune : \`js/shared-questions.js\`, tenu à la
     main parce que reconnaître deux formulations comme une même question est un
     arbitrage et non une donnée extractible.
   - les **contributions**, qui ajustent la note d'une mitigation d'un poids fixe
     selon une réponse donnée ailleurs : champ \`contributions\` ci-dessous, voir
     \`contributionOf\` dans scoring.js.
   ========================================================================= */

export const LEVEL_LABELS = ["Inexistant", "Informel", "Répétable", "Défini", "Maîtrisé"];

export const LEVEL_DEFINITIONS = [
    "Pratique inexistante : aucune pratique n'est appliquée.",
    "Pratique informelle : pratiques de base mises en œuvre de manière informelle et réactive, sur l'initiative de ceux qui estiment en avoir besoin.",
    "Pratique répétable et suivie : pratiques de base mises en œuvre de façon planifiée et suivie, avec un support relatif de l'organisme.",
    "Processus défini : mise en œuvre d'un processus décrit, adapté à l'organisme, généralisé et bien compris par le management et par les exécutants.",
    "Processus contrôlé et en amélioration continue : le processus est structuré, coordonné et contrôlé à l'aide d'indicateurs, et optimisé en continu.",
];

export const ANSWERS = ["Oui", "Non", "N/A"];
`;

const footer = `
/**
 * Toutes les mitigations du référentiel, par identifiant. Sert à consulter une
 * mitigation (nom, description, barème) depuis la matrice, y compris celle qui
 * n'a pas de questionnaire.
 */
export const CATALOG = new Map([
${mitigations.map(m => `    [${m.id}.id, ${m.id}],`).join("\n")}
]);

/**
 * Les mitigations effectivement évaluables — celles qui portent des questions.
 * C'est le périmètre du parcours et de l'avancement : l'ordre de cette Map est
 * l'ordre dans lequel le questionnaire les présente.
 */
export const QUESTIONNAIRES = new Map(
    [...CATALOG].filter(([, m]) => m.questions.length > 0));

export const getQuestionnaire = id => CATALOG.get(id) || null;

/** Nombre total de questions à poser. */
export const totalQuestions = () =>
    [...QUESTIONNAIRES.values()].reduce((n, m) => n + m.questions.length, 0);
`;

writeFileSync(OUT, [header, ...mitigations.map(renderMitigation), footer].join("\n\n"));

console.log(`${mitigations.length} mitigations, ${total} questions -> ${OUT}`);
console.log(`\nLignes de contribution (poids, pas un niveau) : ${contributionRows.length}`);
for (const c of contributionRows) console.log(`  ${c.mitigation} ligne ${c.row}  poids ${c.weight}  « ${c.mirrors} »`);

/* ---- contrôle de cohérence avec l'arbitrage ------------------------------- */

/* Le classeur annote lui-même certaines réutilisations, en colonne A au-dessus
   de la question concernée. Ces annotations ne pilotent rien — c'est
   shared-questions.js qui décide — mais un écart entre les deux signale soit une
   évolution du classeur à arbitrer, soit un arbitrage devenu obsolète. */

const { SHARED_GROUPS } = await import("../js/shared-questions.js");

const grouped = new Map();
for (const group of SHARED_GROUPS) {
    for (const m of group.members) grouped.set(`${m.mitigation}:${m.question}`, group.key);
}

console.log(`\nRéutilisations annotées dans le classeur (${reuseNotes.length}) :`);
for (const r of reuseNotes) {
    const a = grouped.get(`${r.target.mitigation}:${r.target.question}`);
    const b = grouped.get(`${r.source.mitigation}:${r.source.question}`);
    const verdict = a && a === b ? `regroupées sous « ${a} »`
        : "NON REGROUPÉES — à arbitrer, ou écart assumé";
    console.log(`  ${r.target.mitigation} Q${r.target.question} (niveau ${r.level})`
                + `  <-  ${r.source.mitigation} Q${r.source.question}   ${verdict}`);
}

const declared = new Set(reuseNotes.flatMap(r => [
    `${r.target.mitigation}:${r.target.question}`, `${r.source.mitigation}:${r.source.question}`]));
const extra = [...grouped.keys()].filter(k => !declared.has(k));
if (extra.length) {
    console.log(`\nRegroupés sans annotation du classeur (${extra.length}) : ${extra.join(", ")}`);
}

console.log(`\n${SHARED_GROUPS.length} groupes de questions communes, `
            + `${SHARED_GROUPS.reduce((n, g) => n + g.members.length - 1, 0)} questions économisées `
            + `-> ${total - SHARED_GROUPS.reduce((n, g) => n + g.members.length - 1, 0)} questions posées.`);
