/* ============================================================================
   Catalogue du questionnaire — généré depuis docs/Mitigations MITRE ATT&CK v9.xlsx.

   Un onglet M10xx du classeur devient une entrée de ce catalogue :

     B1:B3     -> id, name, description
     A7:E7     -> les cinq niveaux          A8:E8 -> bareme[0..4]
     colonne A -> num                       colonne G -> level
     colonne B -> text                      colonne H -> docRequired
                                            colonne I -> references

   Les colonnes E (Réponse) et F (Outil) sont saisies par l'utilisateur : elles
   vivent dans le layer, pas ici.

   44 mitigations, 327 questions. M1055 n'a pas de questionnaire : la
   catégorie décrit les cas où l'on choisit délibérément de ne pas atténuer, il
   n'y a donc pas de maturité à mesurer.

   Deux mécanismes relient les mitigations entre elles, et ne se déclarent pas
   ici :

   - les **questions communes** à plusieurs mitigations, posées une seule fois et
     appliquées au niveau propre de chacune : `js/shared-questions.js`, tenu à la
     main parce que reconnaître deux formulations comme une même question est un
     arbitrage et non une donnée extractible.
   - les **contributions**, qui ajustent la note d'une mitigation d'un poids fixe
     selon une réponse donnée ailleurs : champ `contributions` ci-dessous, voir
     `contributionOf` dans scoring.js.
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


const M1013 = {
    id: "M1013",
    name: "Application Developer Guidance",
    description: "Les directives pour les développeurs d'applications se concentrent sur la fourniture aux développeurs des connaissances, outils et meilleures pratiques nécessaires pour écrire du code sécurisé, réduire les vulnérabilités et appliquer des principes de conception sécurisée. En intégrant la sécurité tout au long du cycle de vie du développement logiciel (SDLC), cette approche vise à prévenir l'introduction de faiblesses exploitables dans les applications, systèmes et API.",
    bareme: [
        "Aucune sensibilisation ou formation en développement sécurisé n'est mise en place.",
        "Une formation est proposée, mais elle n'est pas obligatoire ni récurrente.",
        "Une formation structurée et obligatoire est mise en place pour les développeurs.",
        "Un cycle de vie de développement sécurisé (SDLC) est intégré, avec des revues de code et des tests de sécurité",
        "Les pratiques de développement sécurisé sont auditées régulièrement et adaptées aux menaces émergentes.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.12, NIST PR.DS-5",
            text: "Votre organisation propose-t-elle une formation en sécurité du développement aux développeurs ?",
        },
        {
            num: 2, level: 3, docRequired: true,
            references: "ISO 27002 8.25 (Secure development lifecycle), 8.26 (Application security requirements), 8.28 (Secure coding)",
            text: "Votre organisation applique-t-elle un cycle de développement sécurisé (SDLC), incluant des revues de code et des tests de sécurité ?",
        },
        {
            num: 3, level: 4, docRequired: false,
            references: "ISO 27002 8.25 (Secure development lifecycle), 8.26 (Application security requirements), 8.28 (Secure coding)",
            text: "Les pratiques de développement sécurisé sont-elles auditées et mises à jour en fonction des nouvelles menaces ?",
        },
    ],
};

const M1015 = {
    id: "M1015",
    name: "Active Directory Configuration",
    description: "Implémentez des configurations Active Directory (AD) robustes à l'aide de politiques de groupe pour sécuriser les comptes utilisateurs, contrôler l'accès et minimiser la surface d'attaque. Les configurations AD permettent un contrôle centralisé des paramètres de compte, des politiques de connexion et des autorisations, réduisant ainsi le risque d'accès non autorisé et de mouvement latéral au sein du réseau. Cette atténuation peut être mise en œuvre grâce aux mesures suivantes : Configuration du compte, Restrictions de connexion interactive, Paramètres du bureau à distance,",
    bareme: [
        "L'organisation ne dispose pas d'infrastructure de gestion centralisée des identités de type Active Directory ou celle-ci n'est pas utilisée pour administrer les systèmes et les accès. Les comptes et les configurations sont gérés localement ou de manière disparate.",
        "Active Directory est déployé mais son utilisation pour la gestion des systèmes et des accès reste limitée ou hétérogène. Les configurations de sécurité sont peu structurées et les politiques de groupe sont peu utilisées ou appliquées de manière non maîtrisée.",
        "Active Directory est utilisé de manière généralisée pour gérer les systèmes et les comptes. Des stratégies de groupe et des groupes de sécurité sont utilisés pour appliquer des paramètres de configuration et des droits d'accès de base.",
        "L'architecture Active Directory est structurée et documentée. Les accès et les configurations sont gérés selon des règles définies et appliquées de manière homogène dans l'organisation.",
        "La sécurité de l'infrastructure Active Directory est renforcée par des mécanismes de durcissement, de journalisation centralisée et de supervision des événements critiques. Les configurations sont régulièrement revues et améliorées afin de s'adapter à l'évolution des menaces et du système d'information.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 5.15 / NIST PR.AA-1",
            text: "L'organisation dispose-t-elle d'une infrastructure de gestion centralisée des identités de type Active Directory ou équivalent ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 5.9 / NIST ID.AM-1",
            text: "Les postes de travail et serveurs du système d'information sont-ils rejoints au domaine Active Directory ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.15",
            text: "Les objets Active Directory sont-ils organisés dans des unités organisationnelles ou structurées permettant l'application cohérente de politiques de sécurité ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 8.9 / NIST PR.PT-3",
            text: "Des stratégies de groupe (GPO) sont-elles utilisées pour appliquer des paramètres de configuration et de sécurité aux postes et serveurs ?",
        },
        {
            num: 5, level: 2, docRequired: true,
            references: "ISO 27002 5.18",
            text: "Les droits d'accès aux ressources sont-ils attribués principalement via des groupes de sécurité plutôt que directement aux comptes utilisateurs ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27001 7.5",
            text: "L'architecture Active Directory est-elle documentée et maintenue à jour ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.15 / NIST DE.CM-1",
            text: "Les modifications sensibles dans Active Directory (création de comptes, modification de groupes, modification de GPO) sont-elles journalisées ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 8.16 / NIST DE.CM-7",
            text: "Les journaux d'événements Active Directory sont-ils centralisés et analysés (ex : via un SIEM ou une solution de supervision de sécurité) ?",
        },
    ],
};

const M1016 = {
    id: "M1016",
    name: "Vulnerability Scanning",
    description: "Le balayage des vulnérabilités implique l'évaluation automatisée ou manuelle des systèmes, applications et réseaux pour identifier les mauvaises configurations, les logiciels non mis à jour ou d'autres faiblesses de sécurité. Ce processus aide à prioriser les efforts de remédiation en classant les vulnérabilités en fonction du risque et de l'impact, réduisant ainsi la probabilité d'exploitation par des adversaires.",
    bareme: [
        "Aucune activité de scanning de vulnérabilités n'est en place.",
        "Des scans sont réalisés ponctuellement et sans cadre formel, sur initiative locale.",
        "Des scans sont réalisés régulièrement selon un processus planifié. Résultats suivis mais peu intégrés aux décisions.",
        "Le processus est documenté, centralisé, les résultats sont analysés et suivis dans un outil avec des responsables désignés.",
        "Le processus est automatisé, intégré dans la gestion des vulnérabilités, et une démarche d'amélioration continue.",
    ],
    contributions: [{ from: "M1049", question: 5, weight: 0.25 }],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.8, NIST PR.IP-12",
            text: "Votre organisation réalise-t-elle des scans de vulnérabilités sur ses systèmes ou applications ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.8, NIST PR.IP-12",
            text: "Les scans de vulnérabilités sont-ils réalisés selon une fréquence définie et adaptée aux risques de l'organisation ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 5.7; NIST DE.CM-8",
            text: "Les scans couvrent-ils à la fois les systèmes internes et les services exposés (DMZ, cloud, applications publiques) ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 5.7, 8.16; NIST DE.CM-8",
            text: "Les scans sont-ils réalisés via un outil automatisé ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 5.7, 8.16; NIST ID.RA-1, ID.RA-2",
            text: "Les résultats des scans de vulnérabilités sont-ils intégrés dans un processus formel de gestion des vulnérabilités et des risques ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 8.8, NIST PR.IP-12",
            text: "Les vulnérabilités critiques sont-elles traitées selon une procédure définie avec délais de remédiation et priorisation des risques ?",
        },
    ],
};

const M1017 = {
    id: "M1017",
    name: "User Training",
    description: "La formation des utilisateurs consiste à éduquer les employés et les entrepreneurs sur la reconnaissance, le signalement et la prévention des cybermenaces qui reposent sur l'interaction humaine, telles que le phishing, l'ingénierie sociale et d'autres techniques manipulatrices. Des programmes de formation complets créent un pare-feu humain en permettant aux utilisateurs de devenir un élément actif des défenses de cybersécurité de l'organisation.",
    bareme: [
        "Aucune formation en cybersécurité pour les employés.",
        "Formation informelle, occasionnelle et non obligatoire, initiée ponctuellement par certaines équipes sans suivi structuré.",
        "Programme structuré de sensibilisation avec sessions périodiques et documentation accessible, suivi de manière récurrente.",
        "Processus formel et généralisé : formations adaptées aux besoins de l'organisation.",
        "Processus optimisé et en amélioration continu; formation renforcée par des simulations régulières, analyses d'efficacité et ajustements continus selon les résultats.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 6.3, PR.AT-2",
            text: "Votre organisation dispose-t-elle d'un programme de formation en cybersécurité pour ses collaborateurs ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 6.3, PR.AT-2",
            text: "Cette formation est-elle obligatoire pour tous les collaborateurs?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 5.10, PR.AT-2",
            text: "Les formations couvrent-elles les risques liés au phishing, spearphishing et autres techniques d'ingénierie sociale ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 6.3 et 8.5, PR.AT-4",
            text: "La formation inclut-elle des recommandations spécifiques sur la gestion des mots de passe, MFA et les accès non sécurisés ?",
        },
        {
            num: 5, level: 2, docRequired: false,
            references: "ISO 27002 6.3, PR.AT-5",
            text: "La formation aborde-t-elle les bonnes pratiques pour éviter les infections via téléchargement de fichiers malveillants ou extensions de navigateur non approuvées ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 6.3",
            text: "La formation est-elle adaptée selon les postes occupés par les collaborateurs (postes pour les employés à haut risque par ex)?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 6.3",
            text: "Une formation sur la cybersécurité est-elle prévue lors du process d'intégration des nouveaux employés?",
        },
        {
            num: 8, level: 3, docRequired: false,
            references: "ISO 27002 6.3",
            text: "Les supports de formation sont-ils remis à jour de manière régulière afin d'inclure les nouvelles menaces et techniques utilisées par les adversaires ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "ISO 27002 6.3, PR.AT-5",
            text: "Votre organisation effectue-t-elle des simulations de phishing ou d'autres attaques pour tester la vigilance des collaborateurs ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "ISO 27002 6.3, PR.AT-4",
            text: "Les résultats des évaluations et simulations sont-ils utilisés pour améliorer les formations ?",
        },
    ],
};

const M1018 = {
    id: "M1018",
    name: "User Account Management",
    description: "La gestion des comptes utilisateurs implique la mise en œuvre et l'application de politiques pour le cycle de vie des comptes utilisateurs, y compris la création, la modification et la désactivation. Une gestion appropriée des comptes réduit la surface d'attaque en limitant l'accès non autorisé, en gérant les privilèges des comptes et en veillant à ce que les comptes soient utilisés conformément aux politiques organisationnelles.",
    bareme: [
        "Aucune gestion des comptes utilisateurs",
        "Les règles de gestion des comptes utilisateurs existent",
        "Un minimum de règles sont en place sur les comptes utilisateurs",
        "La plupart des règles recommandés pour la gestion des comptes utilisateurs sont mises en place",
        "Toutes les règles sont en place et vérifiées de manière régulière",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO/IEC 27002: 5.18 NIST CSF 2.0: PR.AA-01",
            text: "Avez-vous mis en place un processus formel pour la création, la modification et la suppression des comptes utilisateurs ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO/IEC 27002: 5.15 & 8.2 NIST CSF 2.0: PR.AA-05",
            text: "Des exigences relatives à la robustesse, à la non-réutilisation et, lorsque cela est applicable, à la durée de validité des mots de passe sont-elles définies et appliquées ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO/IEC 27002: 5.18 & 8.5 NIST CSF 2.0: PR.AA-05",
            text: "Les utilisateurs disposent-ils uniquement des droits nécessaires à l'exécution de leurs tâches (moindre privilège) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO/IEC 27002: 5.18 NIST CSF 2.0: PR.AA-03",
            text: "Réalisez-vous des revues périodiques des comptes utilisateurs et à privilèges afin de vérifier leur légitimité et leurs droits ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO/IEC 27002: 5.17 & 8.2 NIST CSF 2.0: PR.AA-05",
            text: "L'authentification multifacteur (MFA) est-elle activée pour les comptes à privilèges ou sensibles ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO/IEC 27002: 5.18 & 8.2 NIST CSF 2.0: PR.AA-05",
            text: "Les comptes inactifs sont-ils automatiquement désactivés après une période définie ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO/IEC 27002: 5.17 & 8.5 NIST CSF 2.0: PR.AA-05",
            text: "Les comptes sont-ils verrouillés après un nombre défini d'échecs d'authentification ?",
        },
        {
            num: 8, level: 3, docRequired: false,
            references: "réf. ISO 27002 5.17",
            text: "Les comptes de service disposent-ils de mots de passe complexes et uniques, et leur usage est-il restreint aux systèmes et tâches autorisés ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "ISO/IEC 27002: 5.17 & 8.5 NIST CSF 2.0: PR.AA-05",
            text: "Les connexions automatiques et liées des comptes à privilèges sont-elles limitées à des postes ou à des environnements spécifiques ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "MITRE ATT&CK",
            text: "L'authentification multifacteur est-elle déployée pour l'ensemble des utilisateurs lorsque cela est applicable ?",
        },
        {
            num: 11, level: 4, docRequired: true,
            references: "ISO/IEC 27002: 5.15 & 8.2",
            text: "Des audits périodiques permettent-ils de vérifier l'efficacité de la gestion des comptes, la légitimité des droits attribués et la présence éventuelle de comptes inactifs ou orphelins ?",
        },
    ],
};

const M1019 = {
    id: "M1019",
    name: "Threat Intelligence Program",
    description: "Un programme de renseignement sur les menaces permet aux organisations d'identifier, d'analyser et d'agir de manière proactive sur les cybermenaces en exploitant des sources de données internes et externes. Le programme soutient les processus de prise de décision, priorise les défenses et améliore la réponse aux incidents en fournissant des renseignements exploitables adaptés au profil de risque et à l'environnement opérationnel de l'organisation.",
    bareme: [
        "Aucun programme de renseignement sur les menaces n'est en place.",
        "Des sources de threat intel sont suivies ponctuellement, sans formalisme.",
        "Des informations de menace sont collectées régulièrement, avec début de traitement.",
        "Un programme CTI structuré existe, avec analyse, intégration dans la détection et priorisation défensive.",
        "Le programme est complet, documenté, automatisé, partagé en interne et externe, et alimente les décisions de sécurité de manière continue.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 5.1 et 5.7, NIST ID.RA-2",
            text: "Votre organisation dispose-t-elle d'un programme de renseignement sur les menaces ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 5.6, 5.7, NIST ID.BE-5",
            text: "Le programme s'appuie-t-il sur des sources externes de threat intelligence (CERT, fournisseurs, open-source, etc.) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 5.6, 5.7, NIST ID.RA-3",
            text: "Des informations sont-elles collectées régulièrement (veille automatisée, alertes, bulletins) ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 5.6, 5.24 NIST ID.RA-3",
            text: "Les données de CTI sont-elles analysées et contextualisées pour l'organisation, en tenant compte des menaces sectorielles, des TTP adverses et des vulnérabilités critiques ou zero-day ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 5.7, 8.16, NIST ID.RA-2",
            text: "Les menaces issues du programme CTI sont-elles intégrées dans les outils ou processus de détection (SIEM, EDR, SOC) ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 5.6, 5.25, NIST RS.MI-3",
            text: "Les résultats sont-ils partagés dans des structures externes (CERT, secteur, autorité nationale, partenaires) ?",
        },
    ],
};

const M1020 = {
    id: "M1020",
    name: "SSL/TLS Inspection",
    description: "L'inspection SSL/TLS consiste à déchiffrer le trafic réseau crypté pour en examiner le contenu à la recherche de signes d'activité malveillante. Cette capacité est cruciale pour détecter les menaces qui utilisent le chiffrement pour échapper à la détection, telles que le phishing, les logiciels malveillants ou l'exfiltration de données. Après inspection, le trafic est re-chiffré et transmis à sa destination.",
    bareme: [
        "Aucun mécanisme permettant l'inspection du trafic SSL/TLS n'est mis en place. Les flux chiffrés traversent l'infrastructure sans analyse de leur contenu",
        "L'organisation dispose d'équipements de sécurité capables d'inspecter le trafic SSL/TLS, mais cette capacité n'est pas activée ou n'est utilisée que de manière ponctuelle",
        "L'inspection SSL/TLS est activée sur un ou plusieurs flux identifiés comme pertinents (flux entrants, sortants ou internes selon l'architecture). Le périmètre d'inspection est défini et documenté",
        "L'inspection SSL/TLS est déployée de manière maîtrisée sur les flux pertinents. Le déploiement des certificats de confiance, les règles d'exclusion et les exceptions sont documentés, maîtrisés et revus régulièrement",
        "Les flux inspectés font l'objet d'une analyse de sécurité (IDS/IPS, sandbox, outils de détection, SOC/SIEM). Les événements sont centralisés, corrélés et analysés afin d'améliorer en continu les capacités de détection et les règles d'inspection",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.20",
            text: "L'organisation dispose-t-elle d'un équipement de sécurité réseau capable d'inspecter le trafic SSL/TLS (proxy, pare-feu nouvelle génération, passerelle de sécurité, WAF, etc.) ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "NIST DE.CM-1",
            text: "Les flux réseau sortants (ex : navigation web) sont-ils centralisés via cet équipement de sécurité ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 8.20",
            text: "L'inspection SSL/TLS est-elle activée sur les flux réseau sortants, lorsque cela est pertinent pour l'organisation ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 8.20",
            text: "L'inspection SSL/TLS est-elle activée sur les flux réseau entrants (services exposés, reverse proxy, WAF, etc.), lorsque cela est pertinent pour l'organisation ?",
        },
        {
            num: 5, level: 2, docRequired: true,
            references: "ISO 27001 7.5",
            text: "Le périmètre des flux faisant l'objet d'une inspection SSL/TLS est-il défini et documenté ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 8.26",
            text: "Les certificats nécessaires à l'inspection SSL/TLS sont-ils déployés et gérés de manière centralisée ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 5.36",
            text: "Les règles d'inspection SSL/TLS sont-elles revues régulièrement afin de garantir leur adéquation avec les usages et les contraintes applicatives ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "NIST DE.CM-1 à DE.CM-7",
            text: "Les alertes issues de l'inspection SSL/TLS sont-elles analysées dans le cadre de la supervision de sécurité (SOC, SIEM ou équivalent) ?",
        },
    ],
};

const M1021 = {
    id: "M1021",
    name: "Restrict Web-Based Content",
    description: "La restriction du contenu web implique l'application de politiques et de technologies qui limitent l'accès à des sites web potentiellement malveillants, à des téléchargements non sécurisés et à des comportements non autorisés du navigateur. Cela peut inclure le filtrage des URL, les restrictions de téléchargement, le blocage de scripts et le contrôle des extensions pour se protéger contre l'exploitation, le phishing et la livraison de logiciels malveillants.",
    bareme: [
        "Aucun mécanisme technique ne permet de contrôler ou de restreindre l'accès aux contenus web. Les utilisateurs peuvent accéder librement à Internet sans filtrage ou supervision.",
        "Un dispositif de filtrage web est présent (proxy, passerelle de sécurité ou solution équivalente) mais son utilisation reste limitée. Les règles de filtrage sont basiques et reposent principalement sur des catégories de sites.",
        "Le trafic web sortant est contrôlé par une solution de filtrage qui applique des règles de sécurité définies (catégorisation des sites, restrictions de téléchargement, inspection du trafic HTTPS).",
        "Les politiques de filtrage web sont définies, maintenues et mises à jour régulièrement. Les listes de blocage et de réputation sont enrichies dynamiquement et les contrôles couvrent différents types de services web et applications en ligne.",
        "Les accès web font l'objet d'une surveillance continue. Les événements de filtrage sont journalisés, analysés et utilisés pour détecter des comportements suspects ou améliorer les politiques de sécurité.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.20",
            text: "L'organisation dispose-t-elle d'une solution de filtrage web (proxy sécurisé, passerelle web sécurisée ou équivalent) permettant de contrôler les accès Internet des utilisateurs ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 8.2",
            text: "Les accès Web sont-ils authentifiés afin d'identifier les activités de navigation ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.7 / 8.20",
            text: "La solution de filtrage Web bloque-t-elle l'accès aux sites identifiés comme malveillants ou appartenant à des catégories jugées à risque ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.20",
            text: "Les flux web sortants (HTTP et HTTPS) sont-ils contrôlés par la solution de filtrage ?",
        },
        {
            num: 5, level: 2, docRequired: true,
            references: "ISO 27002 8.7",
            text: "Des politiques de contrôle des téléchargements (types de fichiers autorisés ou interdits) sont-elles appliquées aux contenus téléchargés depuis Internet ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Les listes de blocage et les bases de réputation utilisées par la solution de filtrage web sont-elles mises à jour automatiquement ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 8.20",
            text: "Les contrôles de filtrage web couvrent-ils également les services web interactifs (ex : webmail, services de partage de fichiers ou applications cloud) ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 8.15",
            text: "Les tentatives d'accès à des contenus bloqués sont-elles journalisées ?",
        },
        {
            num: 9, level: 4, docRequired: true,
            references: "ISO 27002 8.16",
            text: "Les journaux ou alertes liés aux accès web bloqués sont-ils analysés afin d'identifier des comportements suspects ou des menaces potentielles ?",
        },
        {
            num: 10, level: 4, docRequired: true,
            references: "ISO 27002 5.36",
            text: "Les politiques de filtrage Web sont-elles revues périodiquement afin de s'adapter aux nouveaux usages et aux évolutions des menaces ?",
        },
    ],
};

const M1022 = {
    id: "M1022",
    name: "Restrict File and Directory Permissions",
    description: "La restriction des permissions de fichiers et de répertoires implique de définir des contrôles d'accès au niveau du système de fichiers pour limiter les utilisateurs, groupes ou processus pouvant lire, écrire ou exécuter des fichiers. En configurant les permissions de manière appropriée, les organisations peuvent réduire la surface d'attaque pour les adversaires cherchant à accéder à des données sensibles, implanter du code malveillant ou altérer des fichiers système.",
    bareme: [
        "Aucun contrôle n'est mis en place pour restreindre les permissions des fichiers et répertoires. Les utilisateurs, groupes ou processus disposent de droits non maîtrisés sur les ressources",
        "Des mesures ponctuelles permettent de restreindre les permissions des fichiers et répertoires selon le principe du moindre privilège, sans politique formalisée ni homogénéité de mise en œuvre",
        "Les permissions des fichiers et répertoires sont gérées à l'aide de mécanismes de contrôle d'accès (ACL, NTFS, POSIX ou équivalent). Les ressources sensibles bénéficient de restrictions adaptées",
        "Une politique formalisée définit la gestion des permissions des fichiers et répertoires. Les modifications sont journalisées et les droits font l'objet de revues périodiques ou de contrôles réguliers afin d'identifier les permissions excessives ou inadaptées",
        "Des mécanismes automatisés permettent de détecter les permissions excessives, les écarts de configuration ou les modifications non autorisées des droits d'accès. Les alertes sont analysées et intégrées au processus de supervision et d'amélioration continue",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 5.15 / 8.2",
            text: "Le principe du moindre privilège est-il appliqué lors de l'attribution des droits d'accès aux fichiers et répertoires ?",
        },
        {
            num: 2, level: 1, docRequired: true,
            references: "ISO 27002 5.18",
            text: "Les accès aux fichiers et répertoires sont-ils attribués principalement via des groupes plutôt que directement aux utilisateurs ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 8.2",
            text: "Les permissions inutiles (notamment les droits d'écriture ou d'exécution) sont-elles supprimées sur les ressources sensibles ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.3",
            text: "Les systèmes de fichiers et les partages réseau utilisent-ils des mécanismes de contrôle d'accès (ACL, NTFS, POSIX ou équivalent) pour restreindre les accès ?",
        },
        {
            num: 5, level: 2, docRequired: false,
            references: "Mitre Att&ck",
            text: "Les répertoires système ou applicatifs critiques sont-ils protégés contre les modifications par des utilisateurs non autorisés ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27002 8.15",
            text: "Une politique ou des règles formalisées définissent-elles la gestion des permissions des fichiers et répertoires ?",
        },
        {
            num: 7, level: 3, docRequired: true,
            references: "ISO 27002 8.15",
            text: "Les modifications de permissions ou les accès à des fichiers sensibles sont-ils journalisés sur les systèmes concernés ?",
        },
        {
            num: 8, level: 3, docRequired: true,
            references: "ISO 27002 5.18",
            text: "Les droits d'accès aux fichiers et répertoires sensibles font-ils l'objet de revues périodiques ou de contrôles automatisés permettant d'identifier les permissions excessives, obsolètes ou non conformes ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "Mitre Att&ck",
            text: "Des mécanismes automatisés permettent-ils d'identifier les permissions excessives, les partages trop permissifs ou les dérives des droits d'accès sur les systèmes de fichiers ?",
        },
        {
            num: 10, level: 4, docRequired: true,
            references: "Mitre Att&ck",
            text: "Des mécanismes de contrôle d'intégrité des fichiers (FIM) sont-ils utilisés pour détecter les modifications non autorisées de fichiers critiques ?",
        },
        {
            num: 11, level: 4, docRequired: true,
            references: "ISO 27002 8.16",
            text: "Des alertes sont-elles générées et analysées en cas de modification suspecte des permissions ou des fichiers sensibles ?",
        },
    ],
};

const M1024 = {
    id: "M1024",
    name: "Restrict Registry Permissions",
    description: "La restriction des permissions du registre implique de configurer des paramètres de contrôle d'accès pour les clés et hives sensibles du registre afin de garantir que seuls les utilisateurs ou processus autorisés puissent effectuer des modifications. En limitant l'accès, les organisations peuvent prévenir les changements non autorisés que les adversaires pourraient utiliser pour la persistance, l'élévation de privilèges ou l'évasion des défenses.",
    bareme: [
        "Aucune règle de gestion ou de protection de la base de registre n'est définie.",
        "Les droits d'accès à la base de registre sont restreints selon les privilèges des utilisateurs.",
        "Une politique encadre la gestion des accès et des modifications de la base de registre.",
        "Les modifications de la base de registre sont réalisées dans le cadre d'un processus formalisé de gestion des changements.",
        "La politique est revue régulièrement, les accès et modifications sont tracés, supervisés et contrôlés à l'aide d'outils permettant la détection des modifications non autorisées.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO/IEC 27001: 5.15 & 8.2",
            text: "Les utilisateurs standards (sans privilèges) ne peuvent pas modifier les clés de registre système (ou les éléments de configuration système équivalents sous Linux/macOS).",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO/IEC 27001: 5.1",
            text: "Les règles concernant la modification des clés de registre (ou des éléments de configuration système équivalents) sont formalisées dans une politique.",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO/IEC 27001: 5.1",
            text: "La politique concernant la gestion des modifications des clés de registre est revue régulièrement.",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO/IEC 27001: 5.1",
            text: "Existe-t-il un processus permettant de gérer les exceptions à cette politique ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO/IEC 27001: 5.2 & 8.9",
            text: "Les modifications critiques des clés de registre sont-elles soumises à un processus formalisé d'approbation avant leur mise en œuvre ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO/IEC 27001: 8.16",
            text: "Les permissions des clés de registre (ou des éléments de configuration système équivalents) sont-elles vérifiées régulièrement ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO/IEC 27001: 8.16",
            text: "Les modifications non autorisées des clés de registre système (ou des éléments de configuration système équivalents) sont-elles détectées automatiquement ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO/IEC 27001: 8.15",
            text: "Existe-t-il une traçabilité complète des modifications des clés de registre système (identité, date, élément concerné et modification réalisée) ?",
        },
    ],
};

const M1025 = {
    id: "M1025",
    name: "Privileged Process Integrity",
    description: "L'intégrité des processus privilégiés se concentre sur la défense des processus hautement privilégiés (par exemple, les services système, les antivirus ou les processus d'authentification) contre la falsification, l'injection ou la compromission par des adversaires. Ces processus interagissent souvent avec des composants critiques, ce qui en fait des cibles privilégiées pour des techniques telles que l'injection de code, l'élévation de privilèges et la manipulation de processus.",
    bareme: [
        "Aucun mécanisme particulier n'est mis en œuvre pour protéger l'intégrité des processus privilégiés. Les processus critiques peuvent être modifiés ou manipulés sans contrôle spécifique.",
        "Certaines mesures de sécurité système sont activées pour protéger les processus privilégiés (mécanismes de protection mémoire ou restrictions basiques), mais leur déploiement n'est pas homogène dans l'organisation.",
        "Les processus et services critiques sont identifiés et protégés par des mécanismes techniques tels que la signature des binaires ou des politiques d'exécution d'applications.",
        "Des mécanismes de protection empêchent les interactions non autorisées avec les processus privilégiés. Les tentatives de manipulation font l'objet d'une détection et d'alertes de sécurité.",
        "Des mécanismes avancés de protection et de détection permettent d'identifier les tentatives de manipulation ou d'injection dans les processus privilégiés. Les événements de sécurité sont centralisés, corrélés et analysés afin de détecter les comportements anormaux et d'améliorer en continu les mécanismes de protection des processus privilégiés.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "Mitre Attack",
            text: "Les systèmes utilisent-ils des mécanismes de protection mémoire (ex : DEP, ASLR, CFG) pour limiter l'exploitation des processus privilégiés ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Tous les processus ou services critiques sont-ils identifiés et protégés contre les modifications non autorisées ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "Mitre Attack",
            text: "Les exécutables utilisés par les processus privilégiés sont-ils signés ou vérifiés afin de garantir leur intégrité ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "Mitre Attack",
            text: "Des mécanismes de protection du noyau ou de contrôle d'accès système (PatchGuard, SELinux, AppArmor...) sont-ils utilisés ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "Mitre Attack",
            text: "Une solution de protection des endpoints (EDR, EPP ou équivalent) est-elle configurée pour détecter ou empêcher les tentatives de manipulation des processus privilégiés ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "Mitre Attack",
            text: "Les tentatives de modification ou d'injection de code dans les processus privilégiés génèrent-elles automatiquement une alerte de sécurité ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.16",
            text: "Les événements liés aux tentatives de manipulation des processus privilégiés sont-ils centralisés, corrélés,analysés et investigués dans le cadre de la supervision de sécurité (SOC/SIEM) ?",
        },
    ],
};

const M1026 = {
    id: "M1026",
    name: "Privileged Account Management",
    description: "La gestion des comptes privilégiés se concentre sur la mise en œuvre de politiques, contrôles et outils pour gérer de manière sécurisée les comptes privilégiés (par exemple, les comptes SYSTEM, root ou administratifs). Cela inclut la restriction de l'accès, la limitation de l'étendue des permissions, la surveillance de l'utilisation des comptes privilégiés et la garantie de la responsabilité grâce à la journalisation et à l'audit.",
    bareme: [
        "Aucune gestion des comptes à privilèges",
        "Utilisation de comptes spécifiques pour les administrateurs",
        "Gestion des comptes à privilèges formalisée et comptes sécurisés par MFA.",
        "Mise en place de différents niveaux d'administration et traçabilité des actions réalisées.",
        "Utilisation de postes dédiés aux tâches d'administration et détection automatique des comportements anormaux.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 : 5.15, 8.2 NIST : PR.AC-4, PR.AC-6",
            text: "Les utilisateurs non administrateurs ont un compte standard (sans privilèges).",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les mots de passe des comptes à privilèges sont-ils longs (≥16 caractères), uniques, gérés via un coffre-fort (PAM/vault) et changés uniquement en cas de compromission ou de départ ?",
        },
        {
            num: 3, level: 1, docRequired: true,
            references: "ISO 27002 : 5.17, 8.3 NIST : PR.AC-1, PR.AC-7",
            text: "Des exigences de robustesse des mots de passe sont-elles définies et formalisées pour les comptes à privilèges ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 : 5.1, 5.15 NIST : ID.GV-1, PR.AC-1",
            text: "Les règles de gestion des comptes à privilèges sont-elles définies dans une politique formalisée ?",
        },
        {
            num: 5, level: 2, docRequired: true,
            references: "ISO 27002 : 5.1, 5.36 NIST : ID.GV-3",
            text: "La politique de gestion des comptes à privilèges est-elle revue périodiquement ?",
        },
        {
            num: 6, level: 2, docRequired: false,
            references: "ISO 27002 : 5.15, 8.2 NIST : PR.AC-6",
            text: "Les administrateurs disposent-ils également d'un compte standard et utilisent-ils leur compte à privilèges uniquement pour les tâches d'administration ?",
        },
        {
            num: 7, level: 2, docRequired: false,
            references: "ISO 27002 : 8.5 NIST : PR.AC-7",
            text: "L'authentification multifacteur (MFA) est-elle obligatoire pour la connexion aux comptes à privilèges ?",
        },
        {
            num: 8, level: 2, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.AE-3, PR.PT-1",
            text: "Existe-t-il une traçabilité complète des comptes à privilèges (création, modification, suppression, utilisation) ?",
        },
        {
            num: 9, level: 2, docRequired: true,
            references: "ISO 27002 : 5.18, 5.15 NIST : PR.AC-4",
            text: "Une revue périodique des comptes à privilèges (inventaire, suppression des comptes obsolètes, mise à jour des droits) est-elle réalisée ?",
        },
        {
            num: 10, level: 3, docRequired: false,
            references: "ISO 27002 : 5.15, 8.2 NIST : PR.AC-5, PR.AC-6",
            text: "Un modèle de séparation des niveaux d'administration (Tiering, PAW ou équivalent) est-il mis en œuvre ?",
        },
        {
            num: 11, level: 3, docRequired: false,
            references: "ISO 27002 : 8.18, 8.5 NIST : PR.AC-6, PR.PT-3",
            text: "Une solution de PAM (Bastion ou équivalent) est-elle utilisée pour administrer les ressources sensibles ?",
        },
        {
            num: 12, level: 3, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.AE-3, PR.PT-1",
            text: "Les actions réalisées via les comptes à privilèges sont-elles journalisées et auditées ?",
        },
        {
            num: 13, level: 4, docRequired: false,
            references: "ISO 27002 : 8.1, 8.2 NIST : PR.AC-6, PR.PT-3",
            text: "L'utilisation des comptes à privilèges est-elle limitée à des postes d'administration dédiés ?",
        },
        {
            num: 14, level: 4, docRequired: false,
            references: "ISO 27002 : 8.16 NIST : DE.AE-2, DE.CM-1",
            text: "Des mécanismes permettent-ils de détecter automatiquement les comportements anormaux des comptes à privilèges ?",
        },
    ],
};

const M1027 = {
    id: "M1027",
    name: "Password Policies",
    description: "Définissez et appliquez des politiques de mots de passe sécurisés pour les comptes afin de réduire la probabilité d'accès non autorisé. Les politiques de mots de passe robustes incluent l'application de la complexité des mots de passe, l'exigence de changements réguliers de mots de passe et la prévention de la réutilisation des mots de passe.",
    bareme: [
        "Aucune politique de gestion des mots de passe n'est définie ou appliquée. Les utilisateurs définissent librement leurs mots de passe sans exigences de sécurité",
        "Des règles de base relatives à la gestion des mots de passe sont définies mais elles sont limitées ou appliquées de manière hétérogène. Les exigences de sécurité restent partielles ou peu contrôlées",
        "Une politique de gestion des mots de passe est définie et appliquée de manière centralisée. Elle impose des exigences adaptées de longueur et de robustesse des mots de passe et empêche, lorsque cela est possible, l'utilisation de mots de passe faibles, triviaux ou compromis",
        "La politique est renforcée par des mécanismes complémentaires tels que l'authentification multi-facteurs pour les comptes sensibles, l'utilisation de solutions de gestion sécurisée des mots de passe et des contrôles réguliers du respect des politiques",
        "Les politiques de gestion des mots de passe sont régulièrement revues afin de suivre l'évolution des menaces et des recommandations de sécurité. Des mécanismes permettent de détecter ou d'empêcher l'utilisation de mots de passe compromis ou connus comme faibles, contribuant à l'amélioration continue de la protection des comptes",
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
            references: "Mitre Att&ck",
            text: "Les systèmes d'authentification empêchent-ils l'utilisation de mots de passe compromis, triviaux ou figurant dans des listes de mots de passe interdits ?",
        },
    ],
};

const M1028 = {
    id: "M1028",
    name: "Operating System Configuration",
    description: "La configuration du système d'exploitation consiste à ajuster les paramètres système et à renforcer les configurations par défaut d'un système d'exploitation (OS) pour atténuer l'exploitation par des adversaires et prévenir l'abus des fonctionnalités du système. Des configurations appropriées du système d'exploitation traitent les vulnérabilités de sécurité, limitent les surfaces d'attaque et assurent une défense robuste contre un large éventail de techniques.",
    bareme: [
        "Aucune règle ou configuration de sécurité spécifique n'est définie pour les systèmes d'exploitation. Les paramètres par défaut sont utilisés sans contrôle particulier et les utilisateurs peuvent modifier certaines configurations système sans restriction.",
        "Certaines mesures techniques de restriction ou de durcissement des systèmes d'exploitation sont appliquées, mais elles sont limitées, non formalisées et mises en œuvre de manière hétérogène selon les équipements ou les équipes.",
        "Des règles de configuration des systèmes d'exploitation sont définies et documentées. Une configuration de référence existe et est appliquée sur une partie significative des systèmes, mais les contrôles restent majoritairement manuels.",
        "Les configurations des systèmes d'exploitation sont formalisées, validées et appliquées de manière homogène. Un processus de gestion et de revue des configurations est en place afin d'assurer la conformité des systèmes avec les règles définies.",
        "Les configurations des systèmes sont surveillées et contrôlées de manière automatisée. Les écarts de configuration sont détectés, journalisés et analysés, et les règles de configuration sont régulièrement améliorées afin de s'adapter à l'évolution du système d'information et des menaces.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27001 8.2 et 8.3",
            text: "Les utilisateurs standards (sans privilèges) ne sont pas en mesure de modifier la configuration du système sur leur poste.",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27001 5.1 et 8.9",
            text: "La liste des configurations système par défaut est définie.",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27001 5.1 et 8.9",
            text: "Les règles concernant les configurations système sont formalisées dans une politique.",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27001 5.1 et 5.36",
            text: "La politique concernant les configurations système est revue régulièrement.",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27001 8.9 et 8.32",
            text: "Le processus de validation des configurations système par défaut est formalisé.",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27001 5.36, 8.9",
            text: "La liste des configurations système par défaut est revue régulièrement.",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27001 8.9, 8.16",
            text: "Les configurations système différentes des valeurs par défaut sont détectées automatiquement.",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27001 8.15, 8.16 et 8.32",
            text: "Il existe une traçabilité complète des modifications des configurations système sur les équipements (qui, quand, configuration concernée, modification apportée).",
        },
    ],
};

const M1029 = {
    id: "M1029",
    name: "Remote Data Storage",
    description: "Le stockage de données à distance se concentre sur le transfert de données critiques, telles que les journaux de sécurité et les fichiers sensibles, vers des emplacements sécurisés hors hôte afin de minimiser l'accès non autorisé, la falsification ou la destruction par des adversaires. En utilisant des solutions de stockage à distance, les organisations améliorent la protection des preuves judiciaires, des informations sensibles et des données de surveillance.",
    bareme: [
        "Aucun mécanisme de stockage ou de sauvegarde à distance n'est mis en place. Les données et journaux restent uniquement stockés sur les systèmes qui les produisent.",
        "Certaines données sensibles ou critiques font l'objet de sauvegardes vers un système distinct, mais ces pratiques ne sont pas systématiques ni formalisées.",
        "Les données sensibles et les journaux de sécurité sont sauvegardés ou centralisés sur des systèmes distincts. Des mécanismes de protection tels que le chiffrement ou la sauvegarde régulière sont appliqués.",
        "Les mécanismes de stockage à distance sont formalisés et couvrent les journaux de sécurité et les données critiques. Des mesures de protection renforcées (rétention, sauvegardes immuables, tests de restauration) sont mises en place.",
        "Les processus de stockage distant et de sauvegarde sont supervisés et contrôlés. Des mécanismes automatisés permettent de détecter les anomalies, vérifier l'intégrité des données et assurer la disponibilité des sauvegardes.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 8.13",
            text: "Des sauvegardes des données sensibles sont-elles réalisées vers un système distinct de l'environnement de production ?",
        },
        {
            num: 2, level: 1, docRequired: true,
            references: "ISO 27002 8.24",
            text: "Les sauvegardes de données sensibles sont-elles chiffrées avec une gestion des clés séparée ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.15",
            text: "Les journaux de sécurité des systèmes (endpoints, serveurs) sont-ils centralisés et stockés sur un système indépendant ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 8.13",
            text: "Des tests de restauration des sauvegardes sont-ils réalisés régulièrement sur des jeux de données représentatifs ?",
        },
        {
            num: 5, level: 2, docRequired: false,
            references: "ISO 27002 8.15",
            text: "Les journaux des équipements de sécurité (IDS/IPS, pare-feu, etc.) sont-ils également centralisés ou sauvegardés sur un système indépendant ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 8.13",
            text: "Des mécanismes de sauvegarde immuable ou de protection contre la suppression ou modification des sauvegardes sont-ils mis en place ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.13",
            text: "Des mécanismes automatisés permettent-ils de superviser les sauvegardes (alertes en cas d'échec, vérification d'intégrité, tableaux de bord de suivi) ?",
        },
    ],
};

const M1030 = {
    id: "M1030",
    name: "Network Segmentation",
    description: "La segmentation de réseau consiste à diviser un réseau en segments plus petits et isolés afin de contrôler et de limiter le flux de trafic entre les appareils, systèmes et applications. En segmentant les réseaux, les organisations peuvent réduire la surface d'attaque, restreindre les mouvements latéraux des adversaires et protéger les actifs critiques contre les compromissions.",
    bareme: [
        "Aucune segmentation mise en œuvre.",
        "Segmentation partielle, non documentée, sans contrôle strict.",
        "Les environnements présentant des niveaux de sensibilité différents sont segmentés en zones réseau distinctes. Les flux entre ces zones sont contrôlés par des mécanismes adaptés (pare-feu, ACL ou équivalent), mais la supervision reste limitée.",
        "Supervision réseau opérationnelle et audits réguliers de l'efficacité.",
        "Segmentation dynamique, pilotée par les menaces, avec outils d'adaptation en temps réel.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.22, NIST PR.AC-5",
            text: "Votre organisation a-t-elle mis en place une segmentation réseau pour protéger les systèmes critiques ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 5.1, 8.20, NIST PR.AC-4",
            text: "Les règles de segmentation sont-elles formalisées dans une politique de sécurité ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.22, NIST PR.AC-5",
            text: "Les différents environnements du système d'information (utilisateurs, serveurs, systèmes critiques, services exposés, etc.) sont-ils segmentés en zones réseau distinctes selon leur niveau de sensibilité ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.20, 8.21, NIST PR.PT-4",
            text: "Les flux entre les différentes zones réseau sont-ils strictement contrôlés par des mécanismes de filtrage (pare-feu, ACL ou équivalent) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.16, 8.20 NIST PR.PT-3",
            text: "Les connexions entre segments réseau sont-elles surveillées pour détecter des anomalies ou des accès non autorisés ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 8.16, 8.21, NIST DE.AE-1",
            text: "Disposez-vous d'un mécanisme de surveillance en temps réel des activités réseau (SIEM, IDS, NDR) ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 5.36 NIST DE.CM-7",
            text: "Effectuez-vous des tests réguliers de l'efficacité de votre segmentation (ex. : audits, scans de conformité) ?",
        },
        {
            num: 8, level: 4, docRequired: false,
            references: "ISO 27002 8.22, 8.16, 5.7 NIST PR.AC-5",
            text: "La segmentation réseau est-elle dynamique et ajustée en fonction des menaces identifiées ?",
        },
    ],
};

const M1031 = {
    id: "M1031",
    name: "Network Intrusion Prevention",
    description: "Utilisez des signatures de détection d'intrusion pour bloquer le trafic aux frontières du réseau.",
    bareme: [
        "Aucun système de détection ou prévention réseau en place.",
        "Des mécanismes manuels ou réactifs sont utilisés sans intégration ni stratégie définie.",
        "Un IDS/IPS est en place avec des signatures activées mais une couverture partielle du périmètre.",
        "Politique formelle, couverture complète du périmètre, intégration SIEM et processus de gestion.",
        "Supervision centralisée, détection basée sur comportement et menaces, revue et amélioration continue.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.16; 8.20, 8.21; NIST DE.CM-1",
            text: "Des mécanismes de détection ou de prévention d'intrusion réseau sont-ils en place dans votre organisation ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 8.20, 8.21; NIST PR.IP-3",
            text: "Ces dispositifs permettent-ils de bloquer automatiquement certains flux identifiés comme malveillants ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.1; 8.20; NIST PR.IP-1",
            text: "Disposez-vous d'une politique formelle encadrant la détection et la prévention des intrusions réseau (zones surveillées, outils, règles) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 5.7, 8.8; NIST PR.AC-7",
            text: "Les règles de détection utilisées sont-elles régulièrement mises à jour via des flux internes ou fournisseurs ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 8.20, 8.21; NIST PR.IP-11",
            text: "Ces mécanismes couvrent-ils l'ensemble des protocoles critiques (DNS, HTTP/S, FTP, SMB, SNMP, etc.) ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "NIST DE.CM-1; ISO 27002 8.16",
            text: "Des alertes automatiques sont-elles générées et transmises à l'équipe SOC ou SSI en cas de détection de comportement réseau suspect ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 5.24, 5.25; NIST PR.IP-3",
            text: "Existe-t-il un processus formalisé de traitement des alertes réseau avec triage, investigation et escalade ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 5.36; NIST PR.IP-1",
            text: "Des revues régulières sont-elles menées sur l'efficacité des règles de détection (faux positifs, couverture, alertes non traitées, etc.) ?",
        },
    ],
};

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
            references: "ISO 27002 8.2, 8.5, 5.17; NIST PR.AC-7, PR.AC-6",
            text: "Votre organisation applique-t-elle une authentification multi-facteurs (MFA) pour les comptes utilisateurs sensibles (administrateurs, comptes cloud, développeurs, etc.) ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.3, 8.5, NIST PR.AC-5",
            text: "MFA est-il activé sur tous les services exposés à Internet (VPN, RDP, SaaS, Webmail, etc.) ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.1, 5.16, 5.17; NIST PR.IP-1",
            text: "Une politique formelle d'authentification incluant le MFA est-elle définie et diffusée ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.5; NIST PR.AC-7",
            text: "Le MFA repose-t-il sur au moins deux facteurs distincts conformes (ex : OTP + mot de passe, carte à puce, biométrie...) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.2, 8.3, 8.4; NIST PR.IP-11",
            text: "Le MFA est-il contextuel ou adaptatif (en fonction du rôle, du lieu, de l'état du terminal, etc.) ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 5.36; NIST PR.IP-8",
            text: "L'organisation effectue-t-elle des revues régulières des activations/désactivations MFA ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 8.15, 8.16; NIST DE.CM-7",
            text: "Des alertes sont-elles générées en cas d'échec MFA répété ou de contournement ?",
        },
    ],
};

const M1033 = {
    id: "M1033",
    name: "Limit Software Installation",
    description: "Empêchez les utilisateurs ou groupes d'installer des logiciels non autorisés ou non approuvés afin de réduire le risque d'introduction d'applications malveillantes ou vulnérables. Cela peut être réalisé par des listes d'autorisation, des politiques de restriction logicielle, des outils de gestion des points de terminaison et des principes d'accès au moindre privilège.",
    bareme: [
        "Aucune restriction d'installation n'est appliquée.",
        "L'installation de logiciels est restreinte ponctuellement, sans processus global.",
        "Une politique définit les restrictions d'installation mais n'est pas systématiquement appliquée.",
        "Les restrictions sont mises en œuvre sur tous les systèmes critiques et surveillées régulièrement.",
        "L'installation est strictement contrôlée, centralisée, auditée, et ajustée en continu.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.2 et 8.3",
            text: "Les utilisateurs standards (sans privilèges) ne sont pas en mesure d'installer des applications sur leur poste.",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 5.1 et 8.9",
            text: "La liste des applications autorisées est-elle formellement définie et maintenue ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.1 et 8.9",
            text: "Les règles concernant l'installation des applications sont-elles formalisées dans une politique ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 5.1 et 5.36",
            text: "La politique relative à l'installation des applications est-elle revue périodiquement ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 8.9 et 8.32",
            text: "Le processus de validation et d'autorisation des nouvelles applications est-il formalisé ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 5.36 et 8.9",
            text: "La liste des applications autorisées fait-elle l'objet de revues périodiques ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 8.9 et 8.16",
            text: "Les applications non autorisées installées sont-elles détectées automatiquement ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 8.15, 8.16 et 8.32",
            text: "Existe-t-il une traçabilité des installations d'applications (utilisateur, date, application concernée) ?",
        },
    ],
};

const M1034 = {
    id: "M1034",
    name: "Limit Hardware Installation",
    description: "Empêchez les utilisateurs ou groupes non autorisés d'installer ou d'utiliser du matériel, tel que des disques externes, des périphériques ou des composants matériels internes non approuvés, en appliquant des politiques d'utilisation du matériel et des contrôles techniques. Cela inclut la désactivation des ports USB, la restriction de l'installation de pilotes et la mise en œuvre d'outils de sécurité des points de terminaison pour surveiller et bloquer les appareils non approuvés.",
    bareme: [
        "Aucune restriction sur l'installation de périphériques matériels.",
        "Des restrictions sont appliquées, mais sans cadre défini",
        "Une politique de restriction des périphériques existe et est suivie.",
        "Une solution technique empêche l'ajout de matériel non autorisé et est auditable.",
        "La gestion des restrictions matérielles est optimisée, surveillée et intégrée aux processus de gestion des menaces.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.4, NIST PR.AC-6",
            text: "Disposez-vous d'un mécanisme permettant de bloquer l'installation automatique de périphériques non approuvés ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 8.3, NIST PR.AC-3, NIST PR.AC-6",
            text: "Votre organisation a-t-elle mis en place une politique définissant les règles d'utilisation des périphériques matériels ?",
        },
        {
            num: 3, level: 3, docRequired: false,
            references: "ISO 27002 8.5, ISO 27002 8.7, NIST PR.DS-3, NIST PR.PT-2",
            text: "Utilisez-vous une solution technique (ex : MDM, gestion des postes, whitelisting de périphériques) pour contrôler ou restreindre l'utilisation des périphériques matériels ?",
        },
        {
            num: 4, level: 4, docRequired: true,
            references: "ISO 27002 8.7, NIST PR.PT-3",
            text: "Des audits ou contrôles réguliers sont-ils réalisés afin de vérifier l'efficacité des restrictions appliquées aux périphériques matériels ?",
        },
        {
            num: 5, level: 4, docRequired: false,
            references: "ISO 27002 8.16, NIST PR.DS-6",
            text: "Existe-t-il un mécanisme de détection des tentatives d'utilisation de périphériques non autorisés, avec génération d'alertes exploitables par les équipes de sécurité (ex : SOC) ?",
        },
    ],
};

const M1035 = {
    id: "M1035",
    name: "Limit Access to Resource Over Network",
    description: "Restreignez l'accès aux ressources réseau, telles que les partages de fichiers, les systèmes distants et les services, uniquement aux utilisateurs, comptes ou systèmes ayant un besoin légitime pour l'entreprise. Cela peut inclure l'utilisation de technologies telles que les concentrateurs de réseau, les passerelles RDP et les modèles d'accès réseau zéro confiance (ZTNA), en parallèle avec le renforcement des services et des protocoles.",
    bareme: [
        "Aucun contrôle ou restriction d'accès réseau aux ressources critiques.",
        "Quelques restrictions réseau sont appliquées, de façon non formalisée.",
        "Contrôles en place pour restreindre l'accès à certaines ressources, mais pas généralisés ni intégrés aux processus.",
        "Les accès à distance ou sensibles sont limités via des moyens dédiés et une politique structurée.",
        "Accès restreints, segmentés, contrôlés dynamiquement selon les risques, intégrés à une supervision et audit régulier.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 5.10; NIST PR.AC-5, PR.PT-4",
            text: "Votre organisation restreint-elle l'accès aux ressources réseau internes (accès distant, partages, protocoles) ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 5.10; NIST PR.AC-3",
            text: "Les accès distants (RDP, SSH, VPN, etc.) sont-ils obligatoirement centralisés via des concentrateurs (VPN, bastion, RDP Gateway) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.23; NIST PR.AC-5; PR.PT-3",
            text: "Les services distants inutilisés ( ex : Telnet, SMB, etc.) sont-ils désactivés ou filtrés ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 5.15; NIST PR.AC-5, DE.CM-1",
            text: "L'accès aux API ou services d'administration distants (Docker, Kubernetes API, Metadat API…) est-il restreint à des IP/Segments de confiance ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 5.36; NIST PR.AC-5",
            text: "Les règles ou mécanismes de limitation d'accès sont-ils revus régulièrement ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "NIST DE.CM-1, DE.CM-7",
            text: "Des alertes sont-elles générées lorsqu'un accès non autorisé est tenté ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "NIST DE.DP-4; ISO 27002 5.36",
            text: "Des mesures correctives sont-elles systématiquement prises suite à une détection ou un incident d'accès illégitime ?",
        },
    ],
};

const M1036 = {
    id: "M1036",
    name: "Account Use Policies",
    description: "Les politiques d'utilisation des comptes aident à atténuer les accès non autorisés en configurant et en appliquant des règles qui définissent comment et quand les comptes peuvent être utilisés. Ces politiques incluent l'application de mécanismes de verrouillage de compte, la restriction des horaires de connexion et la définition de délais d'inactivité. Une configuration appropriée de ces politiques réduit le risque d'attaques par force brute, de vol d'identifiants et d'accès non autorisé en limitant les opportunités pour les acteurs malveillants d'exploiter les comptes.",
    bareme: [
        "Aucune politique ou règle de gestion des comptes en place.",
        "Quelques paramètres de sécurité sont appliqués manuellement sans cohérence globale.",
        "Règles configurées pour certains comptes avec politique partielle et non revue.",
        "Politique complète de gestion des comptes, intégrée à un système de contrôle centralisé.",
        "Gestion dynamique avec surveillance, alertes, audits et règles contextuelles adaptives (conditional access).",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 5.16, 8.2, 8.3; NIST PR.AC-1, PR.AC-4, PR.AC-6, PR.IP-11",
            text: "Votre organisation a-t-elle mis en œuvre des mécanismes limitant ou encadrant l'utilisation des comptes (ex. : verrouillage après échec, restrictions d'accès, Conditional Access, restrictions géographiques ou horaires) ?",
        },
        {
            num: 2, level: 1, docRequired: true,
            references: "ISO 27002 8.2; NIST PR.AC-6, PR.AC-7",
            text: "Un verrouillage automatique est-il configuré après plusieurs tentatives de connexion échouées ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.3; NIST PR.AC-6",
            text: "Les accès aux comptes sont-ils restreints selon des plages horaires lorsque cela est pertinent ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.5; NIST PR.AC-7, PR.IP-11",
            text: "L'utilisation des comptes ou des identifiants est-elle restreinte à des contextes précis (équipements approuvés, localisation, niveau de risque, Conditional Access ou mécanisme équivalent) ?",
        },
        {
            num: 5, level: 2, docRequired: true,
            references: "ISO 27002 5.16, 5.17; NIST PR.AC-1, PR.AC-4",
            text: "Une politique formelle définit-elle les conditions d'utilisation des comptes (restrictions d'accès, contexte de connexion, plages horaires, etc.) ?",
        },
        {
            num: 6, level: 2, docRequired: true,
            references: "ISO 27002 5.36; NIST PR.IP-8, PR.IP-11",
            text: "Des audits ou contrôles réguliers sont-ils réalisés afin de vérifier le respect des politiques d'utilisation des comptes ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 : 8.5 NIST : PR.AC-7, PR.PT-3",
            text: "Les sessions expirent-elles automatiquement après une période d'inactivité ?",
        },
        {
            num: 8, level: 3, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.AE-3, DE.CM-1",
            text: "Les tentatives de connexion réussies et échouées sont-elles journalisées ?",
        },
        {
            num: 9, level: 3, docRequired: false,
            references: "ISO 27002 : 8.16 NIST : DE.AE-2, DE.CM-1",
            text: "Des alertes sont-elles générées lorsqu'une utilisation anormale ou non autorisée d'un compte est détectée ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "ISO 27002 : 5.18, 8.2 NIST : PR.AC-1, PR.AC-4",
            text: "Les politiques d'utilisation des comptes sont-elles adaptées dynamiquement en fonction du contexte de connexion (niveau de risque, localisation, équipement utilisé, comportement de l'utilisateur, etc.) ?",
        },
        {
            num: 11, level: 4, docRequired: false,
            references: "ISO 27002 5.18 NIST : PR.AC-1, PR.AC-4",
            text: "Les comptes inactifs sont-ils automatiquement désactivés après une période définie ?",
        },
    ],
};

const M1037 = {
    id: "M1037",
    name: "Filter Network Traffic",
    description: "Utilisez des appareils réseau et des logiciels de point de terminaison pour filtrer le trafic réseau entrant, sortant et latéral. Cela inclut le filtrage basé sur les protocoles, l'application de règles de pare-feu, et le blocage ou la restriction du trafic basé sur des conditions prédéfinies afin de limiter les mouvements des adversaires et l'exfiltration de données.",
    bareme: [
        "Aucun contrôle réseau ou filtrage actif n'est mis en place.",
        "Des filtrages sont en place de manière ponctuelle ou non centralisée, sans politique claire.",
        "Un filtrage est mis en œuvre systématiquement pour certains flux, mais reste partiel ou peu automatisé.",
        "Un système de filtrage des flux réseau est formalisé, cohérent, et appliqué sur l'ensemble des périmètres.",
        "Le filtrage est intégré aux processus métiers, contrôlé, audité régulièrement, et optimisé en fonction des menaces.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.22, 8.23, NIST PR.AC-5, PR.PT-4",
            text: "Votre organisation applique-t-elle un filtrage réseau sur les flux entrants et sortants ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.22; NIST DE.CM-1",
            text: "Disposez-vous de règles spécifiques pour filtrer certains protocoles ou ports (SMB, DNS, FTP, SSH, etc.) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.16, NIST PR.PT-4",
            text: "Le filtrage réseau est-il appliqué aussi bien au niveau des équipements réseau que des postes de travail ou serveurs lorsque cela est pertinent ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 5.14; NIST DE.CM-7",
            text: "Les communications vers des services externes (DNS, services Cloud, interconnexions, etc.) sont-elles contrôlées par des mécanismes de filtrage adaptés ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 5.14, ISO 27002 5.36; NIST PR.AC-5, DE.CM-1",
            text: "Les règles de filtrage réseau font-elles l'objet de revues périodiques ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 8.16; NIST DE.CM-1, DE.CM-7",
            text: "Les événements issus des équipements de filtrage réseau sont-ils analysés dans le cadre de la supervision de sécurité (SOC, SIEM ou équivalent) ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 5.36; NIST DE.DP-4",
            text: "Des actions d'amélioration continue sont-elles engagées suite à l'analyse de ces journaux ou d'incidents réseau ?",
        },
    ],
};

const M1038 = {
    id: "M1038",
    name: "Execution Prevention",
    description: "Empêchez l'exécution de code non autorisé ou malveillant sur les systèmes en mettant en œuvre des contrôles d'application, le blocage de scripts et d'autres mécanismes de prévention d'exécution. Cela garantit que seul le code de confiance autorisé est exécuté, réduisant ainsi le risque de logiciels malveillants et d'actions non autorisées.",
    bareme: [
        "Aucun mécanisme ne permet de limiter ou de contrôler l'exécution de code sur les systèmes. Les utilisateurs peuvent installer ou exécuter librement des applications, scripts ou composants non autorisés",
        "Des restrictions techniques existent afin de limiter l'exécution de logiciels ou de scripts, mais elles sont appliquées de manière ponctuelle, hétérogène ou uniquement sur une partie des systèmes",
        "Des mécanismes de prévention permettent de contrôler l'exécution des applications, scripts ou composants sur les systèmes sensibles. Les utilisateurs ne peuvent pas installer ou exécuter librement des logiciels non autorisés et les principaux vecteurs d'exécution sont restreints",
        "Une politique de contrôle de l'exécution est définie, documentée et déployée de manière centralisée. Des mécanismes tels que le contrôle d'applications (AppLocker, WDAC, SRP ou équivalent), les listes blanches d'applications ou des règles de restriction sont appliqués de manière cohérente sur les systèmes concernés",
        "Les mécanismes de prévention sont complétés par des solutions de protection des terminaux capables de détecter et de bloquer les comportements malveillants (analyse comportementale, EDR, XDR ou technologies équivalentes). Les événements sont journalisés, corrélés et exploités dans le cadre de la supervision de sécurité afin d'améliorer continuellement les capacités de prévention",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 5.15 / 8.2",
            text: "Les utilisateurs standards (sans privilèges) ne sont pas en mesure d'installer des applications sur leur poste.",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 5.13 / 5.20",
            text: "L'exécution automatique de code depuis des supports amovibles (ex : clés USB) est-elle désactivée ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.10",
            text: "Des mécanismes sont-ils mis en œuvre afin d'empêcher ou de restreindre l'exécution de scripts non autorisés (PowerShell, macros Office, VBScript, JavaScript, etc.) ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 5.17",
            text: "Une politique de contrôle de l'exécution des applications (AppLocker, Windows Defender Application Control, Software Restriction Policies ou mécanisme équivalent) est-elle déployée sur les postes ou serveurs concernés ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 8.12",
            text: "Une liste blanche d'applications autorisées ou un mécanisme équivalent est-il défini et appliqué afin de limiter l'exécution aux logiciels approuvés ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 5.13 / 5.18",
            text: "Une solution de protection des terminaux (antivirus ou NGAV) est-elle déployée afin de détecter et de bloquer les logiciels malveillants connus lors de leur exécution ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.16",
            text: "Une solution de sécurité des terminaux intégrant des capacités de détection comportementale est-elle déployée afin de détecter et de bloquer les comportements malveillants ou les techniques d'exécution avancées ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 8.16",
            text: "Les alertes générées par les mécanismes de contrôle de l'exécution et les solutions de protection des terminaux sont-elles journalisées, centralisées et analysées dans le cadre de la supervision de sécurité (SOC, SIEM ou équivalent) ?",
        },
    ],
};

const M1039 = {
    id: "M1039",
    name: "Environment Variable Permissions",
    description: "Restreignez la modification des variables d'environnement aux utilisateurs et processus autorisés en appliquant des permissions et politiques strictes. Cela garantit l'intégrité des variables d'environnement, empêchant les adversaires de les abuser ou de les altérer à des fins malveillantes.",
    bareme: [
        "Aucune restriction d'accès ou de modification des variables d'environnement.",
        "Les permissions d'accès aux fichiers de configuration système sont limitées. Aucune surveillance ou journalisation des changements.",
        "Des politiques de gestion des permissions et du moindre privilège sont définies et documentées. L'accès aux variables d'environnement dans les environnements de déploiement est limité à des rôles spécifiques.",
        "Des controles techniques automatisés garantissent que seules les entités autorisées peuvent modifier les variables. Les changements sont journalisés et revus régulièrement. Des contrôles de permissions sont intégrés dans les pipelines.",
        "L'accès et la portée des variables sont strictement limités par environnement et par processus.Des mécanismes d'audit en temps réel et d'alerte automatique sont déployés pour toute modificationnon autorisée. Des tests de conformité et revues de permissions sont effectués périodiquement",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 - 8.2 et 8.3 NIST : PR.AA-05, PR.PS-01",
            text: "Les fichiers contenant les variables d'environnement système sont-ils protégés contre l'écriture par des utilisateurs non autorisés ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 - 5.1, 5.16 et 8.2 NIST : GV.PO-01, GV.RR-02, PR.AA-05",
            text: "Une politique ou des règles formalisées limitent-elles la modification des variables d'environnement aux rôles ou groupes autorisés ?",
        },
        {
            num: 3, level: 3, docRequired: true,
            references: "ISO 27002 - 8.15, 8.16 et 5.36 NIST : PR.PS-04, DE.CM-03, GV.OV-03",
            text: "Les modifications des variables d'environnement critiques sont-elles journalisées et auditées régulièrement ?",
        },
        {
            num: 4, level: 4, docRequired: false,
            references: "ISO 27002 - 8.9, 8.16 et 8.32 NIST : PR.IR-01, PR.PS-01, DE.CM-09, DE.AE-02",
            text: "L'accès aux variables d'environnement est-il isolé par conteneur ou par processus avec détection automatique des changements non autorisés ?",
        },
    ],
};

const M1040 = {
    id: "M1040",
    name: "Behavior Prevention on Endpoint",
    description: "La prévention des comportements sur les points de terminaison fait référence à l'utilisation de technologies et de stratégies pour détecter et bloquer les activités potentiellement malveillantes en analysant le comportement des processus, des fichiers, des appels d'API et d'autres événements sur les points de terminaison. Plutôt que de se fier uniquement aux signatures connues, cette approche utilise des heuristiques, l'apprentissage automatique et la surveillance en temps réel pour identifier les modèles anormaux indicatifs d'une attaque.",
    bareme: [
        "Aucune solution de protection contre les comportements suspects sur les endpoints n'est mise en place.",
        "Une solution de protection est utilisée, mais sans configuration avancée ni règles spécifiques définies",
        "Une politique de prévention des comportements suspects est définie et documentée, avec des règles appliquées sur les endpoints. Une collecte des logs est en place, mais sans analyse avancée.",
        "Les outils de protection sont configurés avec des règles spécifiques pour détecter et bloquer des comportements malveillants. Les journaux sont collectés et analysés via un SIEM.",
        "L'efficacité des règles de prévention est testée régulièrement. Une amélioration continue est mise en place avec des ajustements basés sur les menaces émergentes.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.16, NIST PR.IP-9",
            text: "Votre organisation utilise-t-elle des outils de protection contre les comportements suspects sur les endpoints (EDR, HIPS, ASR) ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 8.15, NIST PR.AC-4",
            text: "Votre organisation a-t-elle mis en place une politique définissant les comportements suspects à bloquer sur les endpoints ?",
        },
        {
            num: 3, level: 3, docRequired: false,
            references: "ISO 27002 8.16, NIST PR.IP-9",
            text: "Vos outils de protection sont-ils configurés pour appliquer des règles spécifiques pour détecter et bloquer les comportements suspects ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.28, NIST DE.CM-7",
            text: "Les journaux des outils de prévention des endpoints sont-ils collectés, analysés et corrélés avec un SIEM ?",
        },
        {
            num: 5, level: 4, docRequired: true,
            references: "ISO 27002 8.30, NIST RS.AN-4",
            text: "Effectuez-vous des tests d'efficacité de vos règles de prévention des comportements malveillants ? (ex. Red Team, Pentest, simulation d'attaques)",
        },
    ],
};

const M1041 = {
    id: "M1041",
    name: "Encrypt Sensitive Information",
    description: "Protégez les informations sensibles au repos, en transit et pendant le traitement en utilisant des algorithmes de chiffrement robustes. Le chiffrement garantit la confidentialité et l'intégrité des données, empêchant ainsi l'accès non autorisé ou la falsification.",
    bareme: [
        "Aucun chiffrement mis en place.",
        "Certaines données sont chiffrées, mais sans cadre défini ni gestion centralisée.",
        "Une politique de chiffrement existe et s'applique aux données sensibles.",
        "Une gestion des clés sécurisée est mise en place et les données sont systématiquement chiffrées.",
        "Le chiffrement est totalement intégré et audité, avec des mises à jour selon l'évolution des menaces.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 8.24, NIST PR.DS-1",
            text: "Votre organisation chiffre-t-elle certaines données sensibles, qu'elles soient stockées ou transmises ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 8.25, NIST PR.IP-4",
            text: "Votre organisation dispose-t-elle d'une politique de chiffrement définissant les types de données à chiffrer et les méthodes acceptées ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 : 8.24, 8.25 NIST : PR.DS-1, PR.DS-2",
            text: "Le chiffrement concerne les données au repos, en transit et au niveau des sauvegardes",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 5.12, NIST PR.PT-4",
            text: "Votre organisation utilise-t-elle une solution de gestion des clés et des certificats (KMS, HSM, PKI) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 : 8.25 PR.IP-4, PR-DS-2",
            text: "Une rotation des clés de chiffrement est-elle mise en place selon un calendrier défini ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 8.30, NIST PR.IP-4, DE.CM-8",
            text: "Des contrôles sont-ils mis en place pour s'assurer du respect des politiques de chiffrement ?",
        },
    ],
};

const M1042 = {
    id: "M1042",
    name: "Disable or Remove Feature or Program",
    description: "Désactivez ou supprimez les logiciels, fonctionnalités ou services inutiles et potentiellement vulnérables afin de réduire la surface d'attaque et de prévenir l'abus par des adversaires. Cela implique d'identifier les logiciels ou fonctionnalités qui ne sont plus nécessaires ou qui pourraient être exploités, et de s'assurer qu'ils sont soit supprimés, soit correctement désactivés.",
    bareme: [
        "Aucune mesure de suppression ou de désactivation mise en place",
        "Contrôle des applications et services installés par les utilisateurs",
        "Suppression/désactivation initiale des logiciels ou services obsolètes ou inutiles",
        "Vérification régulière des applications/services installés et périmlètre étendu aux contrôle des add-on et pluggins",
        "Processus faisant partie intégrante de la gestion des actifs et incluant une veille régulière",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 8.19 & 8.2",
            text: "Les utilisateurs ne peuvent pas installer librement des logiciels/services (droits limités) et un contrôle centralisé (liste blanche/noire, catalogue d'applis approuvées) est mis en place ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 8.9 & 8.10",
            text: "Supprimez/désactivez-vous lors de l'installation/configuration les logiciels/services obsolètes ou inutiles identifiés ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.9",
            text: "Réalisez-vous une revue régulière (à minima une fois par an) de l'inventaire logiciel pour supprimer/désactiver ce qui est inutile/obsolète, avec une couverture complete des postes/serveurs ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Cette revue inclut-elle systématiquement les add-ons/plug-ins/extensions (navigateurs, suites bureautiques, IDE, clients de messagerie) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.16 & 8.19 & 8.9",
            text: "Disposez-vous d'un mécanisme automatisé et d'une surveillance continue pour identifier, désactiver ou bloquer les logiciels/services non autorisés ou obsolètes, y compris la détection de réactivation ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 5.7",
            text: "La suppression/désactivation est-elle intégrée au cycle de gestion des actifs et est-elle alimentée par une veille de sécurité régulière ?",
        },
    ],
};

const M1043 = {
    id: "M1043",
    name: "Credential Access Protection",
    description: "La protection de l'accès aux identifiants se concentre sur la mise en œuvre de mesures pour empêcher les adversaires d'obtenir des identifiants, tels que des mots de passe, des hachages, des jetons ou des clés, qui pourraient être utilisés pour un accès non autorisé. Cela implique de restreindre l'accès aux mécanismes de stockage des identifiants, de renforcer les configurations pour bloquer les méthodes de vidage des identifiants, et d'utiliser des outils de surveillance pour détecter des activités suspectes liées aux identifiants.",
    bareme: [
        "Aucune mesure de protection contre les accès non autorisés aux identifiants n'est prévue.",
        "Certaines mesures isolées de protection contre les accès non autorisés aux identifiants sont prévus.",
        "Un ensemble de mesures de protection contre les accès non autorisés aux identifiants sont prévus.",
        "La protection contre les accès non autorisés aux identifiants est prévue et encadrée .",
        "La protection contre les accès non autorisés aux identifiants est encadrée. Un outil de surveillance détecte les activités suspectes liées aux identifiants.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 : 8.2, 8.5 NIST : PR.AC-6, PR.AC-7",
            text: "Des mécanismes de protection des identifiants sont-ils déployés sur certains systèmes ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 : 5.15 NIST : PR.AC-6",
            text: "Le principe du moindre privilège est-il appliqué et respecté ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 : 8.2, 8.7 NIST : PR.AC-6, PR.PT-3",
            text: "Windows Defender Credential Guard est-il activé sur les terminaux d'entreprise ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 : 8.2, 8.3 NIST : PR.AC-6, PR.AC-7",
            text: "La stratégie de groupe prévoit-elle de réduire ou éliminer l'utilisation des informations d'identification mises en cache?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 : 8.9 NIST : PR.IP-1, PR.PT-3",
            text: "Des fonctionnalités de sécurité matérielles telles que DEP (Data Execution Prevention) et ASLR (Address Space Layout Randomization) sont-elles mises en place ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 : 8.2, 8.5 NIST : PR.AC-6, PR.PT-3",
            text: "L'accès au magasin d'informations d'identification tel que \"C:\\Windows\\System32\\config\\SAM (security account manager)\" est limité ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.AE-2, DE.CM-1",
            text: "La journalisation inclut-elle la surveillance des indentifants des utilisateurs (signaler les comportements suspects liés au vol d'identifiants)",
        },
    ],
};

const M1044 = {
    id: "M1044",
    name: "Restrict Library Loading",
    description: "La restriction du chargement des bibliothèques implique la mise en œuvre de contrôles de sécurité pour garantir que seules des bibliothèques de confiance et vérifiées (DLL, objets partagés, etc.) soient chargées dans les processus. Les adversaires abusent souvent de l'injection de bibliothèques dynamiques (DLL), du détournement de l'ordre de recherche des DLL ou des mécanismes LD_PRELOAD pour exécuter du code malveillant en forçant le système d'exploitation à charger des bibliothèques non fiables.",
    bareme: [
        "Aucune mesure de restriction sur les libraries",
        "Vérification de la signature des DLL",
        "Politique de restriction mise en oeuvre",
        "Surveillance et alerte mise en oeuvre",
        "Maitrise complète des DLL avec journalisation complète",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27001: 5.22 & 8.7 & 8.4",
            text: "Empêchez-vous le chargement de DLL non signées ou non autorisés sur tous vos types de plateformes?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27001: 5.22 & 8.9 & 8.4",
            text: "Avez-vous mis en œuvre une politique de restriction logicielle (SRP, WDAC) sur les postes et serveurs ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27001: 8.2 & 8.4",
            text: "Les mécanismes de recherche et de chargement des bibliothèques (ex. SafeDllSearchMode pour Windows, LD_LIBRARY_PATH/LD_PRELOAD pour Linux) sont-ils configurés pour limiter les emplacements autorisés et empêcher les injections malveillantes ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27001: 8.2 & 8.4",
            text: "Les droits d'écriture dans les répertoires de recherche et d'écriture des Librairies sont-ils limités aux comptes autorisés ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27001: 8.16",
            text: "Existe t-il une surveillance pour alerter ou bloquer les comportements d'exécution malveillants venant des librairies ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27001: 8.15",
            text: "Existe-t-il une traçabilité complète des chargements de DLL (process, user, quand, DLL concernée) ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27001: 8.15",
            text: "Existe-t-il une processus de gestion des DLL et de leur droits avec une journalisations des exceptions des événements et des audits.",
        },
    ],
};

const M1045 = {
    id: "M1045",
    name: "Code Signing",
    description: "La signature de code est un processus de sécurité qui garantit l'authenticité et l'intégrité des logiciels en signant numériquement les exécutables, scripts et autres artefacts de code. Elle empêche l'exécution de code non fiable ou malveillant en vérifiant les signatures numériques par rapport à des sources de confiance. La signature de code protège contre la falsification, l'usurpation et la distribution de logiciels non autorisés ou malveillants, constituant une défense essentielle contre les attaques de la chaîne d'approvisionnement et l'exploitation de logiciels.",
    bareme: [
        "Aucun mécanisme de vérification de l'intégrité ou de la signature de code.",
        "Des vérifications ponctuelles ou manuelles sont réalisées sans politique claire.",
        "Des mécanismes de vérification de signature sont appliqués à certains cas.",
        "Politique formalisée et contrôles systématiques sur les codes exécutables dans l'environnement.",
        "Le processus est structuré, coordonné et contrôlé à l'aide d'indicateurs. Il est optimisé de manière continue en prenant en compte l'évolution du contexte.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.11, 8.24; NIST PR.DS-6, PR.IP-3",
            text: "Votre organisation applique-t-elle une vérification automatique des signatures numériques des binaires, scripts ou composants logiciels ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.11; NIST PR.DS-6",
            text: "L'exécution des scripts ou binaires non signés est-elle bloquée automatiquement (ex : AppLocker, WDAC, Gatekeeper, PowerShell policy) ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.32, 8.9; NIST PR.IP-1, PR.DS-1",
            text: "Une politique de signature est-elle formalisée et s'applique-t-elle à toutes les phases du cycle de vie logiciel ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 10.1, 8.11; NIST ID.SC-4",
            text: "Les images systèmes, conteneurs ou packages utilisés sont-ils vérifiés via des signatures numériques ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 5.36; NIST PR.IP-3",
            text: "L'organisation réalise-t-elle des revues régulières des fichiers autorisés ou des règles de signature en place ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 8.16; NIST DE.CM-1, PR.DS-6",
            text: "Votre organisation détecte-t-elle les tentatives d'exécution de code non signé ou modifié ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.24; NIST PR.IP-3",
            text: "L'organisation a-t-elle défini un processus formel de mise à jour des signatures de référence (trusted publishers, certificates, hash lists, etc.) ?",
        },
    ],
};

const M1046 = {
    id: "M1046",
    name: "Boot Integrity",
    description: "L'intégrité du démarrage garantit qu'un système démarre en toute sécurité en vérifiant l'intégrité de son processus de démarrage, de son système d'exploitation et de ses composants associés. Cette mesure d'atténuation se concentre sur l'utilisation de mécanismes de démarrage sécurisé, de confiance enracinée dans le matériel et de vérifications d'intégrité en temps réel pour prévenir toute altération pendant la séquence de démarrage. Elle est conçue pour contrecarrer les adversaires tentant de modifier le firmware du système, les chargeurs de démarrage ou les composants critiques du système d'exploitation.",
    bareme: [
        "Aucun mécanisme ne permet de vérifier l'intégrité du processus de démarrage des systèmes. Les systèmes démarrent sans contrôle particulier de l'intégrité du firmware ou du chargeur de démarrage.",
        "Certains systèmes disposent de mécanismes de démarrage sécurisé, mais leur déploiement est partiel et non contrôlé à l'échelle de l'organisation.",
        "Des mécanismes de démarrage sécurisé (ex : Secure Boot) sont activés sur les systèmes et les firmwares proviennent de sources de confiance, mais les contrôles et la supervision restent limités.",
        "Les mécanismes d'intégrité du démarrage reposent sur une chaîne de confiance incluant des composants matériels et des vérifications systématiques des composants critiques du processus de démarrage.",
        "L'intégrité du démarrage est surveillée et contrôlée. Les anomalies ou altérations détectées dans la chaîne de démarrage génèrent des alertes et sont analysées dans le cadre de la supervision de sécurité.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 : 8.9, 8.7 NIST : PR.PT-3, PR.IP-1",
            text: "Les systèmes de l'organisation utilisent-ils un mécanisme de démarrage sécurisé (ex : Secure Boot) empêchant le chargement de composants non signés lors du démarrage ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 : 8.2, 8.9 NIST : PR.AC-6, PR.PT-3",
            text: "Les utilisateurs ou administrateurs locaux sont-ils empêchés de désactiver ou modifier les paramètres de sécurité du firmware (ex : mot de passe BIOS/UEFI, verrouillage des paramètres Secure Boot) ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 : 8.9, 8.8 NIST : PR.IP-1, PR.IP-3",
            text: "Les mises à jour du firmware (BIOS/UEFI) et des composants du processus de démarrage sont-elles réalisées uniquement à partir de sources approuvées et signées par les éditeurs ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 : 8.9 NIST : PR.PT-2, PR.PT-3",
            text: "Les systèmes utilisent-ils un mécanisme matériel de racine de confiance (ex : TPM ou équivalent) pour vérifier l'intégrité du processus de démarrage ?",
        },
        {
            num: 5, level: 4, docRequired: false,
            references: "ISO 27002 : 8.16 NIST : DE.CM-1, DE.AE-2",
            text: "Les mécanismes d'intégrité du démarrage permettent-ils de détecter les modifications non autorisées du processus de démarrage (ex : Measured Boot, attestation d'intégrité) ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.AE-2, DE.CM-1",
            text: "Les anomalies liées à l'intégrité du processus de démarrage (firmware modifié, Secure Boot désactivé, échec de vérification) génèrent-elles des alertes analysées par les équipes de sécurité (SOC / SIEM / EDR) ?",
        },
    ],
};

const M1047 = {
    id: "M1047",
    name: "Audit",
    description: "L'audit est le processus d'enregistrement des activités et de révision et d'analyse systématiques des activités et des configurations système. Le principal objectif de l'audit est de détecter les anomalies et d'identifier les menaces potentielles ou les faiblesses dans l'environnement. Des configurations d'audit appropriées peuvent également aider à satisfaire les exigences de conformité. Le processus d'audit inclut l'analyse régulière des comportements des utilisateurs et des journaux système en soutien à des mesures de sécurité proactives.",
    bareme: [
        "Aucune vérification périodique des systèmes, des configurations ou des activités de sécurité n'est réalisée afin d'identifier des anomalies ou des écarts de sécurité.",
        "Des vérifications de sécurité sont réalisées de manière ponctuelle ou réactive, sans méthode ni fréquence définies",
        "Les vérifications sont planifiées, documentées et portent sur un périmètre défini du système d'information",
        "Les vérifications couvrent régulièrement les principaux éléments de sécurité (configurations, permissions, logiciels, systèmes, réseau, ressources cloud, etc.). Les écarts identifiés sont analysés et suivis jusqu'à leur correction",
        "Les vérifications s'appuient, lorsque cela est pertinent, sur des outils automatisés. Des indicateurs permettent de mesurer leur efficacité et les résultats alimentent une démarche d'amélioration continue",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 5.16",
            text: "Des vérifications périodiques de sécurité sont-elles réalisées afin d'identifier des anomalies, des écarts de configuration ou des risques sur le système d'information ?",
        },
        {
            num: 2, level: 2, docRequired: true,
            references: "ISO 27002 5.36",
            text: "Ces vérifications sont-elles réalisées selon une fréquence définie et documentée ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.9",
            text: "Le périmètre des systèmes, applications, équipements, ressources cloud ou autres actifs faisant l'objet de ces vérifications est-il défini et tenu à jour ?",
        },
        {
            num: 4, level: 2, docRequired: true,
            references: "ISO 27002 5.36",
            text: "Les résultats des vérifications sont-ils documentés afin d'assurer la traçabilité des constats et des anomalies identifiés ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Les vérifications portent-elles régulièrement sur les principaux éléments du système d'information tels que les permissions, les configurations système et réseau, les logiciels, les journaux d'événements, les activités des utilisateurs et les ressources cloud lorsqu'elles existent ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27002 5.27",
            text: "Les écarts ou anomalies identifiés lors de ces vérifications sont-ils analysés, priorisés et suivis jusqu'à leur résolution ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 5.27",
            text: "Les actions correctives mises en œuvre à la suite des vérifications font-elles l'objet d'une vérification permettant de confirmer leur efficacité ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 5.36",
            text: "Des indicateurs permettent-ils de mesurer l'efficacité des vérifications et d'améliorer en continu la sécurité du système d'information ?",
        },
    ],
};

const M1048 = {
    id: "M1048",
    name: "Application Isolation and Sandboxing",
    description: "L'isolation et le sandboxing des applications font référence à la technique consistant à restreindre l'exécution du code à un environnement contrôlé et isolé (par exemple, un environnement virtuel, un conteneur ou un bac à sable). Cette méthode empêche le code potentiellement malveillant d'affecter le reste du système ou du réseau en limitant l'accès aux ressources sensibles et aux opérations critiques. L'objectif est de contenir les menaces et de minimiser leur impact.",
    bareme: [
        "Aucun mécanisme de sandboxing ou d'isolation en place",
        "Email & Web sandboxing en place",
        "Sandboxing et isolation des applications critiques",
        "Sandboxing et isolation déployés systématiquement sur tous les endpoint",
        "Moniroting et alerting",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.20, 8.7",
            text: "Disposez-vous d'un sandboxing des e-mails en production analysant dynamiquement pièces jointes et URL avant livraison aux utilisateurs ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 8.20, 8.7",
            text: "Disposez-vous d'un sandboxing lors de la navigation Web analysant dynamiquement les ressources téléchargées avant livraison aux utilisateurs ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 8.22",
            text: "Vos applications critiques sont-elles exécutées en environnement isolé (VM/conteneur/sandbox) avec accès aux ressources limité ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.22, 8.1, 8.20, 8.7",
            text: "Le sandboxing/isolation est-il déployé systématiquement sur tous les endpointsressources les plus sensibles (messagerie, endpoints utilisateurs, applications sensibles) avec politiques centralisées et supervision ?",
        },
        {
            num: 5, level: 4, docRequired: false,
            references: "ISO 27002 8.23, 8.22, 8.1",
            text: "Est-ce que le sandboxing/isolation est supervisé/monitoré dans le but de détecter les comportements malveillants et lever des alertes ?",
        },
    ],
};

const M1049 = {
    id: "M1049",
    name: "Antivirus/Antimalware",
    description: "Les solutions antivirus/antimalware utilisent des signatures, des heuristiques et une analyse comportementale pour détecter, bloquer et remédier aux logiciels malveillants, y compris les virus, chevaux de Troie, ransomwares et spywares. Ces solutions surveillent en continu les points de terminaison et les systèmes à la recherche de modèles malveillants connus et de comportements suspects indiquant une compromission. Les logiciels antivirus/antimalware doivent être déployés sur tous les appareils, avec des mises à jour automatisées pour garantir une protection contre les menaces les plus récentes.",
    bareme: [
        "Aucune protection est mise en œuvre.",
        "Une solution antivirus/antimalware est présente, mais de manière non uniforme ou isolée, sans gestion centralisée.",
        "Une solution est déployée sur l'ensemble des postes critiques (serveurs, endpoints), avec une gestion centralisée. Elle est mise à jour automatiquement et utilise des signatures/heuristiques classiques.",
        "Le système antivirus est déployé de manière complète et cohérente, avec des fonctions de détection avancée. Les logs sont centralisés, surveillés et utilisés activement dans la détection d'anomalie.",
        "En plus de tous les éléments précédents, l'organisation dispose d'un processus d'amélioration continue basé sur les test, les incidents observés et l'évolution des mences. La solution antivirus est revue régulièrement et son efficacité est mesurée et optimisée.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.7, NIST DE.CM-4",
            text: "Votre organisation utilise-t-elle des solutions antivirus et/ou antimalware pour détecter les menaces par signatures et heuristiques ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.7, ISO 27002 8.19, NIST PR.DS-1",
            text: "Ces solutions couvrent-elles l'ensemble des actifs (serveurs, endpoints, mobiles) et sont-elles centralisées pour une gestion et une visibilité globales ?",
        },
        {
            num: 3, level: 3, docRequired: false,
            references: "ISO 27002 8.7, NIST DE.CM-4, PR.IP-12",
            text: "Les solutions antivirus sont-elles mises à jour automatiquement et incluent-elles des capacités de détection avancée (heuristique, machine learning, sandboxing) ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 8.9, NIST PR.PT-1",
            text: "Les logs des antivirus sont-ils collectés, centralisés et revus régulièrement pour détecter des attaques persistantes ou des échecs de détection ?",
        },
        {
            num: 5, level: 4, docRequired: true,
            references: "ISO 27002 8.8, NIST PR.IP-12",
            text: "Votre entreprise effectue-t-elle des tests d'intrusion ou des simulations de menaces pour valider l'efficacité des solutions antivirus et antimalware ?",
        },
        {
            num: 6, level: 4, docRequired: false,
            references: "ISO 27002 8.7, NIST PR.IP-12",
            text: "Votre entreprise dispose-t-elle d'un processus de mise à jour et d'amélioration des protections antivirus basé sur l'évolution des menaces ?",
        },
    ],
};

const M1050 = {
    id: "M1050",
    name: "Exploit Protection",
    description: "Déployez des capacités qui détectent, bloquent et atténuent les conditions indicatives d'exploits logiciels. Ces capacités visent à prévenir l'exploitation en traitant les vulnérabilités, en surveillant les comportements anormaux et en appliquant des techniques d'atténuation des exploits pour renforcer les systèmes et les logiciels.",
    bareme: [
        "Aucun mécanisme spécifique n'est mis en œuvre pour prévenir ou limiter l'exploitation de vulnérabilités logicielles. Les systèmes et applications fonctionnent sans mécanismes de protection contre les exploits ou sans configuration de durcissement particulière.",
        "Certains mécanismes de protection contre l'exploitation existent (par exemple des protections mémoire du système d'exploitation), mais leur déploiement est partiel et non homogène au sein de l'organisation.",
        "Les systèmes et applications bénéficient de mécanismes de protection contre l'exploitation des vulnérabilités (ex : protections mémoire, durcissement système ou protections applicatives). Ces mécanismes sont appliqués de manière plus systématique mais restent limités ou peu supervisés.",
        "Les protections contre les exploits sont déployées de manière homogène sur les systèmes et les applications. Des outils de sécurité des endpoints ou des mécanismes de durcissement permettent de détecter ou bloquer certaines tentatives d'exploitation.",
        "Les mécanismes de protection contre les exploits sont surveillés et régulièrement ajustés. Les événements liés aux tentatives d'exploitation sont journalisés, analysés et intégrés dans les processus de supervision et d'amélioration continue de la sécurité.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 : 8.9 NIST : PR.IP-1, PR.PT-3",
            text: "Les systèmes utilisent-ils des mécanismes de protection mémoire natifs du système d'exploitation (ex : DEP, ASLR, CFG) pour limiter l'exploitation des vulnérabilités ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 : 8.9, 5.23 NIST : PR.IP-1, PR.IP-3",
            text: "Ces protections sont-elles activées et appliquées de manière homogène sur les postes de travail et les serveurs via une configuration centralisée (ex : GPO, baseline de sécurité, MDM) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 : 8.9 NIST : PR.IP-1, PR.PT-3",
            text: "Des mécanismes de durcissement du système sont-ils utilisés pour limiter les exploitations (ex : SELinux, AppArmor ou mécanismes équivalents) ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 : 8.7 NIST : DE.CM-4, PR.PT-1",
            text: "Une solution de sécurité des endpoints (antivirus avancé ou EDR) est-elle déployée pour détecter ou bloquer les comportements typiques d'exploitation de vulnérabilités ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 : 8.7, 8.9 NIST : PR.PT-3, DE.CM-4",
            text: "Les mécanismes de protection contre les exploits sont-ils configurés pour bloquer certaines techniques d'attaque (ex : exploitation mémoire, injection de code, élévation de privilèges) ?",
        },
        {
            num: 6, level: 4, docRequired: true,
            references: "ISO 27002 : 8.15, 8.16 NIST : DE.CM-1, DE.AE-3",
            text: "Comment les protections gèrent-elles la compatibilité avec différents bins et architectures, et quels cas sont non couverts ?Les événements liés aux tentatives d'exploitation (détection exploit, comportement anormal) sont-ils journalisés par les outils de sécurité ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 : 5.25, 8.16 NIST : DE.AE-2, RS.AN-1",
            text: "Ces événements sont-ils analysés dans le cadre de la supervision de sécurité (SIEM, SOC ou équivalent) afin d'identifier et traiter les tentatives d'exploitation ?",
        },
    ],
};

const M1051 = {
    id: "M1051",
    name: "Update Software",
    description: "Les mises à jour logicielles garantissent que les systèmes sont protégés contre les vulnérabilités connues en appliquant les correctifs et mises à niveau fournis par les fournisseurs. Des mises à jour régulières réduisent la surface d'attaque et empêchent les adversaires d'exploiter les failles de sécurité connues. Cela inclut le correctif des systèmes d'exploitation, des applications, des pilotes et du firmware.",
    bareme: [
        "Pas de mise managée de l'ensemble des ressources",
        "Mise à jour régulière des OS",
        "Mise à jour OS et Appli",
        "Processus centralisé et automatisé",
        "Périmètre (y compris firmware) et processus complet (y compris contrôle)",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 8.8",
            text: "Les systèmes d'exploitation (OS) des postes et serveurs reçoivent-ils des mises à jour régulières en production selon une cadence définie ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 8.8",
            text: "Les mises à jour couvrent-elles également les applications majeures et leurs composants ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 8.8",
            text: "Disposez-vous d'un processus de déploiement d'urgence pour les correctifs critiques/zero-day (délais cibles documentés, capacité de déployer hors cycle) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.9",
            text: "La gestion des mises à jour est-elle centralisée via des outils/plateformes (par ex. gestionnaire de correctifs) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.9",
            text: "Le déploiement des correctifs est-il automatisé, imposé lorsque nécessaire et accompagné de retours d'état permettant d'identifier les échecs de déploiement ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Le processus couvre-t-il également les firmwares, BIOS/UEFI, pilotes et autres composants embarqués lorsque cela est applicable ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 8.8",
            text: "Des contrôles de conformité, des indicateurs de couverture des correctifs et une veille sur les vulnérabilités permettent-ils de vérifier l'efficacité du processus ?",
        },
    ],
};

const M1052 = {
    id: "M1052",
    name: "User Account Control",
    description: "Le contrôle de compte utilisateur (UAC) est une fonctionnalité de sécurité dans Microsoft Windows qui empêche les modifications non autorisées du système d'exploitation. UAC demande aux utilisateurs de confirmer ou de fournir des identifiants d'administrateur lorsqu'une action nécessite des privilèges élevés. Une configuration appropriée de l'UAC réduit le risque d'attaques par élévation de privilèges.",
    bareme: [
        "Aucun mécanisme de contrôle des élévations de privilèges n'est mis en œuvre. Les utilisateurs peuvent exécuter des actions administratives sans contrôle particulier",
        "Le contrôle UAC est activé sur les systèmes concernés. Les utilisateurs standards sont empêchés d'effectuer des actions nécessitant des privilèges administratifs sans élévation explicite",
        "La configuration du contrôle UAC est définie et appliquée selon une politique adaptée aux différents types de systèmes (postes de travail, serveurs, systèmes spécifiques). Les élévations de privilèges sont limitées aux besoins opérationnels",
        "Les demandes d'élévation de privilèges sont journalisées et surveillées. Les événements liés au contrôle UAC sont intégrés aux activités de supervision de sécurité",
        "Des audits réguliers permettent de vérifier l'efficacité du contrôle UAC, son adéquation avec les besoins opérationnels et le respect de la politique de gestion des privilèges. Les résultats alimentent l'amélioration continue",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.8",
            text: "Le contrôle UAC est-il activé sur l'ensemble des postes de travail et des systèmes concernés ?",
        },
        {
            num: 2, level: 1, docRequired: true,
            references: "ISO 27002 8.8",
            text: "Les utilisateurs disposent-ils uniquement de comptes standards pour leurs activités quotidiennes, les élévations de privilèges étant réalisées uniquement lorsque cela est nécessaire ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 8.8",
            text: "La configuration du contrôle UAC est-elle définie et appliquée selon une politique adaptée aux différents types de systèmes (postes de travail, serveurs, etc.) ?",
        },
        {
            num: 4, level: 3, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Les événements liés aux demandes d'élévation de privilèges sont-ils journalisés et surveillés ?",
        },
        {
            num: 5, level: 4, docRequired: true,
            references: "ISO 27002 8.9",
            text: "Des audits réguliers permettent-ils de vérifier l'efficacité du contrôle UAC et l'adéquation de sa configuration avec la politique de gestion des privilèges ?",
        },
    ],
};

const M1053 = {
    id: "M1053",
    name: "Data Backup",
    description: "La sauvegarde de données consiste à effectuer et à stocker de manière sécurisée des copies de données provenant des systèmes des utilisateurs finaux et des serveurs critiques. Elle garantit que les données restent disponibles en cas de compromission du système, d'attaques par ransomware ou d'autres perturbations. Les processus de sauvegarde doivent inclure le renforcement des systèmes de sauvegarde, la mise en œuvre de solutions de stockage sécurisées, et la conservation des sauvegardes isolées du réseau d'entreprise pour prévenir toute compromission pendant des incidents actifs.",
    bareme: [
        "Aucune sauvegarde n'est réalisée.",
        "Des sauvegardes sont réalisées de manière occasionnelle, sans processus défini.",
        "Un processus de sauvegarde est en place, avec des règles.",
        "Une stratégie complète de sauvegarde existe, incluant la segmentation, l'isolation, et des tests de restauration.",
        "Le processus est audité, continuellement amélioré et intègre des protections avancées contre les attaques.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 8.13, NIST PR.IP-4",
            text: "Votre organisation réalise-t-elle des sauvegardes des données critiques ?",
        },
        {
            num: 2, level: 2, docRequired: false,
            references: "ISO 27002 8.13, NIST PR.IP-4",
            text: "Les sauvegardes sont-elles réalisées de manière automatisée et régulière ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 8.13, NIST PR.IP-4",
            text: "Votre organisation dispose-t-elle d'une politique formelle de gestion des sauvegardes ?",
        },
        {
            num: 4, level: 3, docRequired: false,
            references: "ISO 27002 8.14, NIST PR.PT-5",
            text: "Les sauvegardes sont-elles stockées sur un support distinct et isolé du réseau de production (ex. sauvegardes hors ligne, air-gapped, stockage cloud sécurisé) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 5.33, NIST PR.DS-1, PR.DS-2",
            text: "Utilisez-vous des mécanismes de protection des sauvegardes contre l'accès non autorisé (ex. chiffrement, MFA, contrôle d'accès strict) ?",
        },
        {
            num: 6, level: 3, docRequired: true,
            references: "ISO 27002 8.13, NIST PR.IP-10",
            text: "Votre organisation réalise-t-elle des tests réguliers de restauration des sauvegardes ?",
        },
        {
            num: 7, level: 4, docRequired: true,
            references: "ISO 27002 5.29, NIST PR.IP-9",
            text: "Disposez-vous d'un plan de reprise après sinistre (PRA) formel intégrant l'utilisation des sauvegardes en cas d'incident majeur ?",
        },
        {
            num: 8, level: 4, docRequired: true,
            references: "ISO 27002 5.36, NIST PR.IP-9",
            text: "Des audits ou revues de conformité sur la gestion des sauvegardes sont-ils réalisés régulièrement et intégrés dans un cycle d'amélioration continue incluant les retours d'incidents et de tests ?",
        },
    ],
};

const M1054 = {
    id: "M1054",
    name: "Software Configuration",
    description: "La configuration logicielle consiste à apporter des ajustements axés sur la sécurité aux paramètres des applications, middleware, bases de données ou autres logiciels afin d'atténuer les menaces potentielles. Ces modifications aident à réduire la surface d'attaque, à appliquer les meilleures pratiques et à protéger les données sensibles.",
    bareme: [
        "Aucune politique de gestion de configuration logicielle",
        "Les recommendations minimum de sécurité sont implémentées",
        "Les accès sont controllés et les mise à jour sont appliquées",
        "Contrôle plus approndis des paramètres",
        "Contrôle complet et test des éléments de configuration des logiciels",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO/IEC 27001: 5.19 & 8.19 & 8.26",
            text: "Les recommandations de sécurité publiées par les éditeurs sont-elles prises en compte lors de la configuration des logiciels ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO/IEC 27001: 8.9 et 8.15",
            text: "Les logiciels sont-ils configurés conformément aux règles de sécurité définies par votre organisation ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO/IEC 27001: 8.2, 8.3 et 8.5 / NIST CSF 2.0: PR.AA-05",
            text: "L'accès aux logiciels, à leurs fonctionnalités sensibles et aux données qu'ils traitent est-il protégé par une authentification adaptée et le principe du moindre privilège ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO/IEC 27001: 8.19/ NIST CSF 2.0: PR.PS-02",
            text: "Les fonctionnalités, modules ou services non nécessaires sont-ils désactivés sur les logiciels utilisés ?",
        },
        {
            num: 5, level: 3, docRequired: true,
            references: "ISO/IEC 27001: 5.22 & 8.9/ NIST CSF 2.0: PR.PS-01",
            text: "Disposez-vous d'un processus formel de gestion des configurations logicielles ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO/IEC 27001: 8.9/ NIST CSF 2.0: PR.PS-01",
            text: "Les configurations logicielles sont-elles documentées et versionnées ?",
        },
        {
            num: 7, level: 3, docRequired: true,
            references: "ISO/IEC 27001: 8.9 / NIST CSF 2.0: PR.PS-01",
            text: "Les configurations logicielles sont-elles revues périodiquement afin d'identifier les écarts par rapport aux exigences de sécurité ?",
        },
        {
            num: 8, level: 3, docRequired: true,
            references: "ISO/IEC 27001: 5.22/ NIST CSF 2.0: ID.RA-09",
            text: "Faites vous des audits pour vérifier les paramètres de sécurité des logiciels (mise à jour, fonctionalité non utilisée, ….) ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "ISO/IEC 27001: 5.22 & 8.31/ NIST CSF 2.0: PR.PS-01 & ID.RA-09",
            text: "Les changements de configuration ou de version sont-ils testés dans un environnement de préproduction avant leur déploiement ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "ISO/IEC 27001: 8.16/ NIST CSF 2.0: PR.PS-04",
            text: "Les journaux des logiciels sont-ils activés et surveillés afin de détecter les événements de sécurité ?",
        },
    ],
};

const M1055 = {
    id: "M1055",
    name: "Do Not Mitigate",
    description: "La catégorie Ne Pas Atténuer met en évidence des scénarios où tenter d'atténuer une technique spécifique pourrait involontairement augmenter le risque de sécurité ou l'instabilité opérationnelle de l'organisation. Cela peut se produire en raison de la complexité du système, de l'intégration de processus critiques ou du risque d'introduire de nouvelles vulnérabilités. Plutôt que de mettre en œuvre une atténuation directe, ces situations peuvent nécessiter des stratégies alternatives telles que la détection, la surveillance ou la réponse. La catégorie Ne Pas Atténuer souligne l'importance d'évaluer les compromis entre les efforts d'atténuation et l'intégrité globale du système.",
    bareme: [],
    questions: [],   // pseudo-mitigation : rien à évaluer
};

const M1056 = {
    id: "M1056",
    name: "Pre-compromise",
    description: "Les atténuations avant compromission impliquent des mesures et des défenses proactives mises en œuvre pour empêcher les adversaires d'identifier et d'exploiter avec succès des failles lors des phases de reconnaissance et de développement des ressources d'une attaque. Ces activités se concentrent sur la réduction de la surface d'attaque d'une organisation, l'identification des efforts de préparation adverses, et l'augmentation de la difficulté pour les attaquants de mener des opérations réussies.",
    bareme: [
        "Aucune mesure proactive pour prévenir les compromissions (pas de gestion des correctifs, pas de segmentation réseau, pas de Tiering Model).",
        "Mises à jour occasionnelles des logiciels et sensibilisation basique aux risques.",
        "Processus de gestion des correctifs en place, segmentation réseau basique, mais pas de Tiering Model formalisé.",
        "Gestion des correctifs centralisée, segmentation réseau, surveillance des vulnérabilités, et début de mise en place d'un Tiering Model (classification des systèmes en Tiers 0/1/2).",
        "Solution complète : gestion proactive des correctifs, segmentation réseau stricte, Tiering Model pleinement déployé (contrôles d'accès renforcés par niveau, audits réguliers, et surveillance ciblée).",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les actifs critiques sont-ils identifiés et priorisés afin d'appliquer en priorité les mesures de protection préventives ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les mesures de réduction de la surface d'attaque sont-elles adaptées à la criticité des systèmes (segmentation, durcissement, Tiering, etc.) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Votre réseau est-il segmenté en zones de confiance (ex : DMZ, LAN, Tier 0/1/2) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Un modèle de Tiering (ou une classification équivalente des systèmes et comptes) est-il mis en œuvre afin d'isoler les ressources les plus critiques ?",
        },
        {
            num: 5, level: 2, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les accès aux systèmes les plus critiques sont-ils strictement limités et surveillés ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Des règles de filtrage réseau spécifiques sont-elles appliquées selon la criticité des actifs ou des zones (pare-feu, ACL, micro-segmentation, etc.) ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les équipements de sécurité détectent-ils ou bloquent-ils les tentatives de reconnaissance (scans de ports, balayages réseau, découverte de services, etc.) ?",
        },
        {
            num: 8, level: 3, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les résultats des évaluations de vulnérabilités sont-ils utilisés pour adapter les mesures de protection des actifs les plus critiques ?",
        },
        {
            num: 9, level: 4, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Une veille sur les vulnérabilités et les menaces permet-elle d'adapter les mesures de protection en fonction de la criticité des actifs ?",
        },
        {
            num: 10, level: 4, docRequired: false,
            references: "MITRE ATT&CK",
            text: "Les utilisateurs et administrateurs sont-ils sensibilisés aux techniques de compromission initiale (phishing, ingénierie sociale, reconnaissance) en fonction de leur niveau d'exposition ?",
        },
    ],
};

const M1057 = {
    id: "M1057",
    name: "Data Loss Prevention",
    description: "La prévention de la perte de données (DLP) implique la mise en œuvre de stratégies et de technologies pour identifier, catégoriser, surveiller et contrôler le mouvement des données sensibles au sein d'une organisation. Cela inclut la protection des formats de données indiquant des informations personnellement identifiables (PII), des propriétés intellectuelles ou des données financières contre l'accès non autorisé, la transmission ou l'exfiltration. Les solutions DLP s'intègrent aux plateformes réseau, aux points de terminaison et aux plateformes cloud pour appliquer des politiques de sécurité et prévenir les fuites de données accidentelles ou malveillantes.",
    bareme: [
        "Aucune politique ou solution DLP en place.",
        "Politique DLP présente mais incomplète ou non suivie, peu de contrôle sur les données sensibles.",
        "Classification réalisée et outils DLP déployés sur certains canaux avec détection active.",
        "Couverture étendue des canaux, chiffrement/masking actif, audits réguliers.",
        "DLP intégré à un processus d'amélioration continue basé sur les incidents et la veille.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: true,
            references: "ISO 27002 8.12, NIST PR.DS-5",
            text: "Disposez-vous d'une stratégie de Data Loss Prevention (DLP) ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 5.9, 5.12, 5.14, 8.10, 8.12; NIST ID.AM-5",
            text: "Cette politique DLP couvre-t-elle le cycle de vie des données sensibles (inventaire, classification, transfert, suppression) ?",
        },
        {
            num: 3, level: 2, docRequired: true,
            references: "ISO 27002 5.9, 5.12, 5.34; NIST ID.AM-5",
            text: "Disposez-vous d'un inventaire et d'une classification formelle des données sensibles (PII, données confidentielles, etc.) ?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 8.12, NIST PR.DS-5",
            text: "Votre système DLP est-il configuré pour détecter les formats indiquant la présence de PII ou d'autres catégories de données sensibles ?",
        },
        {
            num: 5, level: 2, docRequired: false,
            references: "ISO 27002 8.12, 5.14, 5.23, 8.10",
            text: "Le DLP couvre-t-il la détection de données sensibles sur les partages réseau, les postes de travail et/ou les supports amovibles ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 8.12; NIST PR.DS-5",
            text: "Le DLP est-il configuré pour contrôler/alerter/bloquer la copie de données vers des périphériques USB ou autres supports physiques ?",
        },
        {
            num: 7, level: 3, docRequired: false,
            references: "ISO 27002 8.12, 5.23; NIST PR.DS-5",
            text: "Le DLP surveille-t-il les transferts via les web services (ex. SharePoint, services Cloud, transferts HTTP/HTTPS, etc.) et les protocoles alternatifs (FTP, SFTP, etc.) ?",
        },
        {
            num: 8, level: 3, docRequired: false,
            references: "ISO 27002 5.14, 8.12; NIST PR.DS-5",
            text: "Le DLP est-il configuré pour analyser et bloquer ou chiffrer automatiquement les e-mails sortants contenant des données confidentielles ?",
        },
        {
            num: 9, level: 3, docRequired: false,
            references: "ISO 27002 8.11, 5.34, 5.12",
            text: "Disposez-vous de règles DLP spécifiques pour exiger un chiffrement ou un masquage des données sensibles (Data Masking) avant transfert / stockage ?",
        },
        {
            num: 10, level: 4, docRequired: true,
            references: "ISO 27002 5,36, NIST PR.IP-8",
            text: "Effectuez-vous des audits internes ou externes pour vérifier l'efficacité du DLP ?",
        },
        {
            num: 11, level: 4, docRequired: false,
            references: "ISO 27002 5.24; NIST DE.AE-2",
            text: "Disposez-vous d'un processus d'amélioration continue (leçons tirées d'incidents, mise à jour des règles DLP, sensibilisation périodique) ?",
        },
    ],
};

const M1060 = {
    id: "M1060",
    name: "Out-of-Band Communications Channel",
    description: "Établissez des canaux de communication sécurisés hors bande pour garantir la continuité des communications critiques pendant les incidents de sécurité, les attaques sur l'intégrité des données ou les défaillances de communication réseau. La communication hors bande consiste à utiliser un chemin de communication alternatif et séparé qui ne dépend pas de l'infrastructure réseau principale potentiellement compromise. Cette méthode peut inclure des applications de messagerie sécurisées, des lignes téléphoniques chiffrées, des communications par satellite ou des systèmes de communication d'urgence dédiés. Utiliser ces canaux alternatifs réduit le risque que des adversaires interceptent, perturbent ou altèrent les communications sensibles et permet de coordonner une réponse efficace aux incidents.",
    bareme: [
        "L'entreprise ne dispose d'aucun canal alternatif pour communiquer en cas de compromission du réseau ou d'incident majeur. Les échanges dépendent entièrement de l'infrastructure interne.",
        "Les collaborateurs utilisent des moyens informels (téléphone personnels, SMS...) lors d'incidents, sans contrôle, sécurisation ni politique formelle.",
        "Des canaux hors bande (ligne téléphonique dédiée, messagerie sécurisée...) existent pour certaines fonctions critiques, mais sans encadrement clair, ni intégration dans le plan de continuité ou de gestion de crise.",
        "L'entreprise dispose d'un canal hors bande formalisé, intégré au plan de continuité d'activité ou de réponse à incident. Le canal est chiffré et authentifié.",
        "Des canaux hors bande sécurisés, chiffrés et supervisés sont déployés à l'échelle de l'entreprise. Leur utilisation est testée régulièrement, documentée dans le plan de gestion de crise, et fait l'objet d'audits de conformité et de sécurité.",
    ],
    questions: [
        {
            num: 1, level: 1, docRequired: false,
            references: "ISO 27002 5.29, 8.14 NIST CSF 2.0 RC.CO-03, RC.IM-02",
            text: "L'entreprise dispose-t-elle d'un canal de communication indépendant du réseau principal en cas de coupure ou d'incident majeur ?",
        },
        {
            num: 2, level: 1, docRequired: false,
            references: "ISO 27002 5.29, 6.03 NIST CSF 2.0 RC.CO-01, RC.CO-02",
            text: "Ce canal a-t-il déjà été identifié et communiqué aux collaborateurs concernés (cellule de crise, direction, équipes IT) ?",
        },
        {
            num: 3, level: 2, docRequired: false,
            references: "ISO 27002 5.30, 5.37 NIST CSF 2.0 RC.RP-01",
            text: "L'utilisation de ce canal est elle documentée (mention dans le plan de continuité d'activité)?",
        },
        {
            num: 4, level: 2, docRequired: false,
            references: "ISO 27002 5.29, 5.30 NIST CSF 2.0 RC.RP-02",
            text: "Ce canal fait-il l'objet de procédures d'activation précises (quand basculer sur ce canal, quelles équipes le déclenchent, comment communiquer l'accès) ?",
        },
        {
            num: 5, level: 3, docRequired: false,
            references: "ISO 27002 8.24, 5.29 NIST CSF 2.0 PR.DS-01 / PR.DS-05",
            text: "Les communications via ce canal sont-elles chiffrées et authentifiées ?",
        },
        {
            num: 6, level: 3, docRequired: false,
            references: "ISO 27002 5.29, 5.30 NIST CSF 2.0 RC.IM-03",
            text: "Le canal alternatif est-il régulièrement testé lors d'exercices de crise, de simulations de cyberattaque ou de coupure réseau ? Les résultats servent-ils pour l'amélioration continue ?",
        },
        {
            num: 7, level: 4, docRequired: false,
            references: "ISO 27002 5.35, 5.36, 8.15, 8.16 NIST CSF 2.0 RC.IM-04, RC.CO-05",
            text: "L'entreprise audit-elle ou supervise-t-elle la conformité et la sécurité de ces canaux (chiffrement, tracabilité, disponibilité) ?",
        },
        {
            num: 8, level: 4, docRequired: false,
            references: "ISO 27002 5.29, 5.30, 8.14 NIST CSF 2.0 RC.RP-02, RC.CO-03, PR.DS-04",
            text: "Disposez-vous de plusieurs canaux de communication alternatifs, indépendants du réseau principal, permettant de maintenir la continuité des échanges critiques en cas de défaillance d'un canal ou d'incident majeur ?",
        },
    ],
};


/**
 * Toutes les mitigations du référentiel, par identifiant. Sert à consulter une
 * mitigation (nom, description, barème) depuis la matrice, y compris celle qui
 * n'a pas de questionnaire.
 */
export const CATALOG = new Map([
    [M1013.id, M1013],
    [M1015.id, M1015],
    [M1016.id, M1016],
    [M1017.id, M1017],
    [M1018.id, M1018],
    [M1019.id, M1019],
    [M1020.id, M1020],
    [M1021.id, M1021],
    [M1022.id, M1022],
    [M1024.id, M1024],
    [M1025.id, M1025],
    [M1026.id, M1026],
    [M1027.id, M1027],
    [M1028.id, M1028],
    [M1029.id, M1029],
    [M1030.id, M1030],
    [M1031.id, M1031],
    [M1032.id, M1032],
    [M1033.id, M1033],
    [M1034.id, M1034],
    [M1035.id, M1035],
    [M1036.id, M1036],
    [M1037.id, M1037],
    [M1038.id, M1038],
    [M1039.id, M1039],
    [M1040.id, M1040],
    [M1041.id, M1041],
    [M1042.id, M1042],
    [M1043.id, M1043],
    [M1044.id, M1044],
    [M1045.id, M1045],
    [M1046.id, M1046],
    [M1047.id, M1047],
    [M1048.id, M1048],
    [M1049.id, M1049],
    [M1050.id, M1050],
    [M1051.id, M1051],
    [M1052.id, M1052],
    [M1053.id, M1053],
    [M1054.id, M1054],
    [M1055.id, M1055],
    [M1056.id, M1056],
    [M1057.id, M1057],
    [M1060.id, M1060],
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
