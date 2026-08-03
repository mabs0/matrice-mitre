/* Banc d'essai headless : jsdom + un mini-bundle ATT&CK synthétique.
   Vérifie que l'application démarre, que les trois vues se rendent, que le
   questionnaire alimente la matrice et que l'export/import fait un aller-retour. */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import * as XLSXmod from "xlsx";
import CryptoJSmod from "crypto-js";

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Le banc tourne depuis test/ ; la racine du projet est le dossier parent.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const ok = (label, cond, extra = "") => {
    if (cond) console.log(`  ✓ ${label}${extra ? " — " + extra : ""}`);
    else { failures++; console.log(`  ✗ ${label}${extra ? " — " + extra : ""}`); }
};

/* ---------------------------------------------- mini-bundle ATT&CK synthétique */

const tac = (id, name, shortname) => ({
    type: "x-mitre-tactic", id: `tactic--${id}`, name, x_mitre_shortname: shortname,
    external_references: [{ source_name: "mitre-attack", external_id: `TA00${id}`, url: "u" }],
});
const pat = (id, name, phases, platforms, sub = false) => ({
    type: "attack-pattern", id: `attack-pattern--${id}`, name,
    x_mitre_is_subtechnique: sub, x_mitre_platforms: platforms,
    description: `Description de ${name}.`,
    kill_chain_phases: phases.map(p => ({ kill_chain_name: "mitre-attack", phase_name: p })),
    external_references: [{ source_name: "mitre-attack", external_id: id, url: `https://attack.mitre.org/techniques/${id}` }],
});
const coa = (id, name) => ({
    type: "course-of-action", id: `course-of-action--${id}`, name, description: `Mitigation ${name}.`,
    external_references: [{ source_name: "mitre-attack", external_id: id, url: "u" }],
});
const rel = (src, dst) => ({
    type: "relationship", id: `relationship--${src}-${dst}`, relationship_type: "mitigates",
    source_ref: `course-of-action--${src}`, target_ref: `attack-pattern--${dst}`,
});

const bundle = {
    objects: [
        {
            type: "x-mitre-matrix", id: "x-mitre-matrix--1", name: "Enterprise ATT&CK",
            tactic_refs: ["tactic--02", "tactic--01"],     // ordre volontairement non alphabétique
            external_references: [{ source_name: "mitre-attack", external_id: "enterprise-attack", url: "u" }],
        },
        tac("01", "Credential Access", "credential-access"),
        tac("02", "Initial Access", "initial-access"),
        pat("T1078", "Valid Accounts", ["initial-access"], ["Windows", "Linux", "SaaS"]),
        pat("T1078.001", "Default Accounts", ["initial-access"], ["Windows"], true),
        pat("T1110", "Brute Force", ["credential-access"], ["Windows", "Linux"]),
        pat("T1555", "Credentials from Password Stores", ["credential-access"], ["macOS"]),
        pat("T9999", "Technique sans mitigation", ["initial-access"], ["Linux"]),
        // Les mitigations du catalogue, plus une sans questionnaire.
        coa("M1016", "Vulnerability Scanning"),
        coa("M1018", "User Account Management"),
        coa("M1027", "Password Policies"),
        coa("M1032", "Multi-factor Authentication"),
        coa("M1049", "Antivirus/Antimalware"),
        coa("M1030", "Network Segmentation"),        // pas de questionnaire : « à venir »
        rel("M1032", "T1078"),
        rel("M1018", "T1078"),                       // T1078 couverte par deux mitigations notées
        rel("M1016", "T1078"),                       // et par la première du catalogue
        rel("M1032", "T1110"),
        rel("M1027", "T1110"),
        rel("M1030", "T1110"),
        rel("M1032", "T1555.001"),   // cible inexistante : doit être ignorée proprement
    ],
};

const index = {
    collections: [{
        name: "Enterprise ATT&CK", id: "c1",
        versions: [
            { version: "19.1", url: "https://fake/enterprise-19.1.json", modified: "2026-05-12T14:00:00Z" },
            { version: "19.0", url: "https://fake/enterprise-19.0.json", modified: "2026-04-28T14:00:00Z" },
            { version: "9.0", url: "https://fake/enterprise-9.0.json", modified: "2021-04-29T14:00:00Z" },
        ],
    }],
};

/* ------------------------------------------------------------------- jsdom */

const html = readFileSync(`${ROOT}/index.html`, "utf8")
    .replace(/<script[^>]*><\/script>/g, "");         // les scripts sont injectés en globals

const dom = new JSDOM(html, { url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;

for (const key of ["window", "document", "HTMLElement", "Node", "Event", "CustomEvent",
                   "getComputedStyle", "requestAnimationFrame", "localStorage", "Blob", "File", "FileReader"]) {
    try { globalThis[key] = window[key]; } catch { /* propriété en lecture seule dans node */ }
}
globalThis.URL.createObjectURL = () => "blob:fake";
globalThis.URL.revokeObjectURL = () => {};
window.matchMedia = () => ({ matches: false, addEventListener() {} });
window.alert = () => {};
window.confirm = () => true;
window.prompt = () => "";
globalThis.XLSX = XLSXmod;
globalThis.CryptoJS = CryptoJSmod;
window.XLSX = XLSXmod;
window.CryptoJS = CryptoJSmod;

const fetched = [];
globalThis.fetch = async (url, opts) => {
    fetched.push({ url: String(url), cache: opts?.cache });
    const payload = String(url).includes("index.json") ? index : bundle;
    const text = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(text);

    // On rend un vrai flux, pour exercer le chemin de lecture incrémentale.
    let sent = false;
    return {
        ok: true,
        status: 200,
        headers: { get: name => (name === "content-length" ? String(bytes.length) : null) },
        json: async () => payload,
        text: async () => text,
        body: {
            getReader: () => ({
                read: async () => (sent ? { done: true } : (sent = true, { done: false, value: bytes })),
            }),
        },
    };
};

/* --------------------------------------------------------------- démarrage */

console.log("\n[1] Démarrage et chargement des données");
await import(`${ROOT}/js/main.js`);
await new Promise(r => setTimeout(r, 60));

ok("index.json relu sans cache", fetched.some(f => f.url.includes("index.json") && f.cache === "no-store"));
ok("version la plus récente choisie", fetched.some(f => f.url.includes("19.1")),
   fetched.map(f => f.url.split("/").pop()).join(", "));
ok("écran de chargement retiré", !window.document.getElementById("boot"));
ok("badge de version renseigné",
   window.document.getElementById("version-text").textContent.includes("19.1"));

/* ------------------------------------------------------------- page d'accueil */

console.log("\n[2] Page d'accueil");
const home = window.document.getElementById("view-home");
ok("accueil visible", !home.classList.contains("hidden"));
ok("bouton « Créer un layer » présent", !!window.document.getElementById("home-new"));
ok("zone d'import présente", !!window.document.getElementById("home-drop"));
const stats = [...home.querySelectorAll(".stat .v")].map(n => n.textContent);
// T9999 n'a aucune relation ; T1555 en a une, mais vers T1555.001 qui n'existe
// pas dans ce mini-bundle — elle doit être ignorée, donc deux techniques
// se retrouvent sans mitigation.
ok("chiffres calculés", stats.join("/") === "2/4/1/6/2", `tactiques/techniques/sous-tech/mitig/sans-mitig = ${stats.join("/")}`);
ok("relation vers une cible inexistante ignorée",
   window.document.getElementById("view-home").textContent.includes("2"));

/* -------------------------------------------------------------- matrice vierge */

console.log("\n[3] Matrice avant toute réponse");
window.document.getElementById("home-explore").click();
const grid = window.document.getElementById("matrix-grid");
ok("matrice construite", !!grid);
ok("une colonne par tactique", grid.querySelectorAll(".tactic-col").length === 2);
const heads = [...grid.querySelectorAll(".tactic-head .t-name")].map(n => n.textContent.trim());
ok("ordre des tactiques issu de tactic_refs", heads.join(" | ") === "Initial Access | Credential Access", heads.join(" | "));
ok("technique sans mitigation hachurée",
   grid.querySelector('[data-tech="T9999"]')?.classList.contains("no-mitigation"));
ok("technique couverte mais non évaluée en neutre",
   grid.querySelector('[data-tech="T1078"]')?.classList.contains("unscored"));
ok("légende complète", window.document.querySelectorAll("#matrix-legend .legend-item").length === 7);

/* ----------------------------------------------------------- filtre plateforme */

console.log("\n[4] Filtre plateforme");
const macBox = [...window.document.querySelectorAll("#platform-panel input[data-platform]")]
    .find(cb => cb.dataset.platform === "macOS");
ok("plateformes listées depuis les données",
   [...window.document.querySelectorAll("#platform-panel input[data-platform]")]
       .map(cb => cb.dataset.platform).join(",") === "Linux,macOS,SaaS,Windows");
for (const cb of window.document.querySelectorAll("#platform-panel input[data-platform]")) {
    if (cb !== macBox) { cb.checked = false; cb.dispatchEvent(new window.Event("change")); }
}
const visible = [...window.document.querySelectorAll("#matrix-grid .cell")].map(c => c.dataset.tech);
ok("seule la technique macOS reste", visible.join(",") === "T1555", visible.join(",") || "aucune");
macBox.checked = true;
for (const cb of window.document.querySelectorAll("#platform-panel input[data-platform]")) {
    cb.checked = true; cb.dispatchEvent(new window.Event("change"));
}

/* -------------------------------------------------------------- questionnaire */

console.log("\n[5] Questionnaire sur les trois mitigations du catalogue");
const { CATALOG: CAT } = await import(`${ROOT}/js/catalog.js`);
window.document.getElementById("brand").click();
window.document.getElementById("home-new").click();
window.document.getElementById("nl-name").value = "Test";
window.document.getElementById("nl-ok").click();

const openMitigation = () => window.document.querySelector(".quiz-tag")?.textContent.trim();
ok("on démarre sur la première mitigation du catalogue",
   openMitigation() === [...CAT.keys()][0], openMitigation());

/** Répond « Oui » partout et enchaîne les mitigations. */
function answerAllYes(limit = 60) {
    const visited = [];
    for (let i = 0; i < limit; i++) {
        const tag = openMitigation();
        const yes = window.document.querySelector('[data-answer="Oui"]');
        if (yes) { if (!visited.includes(tag)) visited.push(tag); yes.click(); continue; }
        const next = window.document.getElementById("r-next");
        if (next) { next.click(); continue; }
        break;
    }
    return visited;
}
const visited = answerAllYes();
ok("les trois mitigations ont été parcourues", visited.length === CAT.size,
   visited.join(" → "));
ok("dans l'ordre du catalogue", visited.join(",") === [...CAT.keys()].join(","), visited.join(","));

const badge = window.document.querySelector(".result-badge");
ok("écran de résultat affiché", !!badge);
ok("niveau 4 atteint sur la dernière", badge?.textContent.trim() === "4", badge?.textContent.trim());
ok("l'onglet indique tout traité",
   window.document.querySelector(".layer-tab .pct")?.textContent === `${CAT.size}/${CAT.size}`,
   window.document.querySelector(".layer-tab .pct")?.textContent);
ok("plus de bouton « Mitigation suivante »", !window.document.getElementById("r-next"));

/* --------------------------------------------------- report dans la matrice */

console.log("\n[6] Report du score dans la matrice");
window.document.getElementById("r-matrix").click();
const g2 = window.document.getElementById("matrix-grid");
ok("T1078 (M1032 et M1018, toutes deux à 4) en niveau 4",
   g2.querySelector('[data-tech="T1078"]')?.classList.contains("lvl-4"));
ok("T1110 (deux notées à 4 + M1030 sans questionnaire) en niveau 4",
   g2.querySelector('[data-tech="T1110"]')?.classList.contains("lvl-4"));
ok("T9999 toujours sans mitigation",
   g2.querySelector('[data-tech="T9999"]')?.classList.contains("no-mitigation"));

console.log("\n[7] Méthodes de notation et d'agrégation");
const setRadio = (name, value) => {
    const r = [...window.document.querySelectorAll(`#method-panel input[name="${name}"]`)]
        .find(x => x.value === value);
    r.checked = true; r.dispatchEvent(new window.Event("change"));
};
const levelClassOf = tech => [...window.document.querySelector(`[data-tech="${tech}"]`).classList]
    .find(c => c.startsWith("lvl-")) ?? "aucun";

setRadio("scoring", "cumulative");
ok("cumulatif strict : T1078 reste en 4 (tous les paliers sont « Oui »)",
   levelClassOf("T1078") === "lvl-4", levelClassOf("T1078"));

setRadio("scoring", "average");
ok("moyenne des questions : le niveau baisse", levelClassOf("T1078") !== "lvl-4",
   levelClassOf("T1078"));
setRadio("scoring", "last-yes");

// On abaisse une seule des deux mitigations de T1078, via « Modifier ma
// réponse » — ce qui exerce aussi ce bouton — pour rendre l'agrégation visible.
window.document.querySelector('[data-tech="T1078"]').click();
const editM1018 = [...window.document.querySelectorAll("#modal-panel [data-edit]")]
    .find(b => b.dataset.edit === "M1018");
ok("« Modifier ma réponse » disponible pour M1018", !!editM1018);
editM1018.click();
ok("le questionnaire s'ouvre bien sur M1018", openMitigation() === "M1018", openMitigation());
window.document.querySelector('[data-answer="Non"]').click();     // M1018 retombe à 0
window.document.getElementById("r-matrix").click();

// T1078 est couverte par trois mitigations notées ; une seule retombe à 0,
// donc la moyenne vaut (4 + 0 + 4) / 3 ≈ 2,67, arrondie à 3 pour la couleur.
ok("moyenne de 4, 0 et 4 : T1078 passe en niveau 3", levelClassOf("T1078") === "lvl-3",
   levelClassOf("T1078"));
setRadio("aggregation", "min");
ok("minimum : T1078 tombe au niveau 0", levelClassOf("T1078") === "lvl-0", levelClassOf("T1078"));
setRadio("aggregation", "max");
ok("maximum : T1078 remonte au niveau 4", levelClassOf("T1078") === "lvl-4", levelClassOf("T1078"));
setRadio("aggregation", "average");
ok("T1110 inchangée (M1018 ne la couvre pas)", levelClassOf("T1110") === "lvl-4",
   levelClassOf("T1110"));

/* ------------------------------------------------------- modale d'une technique */

console.log("\n[8] Modale d'une technique");
window.document.querySelector('[data-tech="T1110"]').click();
const panel = window.document.getElementById("modal-panel");
ok("modale ouverte", window.document.getElementById("modal").classList.contains("open"));
ok("les trois mitigations de T1110 sont listées", panel.querySelectorAll(".mit-row").length === 3,
   `${panel.querySelectorAll(".mit-row").length} lignes`);
ok("une note par mitigation notée", panel.querySelectorAll(".mit-note").length === 2,
   `${panel.querySelectorAll(".mit-note").length} notes`);
ok("bouton « Modifier ma réponse » présent",
   [...panel.querySelectorAll("[data-edit]")].some(b => b.textContent.includes("Modifier")));
ok("M1030, sans questionnaire, marquée « à venir »", panel.textContent.includes("à venir"));

/* -------------------------------------------------------- aller-retour fichier */

console.log("\n[9] Aller-retour export / import");
const { toJSON, fromJSON, toWorkbook, fromWorkbook, progress } = await import(`${ROOT}/js/layer.js`);
const { buildMatrixScores, mitigationLevels } = await import(`${ROOT}/js/scoring.js`);

const { CATALOG } = await import(`${ROOT}/js/catalog.js`);
const rebuilt = fromJSON(toJSON({
    schema: "ctrm-layer/1", name: "Test", created: "", modified: "", attackVersion: "19.1",
    respondent: { name: "M", org: "O", email: "e" }, scoring: "last-yes", aggregation: "average",
    answers: { M1032: Object.fromEntries([1,2,3,4,5,6,7].map(n => [n, { value: "Oui", tool: "Entra ID" }])) },
    cursor: { mitigation: "M1032", question: 7 }, catalog: CATALOG,
}));
ok("JSON relu sans perte", progress(rebuilt).answered === 7);
ok("l'outil saisi survit à l'aller-retour", rebuilt.answers.M1032[1].tool === "Entra ID");
ok("le catalogue n'est pas sérialisé", !toJSON(rebuilt).includes('"questions"'));

// Excel : export puis réimport
const wb = toWorkbook(rebuilt,
    { version: "19.1", mitigations: [{ id: "M1032", name: "MFA", techniques: ["T1078"] }],
      tactics: [{ name: "Initial Access", shortname: "initial-access" }],
      byTactic: new Map([["initial-access", [{ id: "T1078", name: "Valid Accounts" }]]]) },
    new Map([["T1078", { state: "scored", score: 4 }]]),
    mitigationLevels(rebuilt));
ok("classeur à quatre feuilles", wb.SheetNames.join(",") === "Réponses,Mitigations,Matrice,Métadonnées", wb.SheetNames.join(","));
const back = fromWorkbook(wb, { name: "Relu" });
ok("Excel relu sans perte", progress(back).answered === 7);
ok("l'outil survit au passage par Excel", back.answers.M1032[1].tool === "Entra ID");

// Classeur d'origine : réponses en colonne E des onglets M10xx
const original = XLSXmod.utils.book_new();
const sheet = XLSXmod.utils.aoa_to_sheet([]);
XLSXmod.utils.sheet_add_aoa(sheet, [["Numéro", "Question"]], { origin: "A11" });
XLSXmod.utils.sheet_add_aoa(sheet, [
    [1, "q1", null, null, "Oui", "Duo"],
    [2, "q2", null, null, "Non", ""],
], { origin: "A12" });
XLSXmod.utils.book_append_sheet(original, sheet, "M1032");
const fromOriginal = fromWorkbook(original, { name: "Classeur d'origine" });
ok("classeur d'origine reconnu (colonne E)", progress(fromOriginal).answered === 2,
   JSON.stringify(fromOriginal.answers.M1032));
ok("colonne F (Outil) reprise", fromOriginal.answers.M1032[1].tool === "Duo");

/* ------------------------------------------------------ JSON chiffré */

console.log("\n[10] Aller-retour JSON chiffré");
const { exportJSON, readLayerFile, isEncrypted } = await import(`${ROOT}/js/io.js`);

// On intercepte le téléchargement pour récupérer le contenu produit.
let produced = null;
const RealBlob = window.Blob;
globalThis.Blob = window.Blob = class extends RealBlob {
    constructor(parts, opts) { super(parts, opts); produced = String(parts[0]); }
};

exportJSON(rebuilt, "cle-de-test");
ok("le JSON chiffré porte l'en-tête reconnaissable", produced?.startsWith("CTRM1:"),
   produced?.slice(0, 12));
ok("le contenu n'est plus lisible en clair", !produced.includes("Entra ID"));

const encFile = new window.File([produced], "layer-chiffre.json", { type: "application/json" });
ok("fichier détecté comme chiffré", await isEncrypted(encFile));
const decrypted = await readLayerFile(encFile, "cle-de-test");
ok("déchiffré et relu sans perte", progress(decrypted).answered === 7);
ok("l'outil survit au chiffrement", decrypted.answers.M1032[1].tool === "Entra ID");

let rejected = "";
try { await readLayerFile(encFile, "mauvaise-cle"); } catch (e) { rejected = e.message; }
ok("mauvaise clé rejetée explicitement", /clé de déchiffrement incorrecte/.test(rejected), rejected);

let noKey = "";
try { await readLayerFile(encFile, ""); } catch (e) { noKey = e.message; }
ok("clé manquante signalée", /chiffré/.test(noKey), noKey);

// Export en clair : toujours possible, mais il faut le demander.
exportJSON(rebuilt, "");
ok("l'export en clair reste ré-importable", produced.includes("Entra ID"));
globalThis.Blob = window.Blob = RealBlob;

/* ---------------------------------------------- avancement et ordre de parcours */

console.log("\n[11] Avancement et ordre de parcours");
const { questionnaireState, nextTarget, createLayer, setAnswer } = await import(`${ROOT}/js/layer.js`);
const q1032 = CATALOG.get("M1032");

// Un « Non » à la première question clôt la mitigation : elle est traitée.
const stopped = questionnaireState(q1032, { 1: { value: "Non" } });
ok("« Non » en Q1 clôt le questionnaire", stopped.complete && stopped.answered === 1);

const halfway = questionnaireState(q1032, { 1: { value: "Oui" }, 2: { value: "Oui" } });
ok("parcours interrompu = non traité", !halfway.complete && halfway.nextNum === 3,
   `nextNum=${halfway.nextNum}`);

const naDoesNotStop = questionnaireState(q1032, { 1: { value: "N/A" } });
ok("« N/A » ne clôt pas", !naDoesNotStop.complete && naDoesNotStop.nextNum === 2);

const layerNon = createLayer({ name: "Non en Q1" });
setAnswer(layerNon, "M1032", 1, { value: "Non" });
ok("une mitigation close par un « Non » compte comme traitée",
   progress(layerNon).completeMitigations === 1 && progress(layerNon).pct === Math.round(100 / CATALOG.size),
   `${progress(layerNon).completeMitigations}/${progress(layerNon).mitigations} = ${progress(layerNon).pct}%`);
const firstOther = [...CATALOG.keys()].find(id => id !== "M1032");
ok("il reste les mitigations jamais ouvertes", nextTarget(layerNon)?.mitigation === firstOther,
   `${nextTarget(layerNon)?.mitigation} (attendu ${firstOther})`);

// Un « Non » sur une question antérieure efface les réponses devenues
// inatteignables : le parcours progressif ne les aurait jamais posées.
const layerRevise = createLayer({ name: "Révision" });
for (const q of q1032.questions) setAnswer(layerRevise, "M1032", q.num, { value: "Oui" });
const droppedCount = setAnswer(layerRevise, "M1032", 1, { value: "Non" });
ok("les réponses postérieures à un « Non » sont effacées", droppedCount === q1032.questions.length - 1,
   `${droppedCount} effacées`);
ok("le niveau retombe à 0", progress(layerRevise).answered === 1);

// Reprise au bon numéro quand plus rien n'est vierge.
const layerResume = createLayer({ name: "Reprise" });
for (const id of CATALOG.keys()) {
    if (id !== "M1032") setAnswer(layerResume, id, CATALOG.get(id).questions[0].num, { value: "Non" });
}
setAnswer(layerResume, "M1032", 1, { value: "Oui" });     // seule mitigation en cours
const resumeAt = nextTarget(layerResume);
ok("on reprend la mitigation en cours à sa question suivante",
   resumeAt?.mitigation === "M1032" && resumeAt?.question === 2, JSON.stringify(resumeAt));

// Ordre de parcours : les mitigations jamais ouvertes passent devant celles en cours.
const fakeCatalog = new Map([
    ["MA", { id: "MA", name: "A", bareme: [], questions: [{ num: 1, level: 1 }, { num: 2, level: 2 }] }],
    ["MB", { id: "MB", name: "B", bareme: [], questions: [{ num: 1, level: 1 }] }],
]);
const twoLayer = { ...createLayer({ name: "Deux" }), catalog: fakeCatalog };
setAnswer(twoLayer, "MA", 1, { value: "Oui" });          // MA entamée, MB jamais ouverte
ok("on va d'abord sur la mitigation jamais ouverte", nextTarget(twoLayer).mitigation === "MB",
   nextTarget(twoLayer).mitigation);
setAnswer(twoLayer, "MB", 1, { value: "Oui" });          // MB terminée
ok("puis on revient sur celle laissée en cours",
   nextTarget(twoLayer).mitigation === "MA" && nextTarget(twoLayer).question === 2,
   JSON.stringify(nextTarget(twoLayer)));

/* ------------------------------------------- reprise après import et navigation */

console.log("\n[12] Reprise après import, sans exception");
// M1018 et M1027 traitées, M1032 entamée : la reprise doit viser M1032 Q2.
const partialLayer = createLayer({ name: "Partiel" });
for (const id of CATALOG.keys()) {
    if (id !== "M1032") setAnswer(partialLayer, id, CATALOG.get(id).questions[0].num, { value: "Non" });
}
setAnswer(partialLayer, "M1032", 1, { value: "Oui" });
const partialFile = new window.File([toJSON(partialLayer)], "partiel.json", { type: "application/json" });

const errors = [];
window.addEventListener("error", e => errors.push(e.message));
const drop = window.document.getElementById("home-drop");
window.document.getElementById("brand").click();
const dt = { files: [partialFile] };
const dropEvent = new window.Event("drop");
dropEvent.dataTransfer = dt;
drop.dispatchEvent(dropEvent);
await new Promise(r => setTimeout(r, 80));

const toasts = [...window.document.querySelectorAll(".toast")].map(t => t.textContent);
ok("import sans message d'erreur", !toasts.some(t => t.includes("impossible")), toasts.join(" | "));
ok("le questionnaire reprend sur M1032 à la question 2",
   window.document.querySelector(".quiz-tag")?.textContent.trim() === "M1032" &&
   window.document.querySelector(".quiz-progress-label")?.textContent.includes("Question 2"),
   window.document.querySelector(".quiz-progress-label")?.textContent.trim().split("\n")[0]);

const matrixButton = window.document.getElementById("q-matrix");
ok("« Voir la matrice » est bien câblé avant toute réponse", typeof matrixButton?.onclick === "function");
matrixButton.click();
ok("« Voir la matrice » affiche la matrice", !!window.document.getElementById("matrix-grid"));

/* ------------------------------------------- repère de niveau et navigation arrière */

console.log("\n[13] Frise des niveaux et bouton Précédent");
window.document.getElementById("matrix-quiz").click();
const currentLevelOf = () => {
    const dot = window.document.querySelector(".level-dot.current");
    return dot ? Number(dot.textContent.trim()) : null;
};
const questionLabel = () => window.document.querySelector(".quiz-progress-label").textContent.match(/Question (\d+)/)[1];
ok("on est sur la question 2 (niveau visé 2)", questionLabel() === "2" && currentLevelOf() === 2,
   `Q${questionLabel()} niveau ${currentLevelOf()}`);
window.document.getElementById("q-back").click();
ok("Précédent ramène à la question 1", questionLabel() === "1");
ok("le repère de la frise suit la question", currentLevelOf() === 1, `niveau ${currentLevelOf()}`);

/* ---------------------------------------- panneaux déroulants dans l'écran */

console.log("\n[14] Panneaux déroulants");
window.document.getElementById("q-matrix").click();
window.innerWidth = 1280;
for (const id of ["platform", "method", "export"]) {
    window.document.getElementById(`dd-${id}-btn`).click();
    const panel = window.document.getElementById(`${id}-panel`);
    const left = parseFloat(panel.style.left);
    ok(`panneau « ${id} » calé en coordonnées de fenêtre`,
       panel.style.position !== "absolute" && Number.isFinite(left) && left >= 0,
       `left=${panel.style.left} top=${panel.style.top}`);
}
ok("le chiffrement est coché par défaut", window.document.getElementById("ex-crypt")?.checked === true);

/* -------------------------------------------------------------------- thème */

console.log("\n[15] Bascule de thème");
const toggle = window.document.getElementById("theme-toggle");
ok("sombre par défaut", (window.document.documentElement.dataset.theme || "dark") === "dark");
toggle.click();
ok("passage en clair estampillé sur <html>", window.document.documentElement.dataset.theme === "light");
toggle.click();
ok("retour en sombre", window.document.documentElement.dataset.theme === "dark");

/* ------------------------------------- import chiffré par l'interface */

console.log("\n[16] Import d'un JSON chiffré depuis l'accueil");
window.document.getElementById("brand").click();       // confirm renvoie true

const encExport = (() => {
    let out = null;
    const RB = window.Blob;
    globalThis.Blob = window.Blob = class extends RB {
        constructor(parts, opts) { super(parts, opts); out = String(parts[0]); }
    };
    exportJSON(partialLayer, "ma-cle");
    globalThis.Blob = window.Blob = RB;
    return out;
})();

const encDrop = window.document.getElementById("home-drop");
const encEvent = new window.Event("drop");
encEvent.dataTransfer = { files: [new window.File([encExport], "chiffre.json", { type: "application/json" })] };
encDrop.dispatchEvent(encEvent);
await new Promise(r => setTimeout(r, 60));

ok("une modale demande la clé", !!window.document.getElementById("dec-pass"));

// Mauvaise clé : message dans la modale, qui reste ouverte pour réessayer.
window.document.getElementById("dec-pass").value = "pas-la-bonne";
window.document.getElementById("dec-ok").click();
await new Promise(r => setTimeout(r, 40));
ok("mauvaise clé signalée sans fermer la modale",
   /incorrecte/.test(window.document.getElementById("dec-error")?.textContent ?? "") &&
   !!window.document.getElementById("dec-pass"),
   window.document.getElementById("dec-error")?.textContent);

// Bonne clé : le layer s'ouvre.
window.document.getElementById("dec-pass").value = "ma-cle";
window.document.getElementById("dec-ok").click();
await new Promise(r => setTimeout(r, 60));
ok("bonne clé : le layer est chargé",
   window.document.querySelector(".layer-tab .name")?.textContent === "Partiel",
   window.document.querySelector(".layer-tab .name")?.textContent);
ok("la modale est refermée", !window.document.getElementById("dec-pass"));

/* ------------------------------------- retour à l'accueil par le logo */

console.log("\n[17] Retour à l'accueil par le logo");
window.document.getElementById("q-matrix")?.click();

let asked = null;
window.confirm = message => { asked = message; return false; };
window.document.getElementById("brand").click();
ok("une confirmation est demandée", /Quitter/.test(asked ?? ""), (asked ?? "").split("\n")[0]);
ok("la confirmation rappelle ce qui sera perdu", /perdues/.test(asked ?? ""));
ok("refuser garde le layer", !!window.document.querySelector(".layer-tab"));

window.confirm = () => true;
window.document.getElementById("brand").click();
ok("accepter revient à l'accueil",
   !window.document.getElementById("view-home").classList.contains("hidden"));
ok("le layer est remis à zéro", !window.document.querySelector(".layer-tab"));

window.document.getElementById("home-explore").click();
ok("la matrice repart vierge",
   !window.document.querySelector(".cell.lvl-4") && !!window.document.getElementById("matrix-grid"));

/* ------------------------------------------ niveau 0 et progression chiffrée */

console.log("\n[18] Le niveau 0 est atteignable");
// Aucune des 328 questions du classeur ne vise le niveau 0 : c'est le plancher
// obtenu quand la première question est « Non », donc sans aucun « Oui ».
const { mitigationLevel } = await import(`${ROOT}/js/scoring.js`);
const noQuestionAtZero = [...CATALOG.values()]
    .every(m => m.questions.every(q => q.level !== 0));
ok("aucune question ne vise le niveau 0", noQuestionAtZero);

for (const id of [...CATALOG.keys()]) {
    const questionnaire = CATALOG.get(id);
    const zero = createLayer({ name: `zéro ${id}` });
    setAnswer(zero, id, questionnaire.questions[0].num, { value: "Non" });
    const level = mitigationLevel(questionnaire, zero.answers[id], "last-yes");
    ok(`${id} : « Non » à la première question donne le niveau 0`, level === 0, `niveau ${level}`);
}

// Et le niveau 0 s'affiche bien dans l'interface.
window.document.getElementById("brand").click();
window.document.getElementById("home-new").click();
window.document.getElementById("nl-ok").click();
window.document.querySelector('[data-answer="Non"]').click();
const zeroBadge = window.document.querySelector(".result-badge");
ok("le résultat affiche 0", zeroBadge?.textContent.trim() === "0", zeroBadge?.textContent.trim());
ok("le barème du niveau 0 est affiché",
   window.document.querySelector(".result-text")?.textContent
       .includes(CATALOG.get([...CATALOG.keys()][0]).bareme[0].slice(0, 25)));
window.document.getElementById("r-matrix").click();
ok("la case couverte par cette mitigation passe en niveau 0",
   levelClassOf("T1078") === "lvl-0", levelClassOf("T1078"));

console.log("\n[19] Progression chiffrée du téléchargement");
const { loadAttack } = await import(`${ROOT}/js/attack.js`);
const seen = [];
await loadAttack((msg, ratio) => seen.push({ msg, ratio }));
ok("des ratios sont rapportés", seen.some(s => typeof s.ratio === "number"));
ok("les ratios restent dans [0,1]", seen.every(s => s.ratio === undefined || (s.ratio >= 0 && s.ratio <= 1)),
   seen.filter(s => s.ratio !== undefined).map(s => s.ratio.toFixed(2)).join(", "));
ok("le dernier ratio vaut 1", seen.filter(s => s.ratio !== undefined).at(-1).ratio === 1);
ok("les octets reçus sont annoncés", seen.some(s => /Mo/.test(s.msg)),
   seen.map(s => s.msg).find(m => /Mo/.test(m)));

/* --------------------------------------- robustesse à un HTML plus ancien */

console.log("\n[20] Un HTML en cache ne doit pas casser le chargement");
// Reproduit le cas d'un index.html servi depuis le cache, sans les éléments
// d'affichage récents, alors que les scripts sont à jour.
{
    const stale = readFileSync(`${ROOT}/index.html`, "utf8")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
        .replace(/<p class="pct" id="boot-pct"><\/p>/, "")
        .replace(/ id="boot-bar"/, "")
        .replace(/<span class="version-badge[\s\S]*?<\/span>/, "");

    const staleDom = new JSDOM(stale, { url: "http://localhost/", pretendToBeVisual: true });
    const previous = { window: globalThis.window, document: globalThis.document };
    globalThis.window = staleDom.window;
    globalThis.document = staleDom.window.document;
    staleDom.window.matchMedia = () => ({ matches: false, addEventListener() {} });

    let thrown = null;
    try {
        const { loadAttack: load } = await import(`${ROOT}/js/attack.js?stale`);
        const { $: sel } = await import(`${ROOT}/js/ui.js?stale`);
        // Même rapport d'avancement que dans main.js, sur un DOM incomplet.
        const data = await load((msg, ratio) => {
            const status = sel("#boot-status");
            if (status) status.textContent = msg;
            if (ratio === undefined) return;
            const bar = sel("#boot-bar");
            if (bar) bar.classList.add("determinate");
            const pct = sel("#boot-pct");
            if (pct) pct.textContent = `${Math.round(ratio * 100)} %`;
        });
        ok("les données se chargent malgré les éléments manquants", data.counts.tactics === 2);
    } catch (err) {
        thrown = err;
    }
    ok("aucune exception sur un DOM incomplet", thrown === null, thrown?.message);

    globalThis.window = previous.window;
    globalThis.document = previous.document;
}

/* -------------------------------------------- contribution entre mitigations */

console.log("\n[21] Bonus/malus apporté par une autre mitigation");
const m1016 = CATALOG.get("M1016");
ok("M1016 déclare une contribution de M1049",
   m1016?.contributions?.[0]?.from === "M1049" && m1016.contributions[0].weight === 0.25);

const withContribution = (own, otherAnswer) => {
    const layer = { catalog: CATALOG, scoring: "last-yes",
        answers: { M1016: own, ...(otherAnswer ? { M1049: { 5: { value: otherAnswer } } } : {}) } };
    return mitigationLevel(m1016, own, "last-yes", layer);
};
const upToLevel3 = { 1: { value: "Oui" }, 2: { value: "Oui" }, 3: { value: "Oui" },
                     4: { value: "Oui" }, 5: { value: "Oui" }, 6: { value: "Non" } };

ok("« Oui » ailleurs ajoute 0,25", withContribution(upToLevel3, "Oui") === 3.25,
   String(withContribution(upToLevel3, "Oui")));
ok("« Non » ailleurs retire 0,25", withContribution(upToLevel3, "Non") === 2.75,
   String(withContribution(upToLevel3, "Non")));
ok("« N/A » ailleurs ne change rien", withContribution(upToLevel3, "N/A") === 3);
ok("pas de réponse ailleurs ne change rien", withContribution(upToLevel3, null) === 3);

const allYes1016 = Object.fromEntries(m1016.questions.map(q => [q.num, { value: "Oui" }]));
ok("le bonus reste borné à 4", withContribution(allYes1016, "Oui") === 4,
   String(withContribution(allYes1016, "Oui")));

const firstNo = { 1: { value: "Non" } };
ok("aucun ajustement sur un niveau 0", withContribution(firstNo, "Oui") === 0,
   String(withContribution(firstNo, "Oui")));

// Conformité exhaustive à la formule du classeur.
{
    const V = ["Oui", "Non", "N/A"];
    const excel = (own, other) => {
        const rows = m1016.questions.map((q, i) => ({ i, v: own[q.num] }));
        const yes = rows.filter(r => r.v === "Oui");
        if (!yes.length) return 0;
        const last = Math.max(...yes.map(r => r.i));
        const adj = other === "Oui" ? 0.25 : other === "Non" ? -0.25 : 0;
        return Math.max(0, Math.min(4, m1016.questions[last].level + adj));
    };
    function* combos(n) {
        if (!n) { yield []; return; }
        for (const rest of combos(n - 1)) for (const v of V) yield [...rest, v];
    }
    let checked = 0, diverged = 0;
    for (const combo of combos(m1016.questions.length)) {
        for (const other of [...V, null]) {
            const own = Object.fromEntries(m1016.questions.map((q, i) => [q.num, { value: combo[i] }]));
            const flat = Object.fromEntries(m1016.questions.map((q, i) => [q.num, combo[i]]));
            checked++;
            if (Math.abs(withContribution(own, other) - excel(flat, other)) > 1e-9) diverged++;
        }
    }
    ok(`conforme à la formule du classeur sur ${checked} combinaisons`, diverged === 0,
       `${diverged} écart(s)`);
}

// Le questionnaire annonce la dépendance.
window.document.getElementById("brand").click();
window.document.getElementById("home-new").click();
window.document.getElementById("nl-ok").click();
ok("le questionnaire signale la dépendance",
   /M1049/.test(window.document.querySelector(".quiz-link")?.textContent ?? ""),
   window.document.querySelector(".quiz-link")?.textContent.trim());

/* ------------------------------------------------ passe de relecture */

console.log("\n[22] Passe de relecture après un questionnaire complet");
const { reviewTarget, acquiredMitigations } = await import(`${ROOT}/js/layer.js`);
const ids = [...CATALOG.keys()];

// Tout traité : les deux premières acquises, la troisième bloquée sur un « Non ».
const reviewLayer = createLayer({ name: "Relecture" });
const fillAllYes = (layer, id) => {
    for (const q of CATALOG.get(id).questions) setAnswer(layer, id, q.num, { value: "Oui" });
};
for (const id of ids) fillAllYes(reviewLayer, id);
setAnswer(reviewLayer, ids[2], CATALOG.get(ids[2]).questions[1].num, { value: "Non" });

ok("plus rien à traiter en première passe", nextTarget(reviewLayer) === null);
const review = reviewTarget(reviewLayer);
ok("la relecture repart du début et saute les mitigations acquises",
   review?.mitigation === ids[2], `${review?.mitigation} (attendu ${ids[2]})`);
ok("elle atterrit sur la question du « Non »",
   review?.question === CATALOG.get(ids[2]).questions[1].num, String(review?.question));
ok("les mitigations sans « Non » sont acquises",
   acquiredMitigations(reviewLayer).join(",") === ids.filter(i => i !== ids[2]).join(","),
   acquiredMitigations(reviewLayer).join(","));

// Un second point de blocage plus loin, et le chaînage after.
setAnswer(reviewLayer, ids[4], CATALOG.get(ids[4]).questions[0].num, { value: "Non" });
ok("le premier point de blocage reste le plus haut dans le catalogue",
   reviewTarget(reviewLayer)?.mitigation === ids[2]);
ok("le chaînage donne le point de blocage suivant",
   reviewTarget(reviewLayer, ids[2])?.mitigation === ids[4],
   reviewTarget(reviewLayer, ids[2])?.mitigation);

// Tout acquis : rien à relire.
const allAcquired = createLayer({ name: "Tout acquis" });
for (const id of ids) fillAllYes(allAcquired, id);
ok("aucun point de blocage quand tout est « Oui »", reviewTarget(allAcquired) === null);

// Et par l'interface : le questionnaire ne repart pas sur la dernière mitigation.
window.document.getElementById("brand").click();
window.document.getElementById("home-new").click();
window.document.getElementById("nl-ok").click();
const uiLayerTag = () => window.document.querySelector(".quiz-tag")?.textContent.trim();
answerAllYes();
window.document.getElementById("r-matrix").click();
window.document.getElementById("matrix-quiz").click();
ok("tout acquis : l'écran « Rien à revoir » s'affiche",
   /Rien à revoir/.test(window.document.getElementById("view-quiz").textContent),
   window.document.querySelector(".quiz-title")?.textContent);

/* --------------------------------- atténuation des sous-techniques */

console.log("\n[23] Surlignage d'une mitigation et sous-techniques");
window.document.getElementById("r-matrix").click();
window.document.getElementById("matrix-subs").checked = true;
window.document.getElementById("matrix-subs").dispatchEvent(new window.Event("change"));
ok("les sous-techniques sont dépliées", !!window.document.querySelector('[data-tech="T1078.001"]'));

const select = window.document.getElementById("matrix-mitigation");
select.value = "M1032";
select.dispatchEvent(new window.Event("change"));

const parent = window.document.querySelector('[data-tech="T1078"]');
const sub = window.document.querySelector('[data-tech="T1078.001"]');
ok("la technique couverte est surlignée", parent.classList.contains("highlighted"));
ok("la sous-technique non couverte est atténuée", sub.classList.contains("dimmed"),
   [...sub.classList].join(" "));
ok("elle ne porte pas d'opacité concurrente", !/opacity/.test(sub.style.cssText));

// La règle d'état doit être déclarée après la forme des cases.
const css = readFileSync(`${ROOT}/css/matrix.css`, "utf8");
ok("« .cell.dimmed » est déclarée après « .cell.sub »",
   css.indexOf(".cell.dimmed") > css.indexOf(".cell.sub"),
   `sub à ${css.indexOf(".cell.sub")}, dimmed à ${css.indexOf(".cell.dimmed")}`);
ok("« .cell.sub » ne fixe plus d'opacité",
   !/\.cell\.sub\s*\{[^}]*opacity/.test(css));

select.value = "";
select.dispatchEvent(new window.Event("change"));

console.log(`\n${failures === 0 ? "TOUT PASSE" : failures + " ÉCHEC(S)"}\n`);
process.exit(failures ? 1 : 0);
