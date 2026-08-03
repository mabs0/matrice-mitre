/* ============================================================================
   Bascule clair / sombre.

   Sombre par défaut. Au premier chargement on suit le réglage du système ;
   dès que l'utilisateur bascule, son choix est estampillé sur <html> et gagne
   sur le réglage OS dans les deux sens.

   Seule exception à la règle « on ne stocke rien » : la préférence de thème,
   qui n'est pas une donnée d'évaluation. Sans elle le thème se réinitialise
   à chaque rechargement, et les données sont justement re-tirées à chaque fois.
   ========================================================================= */

const KEY = "ctrm.theme";

export function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch { /* mode privé strict */ }
    if (stored === "light" || stored === "dark") {
        document.documentElement.dataset.theme = stored;
    }
    return current();
}

export function current() {
    const stamped = document.documentElement.dataset.theme;
    if (stamped === "light" || stamped === "dark") return stamped;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function toggleTheme() {
    const next = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* ignoré */ }
    return next;
}
