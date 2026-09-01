/* ============================================================================
   Questions communes à plusieurs mitigations.

   Le classeur pose plusieurs fois la même question, sur des onglets différents.
   Elle ne doit être posée qu'une fois, et sa réponse alimenter chaque mitigation
   concernée — chacune l'appliquant au niveau qu'elle a elle-même déclaré, qui
   n'est pas forcément le même. Une réponse « Oui » peut valoir un palier 3 ici
   et un palier 4 là.

   Ce fichier est tenu à la main : décider que deux formulations désignent la
   même question est un jugement, pas une donnée extractible. Il est donc séparé
   de `catalog.js`, qui est régénéré depuis le classeur.

   Modèle de stockage. Un groupe a un unique porteur, sa première question dans
   l'ordre du catalogue. La réponse ne vit que là ; les autres membres la lisent
   par résolution (`resolvedEntries`). On évite ainsi deux copies susceptibles de
   diverger, et le schéma du layer reste inchangé.

   `text` n'est renseigné que si les membres ne sont pas formulés à l'identique :
   on affiche alors une seule formulation, la plus large, plutôt que celle de la
   mitigation où l'on se trouve par hasard.
   ========================================================================= */

/* Écart assumé avec le classeur : il annote « réutiliser la réponse de M1018 Q2 »
   au-dessus de M1027 Q2, mais les deux questions ne portent pas sur la même
   chose — robustesse, non-réutilisation et durée de validité d'un côté, longueur
   minimale et refus des mots de passe faibles de l'autre. Elles restent posées
   séparément. `tools/build-catalog.mjs` signale cet écart à chaque exécution,
   c'est voulu. */

/** @typedef {{mitigation: string, question: number}} Member */

/** @type {Array<{key: string, text?: string, members: Member[]}>} */
export const SHARED_GROUPS = [
    {
        key: "acces-par-groupes",
        // M1015 parle de « ressources », M1022 des seuls « fichiers et
        // répertoires » : on garde le périmètre le plus large.
        text: "Les droits d'accès aux ressources sont-ils attribués principalement via des groupes de sécurité plutôt que directement aux comptes utilisateurs ?",
        members: [
            { mitigation: "M1015", question: 5 },   // niveau 2
            { mitigation: "M1022", question: 2 },   // niveau 1
        ],
    },
    {
        key: "mfa-comptes-privilegies",
        // M1026 dit « obligatoire pour la connexion », les deux autres
        // « activée pour les comptes à privilèges ou sensibles ».
        text: "L'authentification multifacteur (MFA) est-elle activée pour les comptes à privilèges ou sensibles ?",
        members: [
            { mitigation: "M1018", question: 5 },   // niveau 3
            { mitigation: "M1026", question: 7 },   // niveau 2
            { mitigation: "M1027", question: 5 },   // niveau 3
        ],
    },
    {
        key: "comptes-inactifs-desactives",
        members: [
            { mitigation: "M1018", question: 6 },   // niveau 3
            { mitigation: "M1036", question: 11 },  // niveau 4
        ],
    },
    {
        key: "revue-filtrage-reseau",
        // Le classeur parlait de filtrage Web sur M1021 et de filtrage réseau
        // sur M1037 : c'est bien la même revue, formulée au périmètre réseau.
        text: "Les politiques de filtrage réseau sont-elles revues périodiquement afin de s'adapter aux nouveaux usages et aux évolutions des menaces ?",
        members: [
            { mitigation: "M1021", question: 10 },  // niveau 4
            { mitigation: "M1037", question: 5 },   // niveau 3
        ],
    },
    {
        key: "protection-memoire",
        // M1025 vise les processus privilégiés, M1050 les vulnérabilités : même
        // contrôle technique, on retient la finalité la plus générale.
        text: "Les systèmes utilisent-ils des mécanismes de protection mémoire natifs du système d'exploitation (ex : DEP, ASLR, CFG) pour limiter l'exploitation des vulnérabilités ?",
        members: [
            { mitigation: "M1025", question: 1 },   // niveau 1
            { mitigation: "M1050", question: 1 },   // niveau 1
        ],
    },
    {
        key: "installation-par-utilisateurs-standards",
        members: [
            { mitigation: "M1033", question: 1 },   // niveau 1
            { mitigation: "M1038", question: 1 },   // niveau 1
        ],
    },
];

const at = (mitigationId, num) => `${mitigationId}:${num}`;

/** Index membre -> groupe, construit une fois. */
const BY_MEMBER = new Map();
for (const group of SHARED_GROUPS) {
    for (const m of group.members) BY_MEMBER.set(at(m.mitigation, m.question), group);
}

/** Le groupe auquel appartient une question, ou null. */
export const groupOf = (mitigationId, num) => BY_MEMBER.get(at(mitigationId, num)) ?? null;

/** Le porteur de la réponse : le premier membre déclaré. */
export const primaryOf = group => group.members[0];

/** Formulation commune à retenir, ou null si les membres sont déjà identiques. */
export function sharedText(mitigationId, num) {
    return groupOf(mitigationId, num)?.text ?? null;
}

/**
 * Cette question a-t-elle déjà été tranchée depuis une autre mitigation ?
 *
 * C'est ce qu'il faut savoir avant de l'afficher : reposer mot pour mot une
 * question déjà répondue use la patience, et la réponse ne pourrait de toute
 * façon pas différer — elle est unique pour tout le groupe. Le questionnaire
 * franchit donc ces questions-là au lieu de les poser.
 *
 * `askedIn` dit d'où la réponse a été donnée. Il manque sur un fichier antérieur
 * ou relu depuis un classeur : le porteur du groupe fait alors foi, ce qui
 * revient à considérer la question comme posée là où elle est rangée.
 *
 * @returns {{value: string}|null} l'entrée, ou null s'il faut poser la question
 */
export function answeredElsewhere(layer, mitigationId, num) {
    const group = groupOf(mitigationId, num);
    if (!group) return null;

    const primary = primaryOf(group);
    const entry = layer?.answers?.[primary.mitigation]?.[primary.question];
    if (!entry?.value) return null;

    return (entry.askedIn || primary.mitigation) === mitigationId ? null : entry;
}

/** Les autres mitigations qui partagent cette question. */
export function sharedWith(mitigationId, num) {
    const group = groupOf(mitigationId, num);
    if (!group) return [];
    return group.members.filter(m => m.mitigation !== mitigationId).map(m => m.mitigation);
}

/**
 * Les réponses d'une mitigation, questions communes résolues.
 *
 * C'est le seul point de lecture des réponses : tout ce qui note, compte
 * l'avancement ou exporte passe par ici, et voit donc la même chose que ce que
 * l'utilisateur a réellement répondu, où qu'il l'ait répondu.
 *
 * @returns {Record<string, {value: string, tool: string, note: string, at: string|null}>}
 */
export function resolvedEntries(layer, mitigationId) {
    const own = layer?.answers?.[mitigationId] ?? {};
    const questionnaire = layer?.catalog?.get(mitigationId);
    if (!questionnaire) return own;

    let out = null;   // copié seulement s'il y a quelque chose à résoudre
    for (const q of questionnaire.questions) {
        if (own[q.num] !== undefined) continue;
        const group = groupOf(mitigationId, q.num);
        if (!group) continue;
        const primary = primaryOf(group);
        const borrowed = layer.answers?.[primary.mitigation]?.[primary.question];
        if (!borrowed) continue;
        (out ??= { ...own })[q.num] = borrowed;
    }
    return out ?? own;
}

/**
 * Où écrire la réponse à une question : son porteur si elle est commune,
 * elle-même sinon.
 *
 * @returns {Member}
 */
export function writeTarget(mitigationId, num) {
    const group = groupOf(mitigationId, num);
    return group ? primaryOf(group) : { mitigation: mitigationId, question: Number(num) };
}

/** Nombre de questions économisées par la mutualisation. */
export const savedQuestions = () =>
    SHARED_GROUPS.reduce((n, g) => n + g.members.length - 1, 0);
