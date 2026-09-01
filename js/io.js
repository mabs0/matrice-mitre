/* ============================================================================
   Entrées / sorties de fichiers.

   C'est le seul mécanisme de persistance : un layer se transporte par fichier,
   jamais par le stockage du navigateur. Le JSON est chiffré par défaut, une
   évaluation de maturité étant une donnée sensible ; l'export en clair reste
   possible pour inspecter ou retoucher un fichier à la main.
   ========================================================================= */

import { toJSON, fromJSON } from "./layer.js";
import { buildWorkbook, readWorkbook, loadExcel } from "./excel.js";
import { buildMatrixScores, mitigationLevels } from "./scoring.js";
import { download, slug } from "./ui.js";
import { chiffrer, dechiffrer, PREFIXE } from "./crypto.js";

/* ------------------------------------------------------------------ export */

/**
 * Nom des fichiers produits.
 *
 * Fixe, et suffixé de l'organisation lorsqu'elle est renseignée. Le nom du layer
 * ne fait pas un bon nom de fichier : il est libre, souvent daté, et il ne dit
 * pas de quel outil vient le fichier — or c'est la première chose à savoir dans
 * un dossier de téléchargements. L'organisation, elle, est ce qui distingue deux
 * évaluations qu'on garde côte à côte.
 */
const BASE_NAME = "maptrix";

export function exportName(layer) {
    const org = layer?.respondent?.org?.trim();
    return org ? `${BASE_NAME}-${slug(org)}` : BASE_NAME;
}

/**
 * Écrit le layer en JSON, chiffré si une clé est fournie.
 *
 * Asynchrone parce que le chiffrement l'est : dériver la clé coûte quelques
 * centaines de milliers d'itérations, et c'est précisément ce qui le rend
 * résistant. L'appelant doit donc l'attendre — et prévenir, l'écriture n'étant
 * plus instantanée.
 */
export async function exportJSON(layer, passphrase = "") {
    const clair = toJSON(layer);
    const payload = passphrase ? await chiffrer(clair, passphrase) : clair;
    const suffix = passphrase ? "-chiffre" : "";

    download(`${exportName(layer)}${suffix}.json`, new Blob([payload], { type: "application/json" }));
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Écrit le classeur. La bibliothèque n'arrive qu'ici : elle pèse 250 Ko et ne
 * sert qu'à ce moment-là.
 */
export async function exportExcel(layer, data) {
    const ExcelJS = await loadExcel();
    const levels = mitigationLevels(layer);
    const scores = buildMatrixScores(data, layer);
    const wb = buildWorkbook(ExcelJS, layer, data, scores, levels);
    const buffer = await wb.xlsx.writeBuffer();
    download(`${exportName(layer)}.xlsx`, new Blob([buffer], { type: XLSX_MIME }));
}

/* ------------------------------------------------------------------ import */

/**
 * Lit un fichier de layer : JSON (clair ou chiffré) ou classeur Excel.
 *
 * Dans les deux cas il s'agit d'un fichier produit par cet outil : c'est le seul
 * point d'entrée. Rien ne prétend deviner un autre format.
 *
 * @param {File} file
 * @param {string} passphrase requise seulement si le JSON est chiffré
 */
export async function readLayerFile(file, passphrase = "") {
    const name = file.name.replace(/\.(json|xlsx|xls)$/i, "");

    if (/\.(xlsx|xls)$/i.test(file.name)) {
        const ExcelJS = await loadExcel();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await file.arrayBuffer());
        return readWorkbook(wb, { name });
    }

    let text = (await file.text()).trim();

    if (text.startsWith(PREFIXE)) {
        if (!passphrase) throw new Error("ce fichier est chiffré, saisissez la clé de déchiffrement");
        text = await dechiffrer(text, passphrase);
    }

    try {
        return fromJSON(text);
    } catch (err) {
        if (err instanceof SyntaxError) throw new Error("le fichier n'est pas un JSON valide");
        throw err;
    }
}

/** Vrai si le fichier attend une clé de déchiffrement. */
export async function isEncrypted(file) {
    if (!/\.json$/i.test(file.name)) return false;
    return (await file.slice(0, PREFIXE.length).text()) === PREFIXE;
}
