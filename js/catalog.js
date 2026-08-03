/* ============================================================================
   Catalogue du questionnaire.

   Extrait fidèle de docs/Mitigations MITRE ATT&CK v9.xlsx. Un onglet M10xx du
   classeur devient une entrée de ce catalogue :

     A1:B3    -> id, name, description
     A7:E7    -> les cinq niveaux
     A8:E8    -> bareme[0..4]
     colonne A -> num          colonne G -> level
     colonne B -> text         colonne H -> docRequired
     colonne I -> references

   Les colonnes E (Réponse) et F (Outil) du classeur sont saisies par
   l'utilisateur : elles vivent dans le layer, pas ici.

   Cinq mitigations sont renseignées pour l'instant — les 39 autres
   (328 questions au total) se déclarent exactement sur ce modèle, sans
   toucher au reste du code.

   Une mitigation peut aussi porter un champ `contributions` : le classeur
   ajuste la note de M1016 de ±0,25 selon la réponse à une question de M1049,
   qui n'est posée qu'une seule fois. Voir `contributionOf` dans scoring.js.
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

const M1032 = {
    id: "M1032",
    name: "Multi-factor Authentication",
    description: "L'authentification multi-facteur (MFA) améliore la sécurité en exigeant que les utilisateurs fournissent au moins deux formes de vérification pour prouver leur identité avant de leur accorder l'accès.",
    bareme: [
        "Aucun mécanisme d'authentification à plusieurs facteurs en place.",
        "MFA activé de manière ponctuelle, sans politique claire ni cohérence globale.",
        "MFA appliqué sur des comptes critiques, avec une politique partielle.",
        "MFA obligatoire sur tous les comptes sensibles, avec processus formalisé et suivi.",
        "MFA adaptatif et contextuel, géré de façon centralisée, avec revues régulières et audit.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.2, 8.5, 5.17 ; NIST PR.AC-7, PR.AC-6",
            text: "Votre organisation applique-t-elle une authentification multi-facteurs (MFA) pour les comptes utilisateurs sensibles (administrateurs, comptes cloud, développeurs, etc.) ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.3, 8.5 ; NIST PR.AC-5",
            text: "MFA est-il activé sur tous les services exposés à Internet (VPN, RDP, SaaS, Webmail, etc.) ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.1, 5.16, 5.17 ; NIST PR.IP-1",
            text: "Une politique formelle d'authentification incluant le MFA est-elle définie et diffusée ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.5 ; NIST PR.AC-7",
            text: "Le MFA repose-t-il sur au moins deux facteurs distincts conformes (ex : OTP + mot de passe, carte à puce, biométrie…) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.2, 8.3, 8.4 ; NIST PR.IP-11",
            text: "Le MFA est-il contextuel ou adaptatif (en fonction du rôle, du lieu, de l'état du terminal, etc.) ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 5.36 ; NIST PR.IP-8",
            text: "L'organisation effectue-t-elle des revues régulières des activations/désactivations MFA ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 8.15, 8.16 ; NIST DE.CM-7",
            text: "Des alertes sont-elles générées en cas d'échec MFA répété ou de contournement ?",
        },
    ],
};

const M1016 = {
    id: "M1016",
    name: "Vulnerability Scanning",
    description: "Le balayage des vulnérabilités implique l'évaluation automatisée ou manuelle des systèmes, applications et réseaux pour identifier les mauvaises configurations, les logiciels non mis à jour ou d'autres faiblesses de sécurité. Ce processus aide à prioriser les efforts de remédiation en classant les vulnérabilités en fonction du risque et de l'impact.",
    bareme: [
        "Aucune activité de scan de vulnérabilités n'est en place.",
        "Des scans sont réalisés ponctuellement et sans cadre formel, sur initiative locale.",
        "Des scans sont réalisés régulièrement selon un processus planifié. Résultats suivis mais peu intégrés aux décisions.",
        "Le processus est documenté et centralisé, les résultats sont analysés et suivis dans un outil avec des responsables désignés.",
        "Le processus est automatisé, intégré dans la gestion des vulnérabilités, et inscrit dans une démarche d'amélioration continue.",
    ],
    // La note est ajustée de ±0,25 selon la réponse à la question 5 de M1049,
    // qui n'est posée qu'une fois. Voir `contributionOf` dans scoring.js.
    contributions: [{ from: "M1049", question: 5, weight: 0.25 }],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.8 ; NIST PR.IP-12",
            text: "Votre organisation réalise-t-elle des scans de vulnérabilités sur ses systèmes ou applications ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.8 ; NIST PR.IP-12",
            text: "Les scans de vulnérabilités sont-ils réalisés selon une fréquence définie et adaptée aux risques de l'organisation ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 5.7 ; NIST DE.CM-8",
            text: "Les scans couvrent-ils à la fois les systèmes internes et les services exposés (DMZ, cloud, applications publiques) ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 5.7, 8.16 ; NIST DE.CM-8",
            text: "Les scans sont-ils réalisés via un outil automatisé ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 5.7, 8.16 ; NIST ID.RA-1, ID.RA-2",
            text: "Les résultats des scans de vulnérabilités sont-ils intégrés dans un processus formel de gestion des vulnérabilités et des risques ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 8.8 ; NIST PR.IP-12",
            text: "Les vulnérabilités critiques sont-elles traitées selon une procédure définie avec délais de remédiation et priorisation des risques ?",
        },
    ],
};

const M1049 = {
    id: "M1049",
    name: "Antivirus/Antimalware",
    description: "Les solutions antivirus/antimalware utilisent des signatures, des heuristiques et une analyse comportementale pour détecter, bloquer et remédier aux logiciels malveillants. Elles surveillent en continu les points de terminaison et les systèmes, et doivent être déployées sur tous les appareils avec des mises à jour automatisées.",
    bareme: [
        "Aucune protection n'est mise en œuvre.",
        "Une solution antivirus/antimalware est présente, mais de manière non uniforme ou isolée, sans gestion centralisée.",
        "Une solution est déployée sur l'ensemble des postes critiques (serveurs, endpoints), avec une gestion centralisée, mise à jour automatiquement, utilisant des signatures et heuristiques classiques.",
        "Le système est déployé de manière complète et cohérente, avec des fonctions de détection avancée. Les logs sont centralisés, surveillés et utilisés activement dans la détection d'anomalies.",
        "En plus des éléments précédents, l'organisation dispose d'un processus d'amélioration continue fondé sur les tests, les incidents observés et l'évolution des menaces. L'efficacité de la solution est mesurée et optimisée.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.7 ; NIST DE.CM-4",
            text: "Votre organisation utilise-t-elle des solutions antivirus et/ou antimalware pour détecter les menaces par signatures et heuristiques ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.7, 8.19 ; NIST PR.DS-1",
            text: "Ces solutions couvrent-elles l'ensemble des actifs (serveurs, endpoints, mobiles) et sont-elles centralisées pour une gestion et une visibilité globales ?",
        },
        {
            num: 3, level: 3, docRequired: false,
            references: "ISO 27002 8.7 ; NIST DE.CM-4, PR.IP-12",
            text: "Les solutions antivirus sont-elles mises à jour automatiquement et incluent-elles des capacités de détection avancée (heuristique, apprentissage automatique, sandboxing) ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 8.9 ; NIST PR.PT-1",
            text: "Les logs des antivirus sont-ils collectés, centralisés et revus régulièrement pour détecter des attaques persistantes ou des échecs de détection ?",
        },
        {
            // Cette réponse alimente aussi M1016, à hauteur de ±0,25.
            num: 5, level: 4, docRequired: true,
            references: "ISO 27002 8.8 ; NIST PR.IP-12",
            text: "Votre entreprise effectue-t-elle des tests d'intrusion ou des simulations de menaces pour valider l'efficacité des solutions antivirus et antimalware ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 8.7 ; NIST PR.IP-12",
            text: "Votre entreprise dispose-t-elle d'un processus de mise à jour et d'amélioration des protections antivirus fondé sur l'évolution des menaces ?",
        },
    ],
};

const M1018 = {
    id: "M1018",
    name: "User Account Management",
    description: "La gestion des comptes utilisateurs implique la mise en œuvre et l'application de politiques pour le cycle de vie des comptes utilisateurs, y compris la création, la modification et la désactivation. Une gestion appropriée des comptes réduit la surface d'attaque en limitant l'accès non autorisé, en gérant les privilèges des comptes et en veillant à ce que les comptes soient utilisés conformément aux politiques organisationnelles.",
    bareme: [
        "Aucune gestion des comptes utilisateurs.",
        "Les règles de gestion des comptes utilisateurs existent.",
        "Un minimum de règles sont en place sur les comptes utilisateurs.",
        "La plupart des règles recommandées pour la gestion des comptes utilisateurs sont mises en place.",
        "Toutes les règles sont en place et vérifiées de manière régulière.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO/IEC 27002 5.18 ; NIST CSF 2.0 PR.AA-01",
            text: "Avez-vous mis en place un processus formel pour la création, la modification et la suppression des comptes utilisateurs ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO/IEC 27002 5.15, 8.2 ; NIST CSF 2.0 PR.AA-05",
            text: "Des exigences relatives à la robustesse, à la non-réutilisation et, lorsque cela est applicable, à la durée de validité des mots de passe sont-elles définies et appliquées ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO/IEC 27002 5.18, 8.5 ; NIST CSF 2.0 PR.AA-05",
            text: "Les utilisateurs disposent-ils uniquement des droits nécessaires à l'exécution de leurs tâches (moindre privilège) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO/IEC 27002 5.18 ; NIST CSF 2.0 PR.AA-03",
            text: "Réalisez-vous des revues périodiques des comptes utilisateurs et à privilèges afin de vérifier leur légitimité et leurs droits ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO/IEC 27002 5.17, 8.2 ; NIST CSF 2.0 PR.AA-05",
            text: "L'authentification multifacteur (MFA) est-elle activée pour les comptes à privilèges ou sensibles ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO/IEC 27002 5.18, 8.2 ; NIST CSF 2.0 PR.AA-05",
            text: "Les comptes inactifs sont-ils automatiquement désactivés après une période définie ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO/IEC 27002 5.17, 8.5 ; NIST CSF 2.0 PR.AA-05",
            text: "Les comptes sont-ils verrouillés après un nombre défini d'échecs d'authentification ?",
        },
        {
            num: 8, level: 3, docRequired: false,
            references: "ISO/IEC 27002 5.17",
            text: "Les comptes de service disposent-ils de mots de passe complexes et uniques, et leur usage est-il restreint aux systèmes et tâches autorisés ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "ISO/IEC 27002 5.17, 8.5 ; NIST CSF 2.0 PR.AA-05",
            text: "Les connexions automatiques et liées des comptes à privilèges sont-elles limitées à des postes ou à des environnements spécifiques ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "",
            text: "L'authentification multifacteur est-elle déployée pour l'ensemble des utilisateurs lorsque cela est applicable ?",
        },
        {
            num: 11, level: 4, docRequired: true,
            references: "ISO/IEC 27002 5.15, 8.2",
            text: "Des audits périodiques permettent-ils de vérifier l'efficacité de la gestion des comptes, la légitimité des droits attribués et la présence éventuelle de comptes inactifs ou orphelins ?",
        },
    ],
};

const M1027 = {
    id: "M1027",
    name: "Password Policies",
    description: "Définissez et appliquez des politiques de mots de passe sécurisés pour les comptes afin de réduire la probabilité d'accès non autorisé. Les politiques de mots de passe robustes incluent l'application de la complexité des mots de passe, l'exigence de changements réguliers de mots de passe et la prévention de la réutilisation des mots de passe.",
    bareme: [
        "Aucune politique de gestion des mots de passe n'est définie ou appliquée. Les utilisateurs définissent librement leurs mots de passe sans exigences de sécurité.",
        "Des règles de base relatives à la gestion des mots de passe sont définies, mais elles sont limitées ou appliquées de manière hétérogène. Les exigences de sécurité restent partielles ou peu contrôlées.",
        "Une politique de gestion des mots de passe est définie et appliquée de manière centralisée. Elle impose des exigences adaptées de longueur et de robustesse, et empêche, lorsque cela est possible, l'utilisation de mots de passe faibles, triviaux ou compromis.",
        "La politique est renforcée par des mécanismes complémentaires : authentification multi-facteurs pour les comptes sensibles, solutions de gestion sécurisée des mots de passe et contrôles réguliers du respect des politiques.",
        "Les politiques sont régulièrement revues afin de suivre l'évolution des menaces et des recommandations de sécurité. Des mécanismes permettent de détecter ou d'empêcher l'utilisation de mots de passe compromis ou connus comme faibles.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 5.17",
            text: "L'organisation dispose-t-elle d'une politique formelle définissant les règles de gestion des mots de passe ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 5.17",
            text: "Des exigences minimales de longueur ainsi que des mécanismes empêchant l'utilisation de mots de passe faibles, triviaux ou compromis sont-ils définis et appliqués dans les systèmes d'authentification ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.17",
            text: "L'utilisation d'une solution de gestion sécurisée des mots de passe (coffre-fort ou équivalent) est-elle intégrée à l'organisation et à sa politique de sécurité ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.2",
            text: "Les règles de gestion des mots de passe sont-elles appliquées de manière centralisée via les systèmes d'authentification ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.5",
            text: "L'authentification multifacteur (MFA) est-elle activée pour les comptes à privilèges ou sensibles ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27001 9.2",
            text: "Les politiques de mots de passe font-elles l'objet de contrôles ou d'audits afin de vérifier leur bonne application ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 5.36",
            text: "Les politiques de mots de passe sont-elles revues régulièrement afin de s'adapter à l'évolution des menaces et des recommandations de sécurité ?",
        },
        {
            num: 8, level: 4, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les systèmes d'authentification empêchent-ils l'utilisation de mots de passe compromis, triviaux ou figurant dans des listes de mots de passe interdits ?",
        },
    ],
};

/**
 * Mitigations pour lesquelles un questionnaire est disponible, par identifiant.
 * L'ordre de cette Map est l'ordre de parcours du questionnaire.
 *
 * À noter : la question 5 de M1018 et de M1027 est la même que le sujet de
 * M1032 (le MFA sur les comptes sensibles). Le cadrage prévoit de mutualiser
 * une réponse entre mitigations pour éviter de la poser plusieurs fois et de la
 * compter deux fois ; ce n'est pas encore implémenté.
 */
export const CATALOG = new Map([
    [M1016.id, M1016],
    [M1018.id, M1018],
    [M1027.id, M1027],
    [M1032.id, M1032],
    [M1049.id, M1049],
]);

export const getQuestionnaire = id => CATALOG.get(id) || null;

/** Nombre total de questions du catalogue disponible. */
export const totalQuestions = () =>
    [...CATALOG.values()].reduce((n, m) => n + m.questions.length, 0);
