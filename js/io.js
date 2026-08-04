/* ============================================================================
   Entrées / sorties de fichiers.

   C'est le seul mécanisme de persistance : un layer se transporte par fichier,
   jamais par le stockage du navigateur. Le JSON est chiffré par défaut, une
   évaluation de maturité étant une donnée sensible ; l'export en clair reste
   possible pour inspecter ou retoucher un fichier à la main.
   ========================================================================= */

import { toJSON, fromJSON, fromWorkbook, toWorkbook } from "./layer.js";
import { buildMatrixScores, mitigationLevels } from "./scoring.js";
import { download, slug } from "./ui.js";

const ENCRYPTED_PREFIX = "CTRM1:";

/* ------------------------------------------------------------------ export */

export function exportJSON(layer, passphrase = "") {
    let payload = toJSON(layer);
    let suffix = "";

    if (passphrase) {
        payload = ENCRYPTED_PREFIX + CryptoJS.AES.encrypt(payload, passphrase).toString();
        suffix = "-chiffre";
    }

    download(`${slug(layer.name)}${suffix}.json`, new Blob([payload], { type: "application/json" }));
}

export function exportExcel(layer, data) {
    const levels = mitigationLevels(layer);
    const scores = buildMatrixScores(data, layer);
    const wb = toWorkbook(layer, data, scores, levels);
    XLSX.writeFile(wb, `${slug(layer.name)}.xlsx`);
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
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
        return fromWorkbook(wb, { name });
    }

    let text = (await file.text()).trim();

    if (text.startsWith(ENCRYPTED_PREFIX)) {
        if (!passphrase) throw new Error("ce fichier est chiffré, saisissez la clé de déchiffrement");
        text = decrypt(text.slice(ENCRYPTED_PREFIX.length), passphrase);
    }

    try {
        return fromJSON(text);
    } catch (err) {
        if (err instanceof SyntaxError) throw new Error("le fichier n'est pas un JSON valide");
        throw err;
    }
}

/**
 * Déchiffre, en ramenant tous les échecs à un message unique.
 * Sur une clé erronée, CryptoJS lève « Malformed UTF-8 data » ou rend une
 * chaîne vide selon les octets obtenus : les deux cas veulent dire la même
 * chose pour qui utilise l'outil.
 */
function decrypt(payload, passphrase) {
    let clear = "";
    try {
        clear = CryptoJS.AES.decrypt(payload, passphrase).toString(CryptoJS.enc.Utf8);
    } catch {
        throw new Error("clé de déchiffrement incorrecte");
    }
    if (!clear) throw new Error("clé de déchiffrement incorrecte");
    return clear;
}

/** Vrai si le fichier attend une clé de déchiffrement. */
export async function isEncrypted(file) {
    if (!/\.json$/i.test(file.name)) return false;
    return (await file.slice(0, ENCRYPTED_PREFIX.length).text()) === ENCRYPTED_PREFIX;
}
