/* ============================================================================
   Produit un classeur d'exemple, avec le vrai référentiel ATT&CK et un layer
   partiellement rempli.

   À lancer à la main quand on touche à la mise en forme : le banc vérifie la
   structure du fichier, mais seul un tableur dit si le résultat est beau.

       node tools/exemple-classeur.mjs ~/Téléchargements/ctrm-exemple.xlsx

   Les niveaux sont déterministes : deux relances donnent le même fichier, on
   compare donc deux versions de la mise en forme sur les mêmes données.
   ========================================================================= */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, "..");
const module = chemin => import(`file://${resolve(racine, chemin)}`);

// La bibliothèque n'est une dépendance que du banc : le site la prend au CDN.
const ExcelJS = (await import(`file://${resolve(racine, "test/node_modules/exceljs/excel.js")}`)).default;

const { loadAttack } = await module("js/attack.js");
const { createLayer, setAnswer } = await module("js/layer.js");
const { buildWorkbook } = await module("js/excel.js");
const { buildMatrixScores, mitigationLevels } = await module("js/scoring.js");
const { QUESTIONNAIRES } = await module("js/catalog.js");

const sortie = process.argv[2];
if (!sortie) {
    console.error("usage : node tools/exemple-classeur.mjs <fichier.xlsx>");
    process.exit(1);
}

const data = await loadAttack();
console.log(`référentiel v${data.version} : ${data.counts.techniques} techniques, ${data.counts.mitigations} mitigations`);

// Deux mitigations sur trois traitées, avec des « Non » à des paliers variés :
// c'est ce qui fait apparaître toute la rampe dans le fichier.
const layer = createLayer({ name: "Exemple de restitution", attackVersion: data.version });
let i = 0;
for (const [id, questionnaire] of QUESTIONNAIRES) {
    i++;
    if (i % 3 === 0) continue;
    const arret = (i * 7) % (questionnaire.questions.length + 1);
    for (const [k, question] of questionnaire.questions.entries()) {
        if (k > arret) break;
        setAnswer(layer, id, question.num, {
            value: k === arret ? "Non" : "Oui",
            tool: k === 0 ? "Entra ID" : "",
        });
    }
}

const levels = mitigationLevels(layer);
const scores = buildMatrixScores(data, layer);
const wb = buildWorkbook(ExcelJS, layer, data, scores, levels);
writeFileSync(sortie, Buffer.from(await wb.xlsx.writeBuffer()));

const repartition = [0, 1, 2, 3, 4].map(n => [...levels.values()].filter(v => v === n).length);
console.log(`écrit : ${sortie}`);
console.log(`mitigations évaluées : ${levels.size} / ${QUESTIONNAIRES.size}, répartition 0→4 : ${repartition.join(" ")}`);
