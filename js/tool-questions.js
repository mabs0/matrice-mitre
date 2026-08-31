/* ============================================================================
   Où le champ « Outil en place » a du sens.

   Le champ était proposé sous chaque question. Sur « Votre organisation
   propose-t-elle une formation en sécurité du développement ? », il n'y a rien
   à nommer : le champ pèse sur la page et laisse penser qu'on attend une
   réponse qui n'existe pas.

   Le classeur ne porte pas l'information — sa colonne F est vide partout, elle
   est faite pour recevoir la saisie du répondant, pas pour déclarer qui la
   mérite. Elle est donc déduite du texte de la question : on demande un outil
   quand la question porte sur un moyen technique déployé, et pas quand elle
   porte sur une pratique, une politique ou une organisation.

   Tenu à la main, comme `shared-questions.js`, et pour la même raison : c'est un
   arbitrage, pas une donnée extractible. `EXCEPTIONS` a le dernier mot sur la
   déduction — c'est là qu'on corrige un cas plutôt que de tordre les listes de
   mots.
   ========================================================================= */

/* Ce qui dénote un outil : un produit, une brique, un dispositif qu'on nomme.
   Les mots sont cherchés sur des limites de mots, accents compris, pour que
   « scan » n'attrape pas « scandale » ni « outil » « outillage ». */
const MOYENS = [
    "solution", "outil", "logiciel", "produit", "plateforme", "console",
    "mécanisme", "dispositif", "agent", "passerelle", "bastion",
    "antivirus", "antimalware", "edr", "xdr", "siem", "soar", "ids", "ips",
    "waf", "pare-feu", "firewall", "proxy", "vpn", "sonde", "sandbox",
    "scanner", "scan", "scans", "mfa", "2fa", "sso", "iam", "pam", "coffre-fort",
    "gestionnaire", "annuaire", "chiffrement", "sauvegarde", "sauvegardes",
    "supervision", "journalisation", "correctifs", "durcissement",
    "cloisonnement", "segmentation", "filtrage", "inventaire",
];

/* Ce qui dénote une pratique, une règle ou une organisation : même si un outil
   traîne dans la phrase, ce n'est pas lui qu'on interroge. Ces marqueurs
   l'emportent sur les précédents. */
const PRATIQUES = [
    "politique", "procédure", "processus formalisé", "charte", "gouvernance",
    "responsable désigné", "responsabilités", "sensibilisation", "formation",
    "revue", "revues", "audit", "audits", "auditées", "auditée",
    "documenté", "documentée", "documentés", "documentées", "formalisé",
    "formalisée", "approuvé", "approuvée", "validée par", "comité",
];

/** Cas où la déduction se trompe. Clé « M10xx:num », valeur booléenne. */
const EXCEPTIONS = {};

/* Une question qui cite des produits en exemple demande évidemment un produit :
   « … est-elle bloquée automatiquement (ex : AppLocker, WDAC, Gatekeeper) ? ».
   Le nom propre est le signal — une parenthèse d'exemples en minuscules énumère
   des cas de figure, pas des logiciels. */
const CITE_UN_PRODUIT = /\(\s*(?:ex|par ex(?:emple)?)\s*[:.]\s*[^)]*\p{Lu}[^)]*\)/u;

/* Le pluriel n'est pas listé : « logiciel » doit reconnaître « logiciels », et
   allonger les listes à la main les rendrait fausses au premier oubli. */
const motPresent = (texte, mot) =>
    new RegExp(`(^|[^\\p{L}\\p{N}-])${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?([^\\p{L}\\p{N}-]|$)`, "iu")
        .test(texte);

/**
 * Le champ « Outil en place » doit-il être proposé sous cette question ?
 *
 * @param {string} mitigationId identifiant M10xx
 * @param {{num: number, text: string}} question
 */
export function needsTool(mitigationId, question) {
    const cle = `${mitigationId}:${question.num}`;
    if (cle in EXCEPTIONS) return EXCEPTIONS[cle];

    const texte = String(question.text ?? "");
    // Citer des produits en exemple tranche la question, même si la phrase parle
    // par ailleurs de politique : on demande bien lequel est en place.
    if (CITE_UN_PRODUIT.test(texte)) return true;
    if (PRATIQUES.some(mot => motPresent(texte, mot))) return false;
    return MOYENS.some(mot => motPresent(texte, mot));
}
