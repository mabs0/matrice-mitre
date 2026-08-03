/* Petits utilitaires d'interface partagés par les vues. */

/** Échappe le texte destiné à une interpolation HTML. */
export function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

export const $ = sel => document.querySelector(sel);
export const $$ = sel => [...document.querySelectorAll(sel)];

export function toast(message, kind = "") {
    const host = $("#toasts");
    if (!host) return;
    const node = document.createElement("div");
    node.className = `toast ${kind}`;
    node.textContent = message;
    host.appendChild(node);
    setTimeout(() => node.remove(), kind === "error" ? 6000 : 3200);
}

/* ------------------------------------------------------------------ modale */

export function openModal(html, { wide = false } = {}) {
    const modal = $("#modal");
    const panel = $("#modal-panel");
    panel.style.maxWidth = wide ? "900px" : "720px";
    panel.innerHTML = `<button class="modal-close" aria-label="Fermer">&times;</button>${html}`;
    modal.classList.add("open");
    panel.querySelector(".modal-close").onclick = closeModal;
    return panel;
}

export function closeModal() {
    const modal = $("#modal");
    if (!modal) return;
    modal.classList.remove("open");
    // On vide le panneau : sinon le contenu et les gestionnaires de la modale
    // précédente restent attachés dans le document.
    $("#modal-panel").innerHTML = "";
}

export function initModal() {
    const modal = $("#modal");
    if (!modal) return;
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;
        if (modal.classList.contains("open")) { closeModal(); return; }
        // Referme aussi les menus déroulants ouverts.
        $$(".dropdown.open").forEach(d => d.classList.remove("open"));
    });
}

/** Ferme les menus déroulants au clic extérieur. */
export function initDropdowns() {
    document.addEventListener("click", e => {
        $$(".dropdown.open").forEach(d => { if (!d.contains(e.target)) d.classList.remove("open"); });
    });
}

/** Déclenche un téléchargement depuis un Blob, sans rien conserver. */
export function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    // Laisse au navigateur le temps de lancer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Nom de fichier sûr, dérivé du nom du layer. */
export function slug(text) {
    return String(text || "layer")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "layer";
}
