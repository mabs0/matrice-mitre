/* ============================================================================
   Bascule clair / sombre.

   Clair par défaut, quel que soit le réglage du système : l'outil produit des
   captures et des exports qui finissent dans des rapports et des présentations,
   qui sont sur fond blanc. Ouvrir sur le thème dans lequel on va travailler
   évite d'avoir à basculer avant chaque copie.

   Dès que l'utilisateur bascule, son choix est estampillé sur <html>, retenu, et
   gagne sur tout le reste.

   Seule exception à la règle « on ne stocke rien » : la préférence de thème,
   qui n'est pas une donnée d'évaluation. Sans elle le thème se réinitialise
   à chaque rechargement, et les données sont justement re-tirées à chaque fois.
   ========================================================================= */

const KEY = "ctrm.theme";

export function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch { /* mode privé strict */ }
    // Sans choix retenu, on pose le thème clair explicitement plutôt que de
    // laisser la feuille de style suivre le réglage du système.
    document.documentElement.dataset.theme =
        stored === "light" || stored === "dark" ? stored : "light";
    return current();
}

export function current() {
    const stamped = document.documentElement.dataset.theme;
    if (stamped === "light" || stamped === "dark") return stamped;
    return "light";
}

export function toggleTheme() {
    const next = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* ignoré */ }
    return next;
}
