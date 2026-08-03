/* ============================================================================
   La matrice.

   Construite directement depuis les données ATT&CK relues à chaque chargement.
   L'ordre des colonnes vient de `tactic_refs`, donc la vue absorbe sans
   modification une évolution du référentiel — la scission de Defense Evasion
   en Stealth et Defense Impairment en v19 ajoute simplement une colonne.
   ========================================================================= */

import { esc, $, $$, toast, openModal, closeModal } from "../ui.js";
import { LEVEL_LABELS, LEVEL_DEFINITIONS, getQuestionnaire } from "../catalog.js";
import { buildMatrixScores, mitigationLevels, CELL_STATE, SCORING_MODES, AGGREGATION_MODES } from "../scoring.js";
import { exportExcel, exportJSON } from "../io.js";

/** État de vue, volontairement hors du layer : ce n'est pas de la donnée d'évaluation. */
const view = {
    query: "",
    platforms: new Set(),      // toutes cochées au départ ; vide = tout masqué
    platformsReady: false,
    showSubs: false,
    highlight: "",             // identifiant de mitigation à surligner
};

export function renderMatrix(app) {
    const { data, layer } = app;
    // On n'initialise qu'une fois : sinon décocher toutes les plateformes serait
    // annulé au prochain rendu de la vue.
    if (!view.platformsReady) {
        view.platforms = new Set(data.platforms);
        view.platformsReady = true;
    }

    $("#view-matrix").innerHTML = `
        <div id="matrix-toolbar">
            <input type="text" id="matrix-search" placeholder="Rechercher une technique…"
                   value="${esc(view.query)}" autocomplete="off">

            <div class="dropdown" id="dd-platform">
                <button class="btn btn-sm" id="dd-platform-btn">
                    Plateformes <span class="chip-count" id="platform-count"></span>
                </button>
                <div class="dropdown-panel" id="platform-panel"></div>
            </div>

            <select id="matrix-mitigation" style="max-width:250px;">
                <option value="">Surligner une mitigation…</option>
            </select>

            <label class="tool-group" style="cursor:pointer;">
                <input type="checkbox" id="matrix-subs" ${view.showSubs ? "checked" : ""}>
                <span class="tool-label">Sous-techniques</span>
            </label>

            <div class="tool-sep"></div>

            <div class="dropdown" id="dd-method">
                <button class="btn btn-sm" id="dd-method-btn">Méthode de notation</button>
                <div class="dropdown-panel" id="method-panel" style="min-width:300px;"></div>
            </div>

            <div class="spacer"></div>

            <div id="matrix-legend"></div>

            <div class="tool-sep"></div>

            <button class="btn btn-sm" id="matrix-quiz">Questionnaire</button>
            <div class="dropdown" id="dd-export">
                <button class="btn btn-sm btn-primary" id="dd-export-btn">Exporter</button>
                <div class="dropdown-panel" id="export-panel" style="min-width:280px;"></div>
            </div>
        </div>

        <div id="matrix-wrapper"><div id="matrix-grid"></div></div>`;

    buildLegend();
    buildPlatformFilter(app);
    buildMitigationSelect(app);
    buildMethodPanel(app);
    buildExportPanel(app);

    $("#matrix-search").oninput = e => { view.query = e.target.value.trim(); paint(app); };
    $("#matrix-subs").onchange = e => { view.showSubs = e.target.checked; paint(app); };
    $("#matrix-quiz").onclick = () => app.show("quiz");

    for (const id of ["platform", "method", "export"]) {
        $(`#dd-${id}-btn`).onclick = e => {
            e.stopPropagation();
            const dd = $(`#dd-${id}`);
            const wasOpen = dd.classList.contains("open");
            $$(".dropdown.open").forEach(d => d.classList.remove("open"));
            if (!wasOpen) { dd.classList.add("open"); placePanel(dd); }
        };
    }

    paint(app);
}

/**
 * Cale un panneau sous son bouton, en coordonnées de fenêtre, et le ramène
 * dans l'écran s'il dépasse à droite.
 */
function placePanel(dropdown) {
    const button = dropdown.querySelector("button");
    const panel = dropdown.querySelector(".dropdown-panel");
    const rect = button.getBoundingClientRect();
    const margin = 8;

    panel.style.top = `${rect.bottom + 5}px`;
    panel.style.left = "0px";                       // pour mesurer la largeur réelle
    const width = panel.offsetWidth;
    const left = Math.min(rect.left, window.innerWidth - width - margin);
    panel.style.left = `${Math.max(margin, left)}px`;
}

/* ------------------------------------------------------------------ légende */

function buildLegend() {
    const steps = LEVEL_LABELS.map((label, i) =>
        `<span class="legend-item" title="${esc(LEVEL_DEFINITIONS[i])}">
             <i class="legend-swatch l${i}"></i>${i} ${esc(label)}</span>`
    ).join("");

    $("#matrix-legend").innerHTML = steps +
        `<span class="legend-item"><i class="legend-swatch unscored"></i>non évalué</span>` +
        `<span class="legend-item"><i class="legend-swatch nomit"></i>pas de mitigation</span>`;
}

/* -------------------------------------------------------- filtre plateforme */

function buildPlatformFilter(app) {
    const { data } = app;
    $("#platform-panel").innerHTML =
        `<label class="row"><input type="checkbox" id="pf-all"><span>Tout sélectionner</span></label>
         <div class="sep"></div>` +
        data.platforms.map(p => `
            <label class="row">
                <input type="checkbox" data-platform="${esc(p)}" ${view.platforms.has(p) ? "checked" : ""}>
                <span>${esc(p)}</span>
            </label>`).join("") +
        `<div class="hint">Filtre sur <code>x_mitre_platforms</code>. Une technique est masquée
         si aucune de ses plateformes n'est sélectionnée.</div>`;

    $("#pf-all").checked = view.platforms.size === data.platforms.length;
    $("#pf-all").onchange = e => {
        view.platforms = e.target.checked ? new Set(data.platforms) : new Set();
        $$('#platform-panel input[data-platform]').forEach(cb => { cb.checked = e.target.checked; });
        paint(app);
    };

    $$('#platform-panel input[data-platform]').forEach(cb => {
        cb.onchange = () => {
            const name = cb.dataset.platform;
            if (cb.checked) view.platforms.add(name); else view.platforms.delete(name);
            $("#pf-all").checked = view.platforms.size === data.platforms.length;
            paint(app);
        };
    });
}

/* ---------------------------------------------------- surlignage mitigation */

function buildMitigationSelect(app) {
    const select = $("#matrix-mitigation");
    const levels = mitigationLevels(app.layer);

    for (const m of app.data.mitigations) {
        const option = document.createElement("option");
        option.value = m.id;
        const level = levels.has(m.id) ? ` — niveau ${levels.get(m.id)}` : "";
        option.textContent = `[${m.id}] ${m.name}${level}`;
        select.appendChild(option);
    }
    select.value = view.highlight;
    select.onchange = e => { view.highlight = e.target.value; paint(app); };
}

/* ------------------------------------------------------- méthode de notation */

function buildMethodPanel(app) {
    const { layer } = app;
    const block = (title, modes, current, key) => `
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-mute);padding:4px 7px 6px;">${title}</div>
        ${Object.entries(modes).map(([value, mode]) => `
            <label class="row" style="align-items:flex-start;">
                <input type="radio" name="${key}" value="${value}" ${current === value ? "checked" : ""} style="margin-top:2px;">
                <span>
                    <b style="font-weight:600;">${esc(mode.label)}</b>
                    <span style="display:block;font-size:0.68rem;color:var(--text-mute);line-height:1.4;margin-top:2px;">${esc(mode.hint)}</span>
                </span>
            </label>`).join("")}`;

    $("#method-panel").innerHTML =
        block("Niveau d'une mitigation", SCORING_MODES, layer.scoring, "scoring") +
        `<div class="sep"></div>` +
        block("Technique couverte par plusieurs mitigations", AGGREGATION_MODES, layer.aggregation, "aggregation") +
        `<div class="hint">Le mode choisi s'applique immédiatement à toute la matrice,
         voyage avec le layer et figure dans l'export.</div>`;

    $$('#method-panel input[name="scoring"]').forEach(radio => {
        radio.onchange = () => { app.layer.scoring = radio.value; refreshMitigationLabels(app); paint(app); };
    });
    $$('#method-panel input[name="aggregation"]').forEach(radio => {
        radio.onchange = () => { app.layer.aggregation = radio.value; paint(app); };
    });
}

function refreshMitigationLabels(app) {
    const levels = mitigationLevels(app.layer);
    for (const option of $$("#matrix-mitigation option")) {
        if (!option.value) continue;
        const m = app.data.mitigationById.get(option.value);
        const level = levels.has(m.id) ? ` — niveau ${levels.get(m.id)}` : "";
        option.textContent = `[${m.id}] ${m.name}${level}`;
    }
}

/* ------------------------------------------------------------------ exports */

function buildExportPanel(app) {
    // Le chiffrement est actif par défaut : une évaluation de maturité décrit
    // les faiblesses d'un système d'information. L'export en clair reste
    // accessible, mais il faut le demander.
    $("#export-panel").innerHTML = `
        <label class="row" style="align-items:flex-start;">
            <input type="checkbox" id="ex-crypt" checked style="margin-top:2px;">
            <span>
                <b style="font-weight:600;">Chiffrer le fichier JSON</b>
                <span style="display:block;font-size:0.68rem;color:var(--text-mute);line-height:1.4;margin-top:2px;">
                    Recommandé. La clé sera redemandée à l'import.</span>
            </span>
        </label>
        <div class="field" id="ex-pass-field" style="padding:6px 7px 10px;">
            <label for="ex-pass">Clé de chiffrement</label>
            <input type="password" id="ex-pass" autocomplete="new-password">
            <span class="help" id="ex-pass-help">Sans elle, impossible de relire le fichier —
                l'outil ne la conserve nulle part.</span>
        </div>
        <div class="sep"></div>
        <div class="row" id="ex-json" role="button" tabindex="0"><span>↓</span><span>Exporter en JSON</span></div>
        <div class="row" id="ex-xlsx" role="button" tabindex="0"><span>↓</span><span>Exporter en Excel (.xlsx)</span></div>`;

    const crypt = $("#ex-crypt");
    const passField = $("#ex-pass-field");
    const help = $("#ex-pass-help");

    crypt.onchange = () => {
        passField.style.opacity = crypt.checked ? "1" : "0.4";
        $("#ex-pass").disabled = !crypt.checked;
        help.textContent = crypt.checked
            ? "Sans elle, impossible de relire le fichier — l'outil ne la conserve nulle part."
            : "Le fichier sortira en clair : lisible par quiconque y a accès.";
    };

    $("#ex-json").onclick = () => {
        const passphrase = crypt.checked ? $("#ex-pass").value : "";
        if (crypt.checked && !passphrase) {
            toast("Saisissez une clé, ou décochez le chiffrement.", "error");
            return;
        }
        exportJSON(app.layer, passphrase);
        $("#dd-export").classList.remove("open");
        toast(passphrase ? "Layer exporté en JSON chiffré." : "Layer exporté en JSON en clair.");
    };
    $("#ex-xlsx").onclick = () => {
        exportExcel(app.layer, app.data);
        $("#dd-export").classList.remove("open");
        toast("Layer exporté en Excel.");
    };
}

/* --------------------------------------------------------------- rendu grille */

function paint(app) {
    const { data, layer } = app;
    const scores = buildMatrixScores(data, layer);
    const grid = $("#matrix-grid");
    const query = view.query.toLowerCase();

    $("#platform-count").textContent = view.platforms.size === data.platforms.length
        ? "tout" : String(view.platforms.size);

    // Une mitigation peut ne viser qu'une sous-technique : on surligne alors
    // aussi la technique parente, sinon la case visible resterait éteinte.
    let highlighted = null;
    if (view.highlight) {
        highlighted = new Set(data.mitigationById.get(view.highlight)?.techniques ?? []);
        for (const id of [...highlighted]) highlighted.add(String(id).split(".")[0]);
    }

    grid.style.gridTemplateColumns = `repeat(${data.tactics.length}, minmax(146px, 1fr))`;
    grid.innerHTML = "";

    let visibleTotal = 0;

    for (const tactic of data.tactics) {
        const all = data.byTactic.get(tactic.shortname) || [];
        const shown = all.filter(t => matchesPlatform(t));
        visibleTotal += shown.length;

        const column = document.createElement("div");
        column.className = "tactic-col";

        const scored = shown.filter(t => scores.get(t.id)?.state === CELL_STATE.SCORED).length;
        const pct = shown.length ? Math.round((scored / shown.length) * 100) : 0;

        const head = document.createElement("div");
        head.className = "tactic-head";
        head.innerHTML = `
            <div class="t-name">${esc(tactic.name)}</div>
            <div class="t-meta">${shown.length}${shown.length !== all.length ? `/${all.length}` : ""} techniques · ${scored} évaluées</div>
            <div class="t-bar"><span style="width:${pct}%"></span></div>`;
        head.title = `${tactic.id} — ${tactic.name}`;
        column.appendChild(head);

        for (const tech of shown) {
            column.appendChild(cellFor(app, tech, scores, query, highlighted));

            if (view.showSubs && tech.subs.length) {
                const box = document.createElement("div");
                box.className = "subs";
                for (const sub of tech.subs) {
                    if (!matchesPlatform(sub)) continue;
                    box.appendChild(cellFor(app, sub, scores, query, highlighted, true));
                }
                if (box.children.length) column.appendChild(box);
            }
        }

        grid.appendChild(column);
    }

    if (visibleTotal === 0) {
        grid.innerHTML = `<div class="matrix-empty" style="grid-column:1/-1;">
            Aucune technique ne correspond au filtre de plateformes.
        </div>`;
    }
}

const matchesPlatform = tech =>
    tech.platforms.length === 0 || tech.platforms.some(p => view.platforms.has(p));

function cellFor(app, tech, scores, query, highlighted, isSub = false) {
    // Une sous-technique hérite de l'état de sa parente : la notation se fait
    // au niveau des mitigations, qui sont rattachées à la technique parente.
    const parentId = isSub ? String(tech.id).split(".")[0] : tech.id;
    const cell = scores.get(parentId);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell" + (isSub ? " sub" : "");
    button.dataset.tech = tech.id;

    if (cell?.state === CELL_STATE.NO_MITIGATION) {
        button.classList.add("no-mitigation");
    } else if (cell?.state === CELL_STATE.SCORED) {
        button.classList.add(`lvl-${cell.level}`);
    } else {
        button.classList.add("unscored");
    }

    if (highlighted) {
        if (highlighted.has(tech.id)) button.classList.add("highlighted");
        else button.classList.add("dimmed");
    }

    if (query && (tech.id.toLowerCase().includes(query) || tech.name.toLowerCase().includes(query))) {
        button.classList.add("match");
    }

    const score = cell?.state === CELL_STATE.SCORED
        ? `<span class="c-score">${formatScore(cell.score)}</span>` : "";
    const subs = !isSub && tech.subs.length && !view.showSubs
        ? `<span class="c-subs">${tech.subs.length}▾</span>` : "";

    button.innerHTML = `<span class="c-id">${esc(tech.id)}</span> ${score}${subs}
        <span class="c-name">${esc(tech.name)}</span>`;
    button.title = `${tech.id} — ${tech.name}`;
    button.onclick = () => openTechnique(app, tech, scores);
    return button;
}

const formatScore = n => Number.isInteger(n) ? String(n) : n.toFixed(1);

/* ------------------------------------------------- modale d'une technique */

function openTechnique(app, tech, scores) {
    const { data, layer } = app;
    const parentId = String(tech.id).split(".")[0];
    const cell = scores.get(parentId);
    const levels = mitigationLevels(layer);

    const stateTag = cell?.state === CELL_STATE.NO_MITIGATION
        ? `<span class="tag">Aucune mitigation ATT&amp;CK</span>`
        : cell?.state === CELL_STATE.SCORED
            ? `<span class="tag score">Score ${formatScore(cell.score)} / 4 · ${esc(LEVEL_LABELS[cell.level])}</span>`
            : `<span class="tag">Non évaluée</span>`;

    const mitigationRows = (cell?.mitigations ?? []).map(({ id, level }) => {
        const m = data.mitigationById.get(id);
        if (!m) return "";
        const available = !!getQuestionnaire(id);
        return `
            <li class="mit-row">
                <span class="m-lvl ${level !== null ? `l${Math.round(level)}` : ""}">${level !== null ? formatScore(level) : "—"}</span>
                <span class="m-id">${esc(id)}</span>
                <span class="m-name">${esc(m.name)}</span>
                ${available
                    ? `<button class="btn btn-sm" data-edit="${esc(id)}">${level !== null ? "Modifier ma réponse" : "Répondre"}</button>`
                    : `<span class="tag" title="Questionnaire pas encore intégré">à venir</span>`}
            </li>`;
    }).join("");

    const notes = (cell?.mitigations ?? [])
        .map(({ id, level }) => {
            const questionnaire = getQuestionnaire(id);
            if (!questionnaire || level === null) return "";
            const rounded = Math.round(level);

            // Les outils saisis pendant le questionnaire remontent ici : c'est
            // là qu'on veut savoir avec quoi la mitigation est mise en œuvre.
            const entries = layer.answers[id] || {};
            const tools = [...new Set(
                questionnaire.questions.map(q => entries[q.num]?.tool).filter(Boolean)
            )];

            return `
                <div class="mit-note">
                    <div class="n-head">
                        <span class="m-lvl l${rounded}" style="width:20px;height:20px;border-radius:4px;display:inline-grid;place-items:center;font-size:0.65rem;font-weight:700;">${formatScore(level)}</span>
                        <b>${esc(id)}</b> ${esc(questionnaire.name)}
                    </div>
                    <div class="n-bareme">${esc(questionnaire.bareme[rounded])}</div>
                    ${tools.length
                        ? `<div class="n-tools"><span class="n-tools-label">Outils</span>
                             ${tools.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`
                        : ""}
                    <div class="n-desc">${esc(questionnaire.description)}</div>
                </div>`;
        })
        .filter(Boolean)
        .join("");

    const panel = openModal(`
        <div class="modal-head">
            <h3 style="margin:0;font-size:1.05rem;">${esc(tech.id)} — ${esc(tech.name)}</h3>
            <div class="tech-meta">
                ${stateTag}
                ${tech.platforms.map(p => `<span class="tag">${esc(p)}</span>`).join("")}
            </div>
        </div>
        <div class="modal-body">
            <div class="tech-desc">${esc(tech.description).replace(/\n+/g, "<br><br>")}</div>

            <div class="panel-cols">
                <div>
                    <h4>Mitigations associées (${cell?.mitigations?.length ?? 0})</h4>
                    ${mitigationRows
                        ? `<ul class="mit-list">${mitigationRows}</ul>`
                        : `<p style="font-size:0.76rem;color:var(--text-mute);margin:0;line-height:1.5;">
                             Aucune mitigation ATT&amp;CK ne couvre cette technique. Elle relève d'autres
                             leviers : détection, durcissement d'architecture, ou acceptation du risque.
                           </p>`}
                </div>
                <div>
                    <h4>Sous-techniques (${tech.subs?.length ?? 0})</h4>
                    ${tech.subs?.length
                        ? `<ul class="sub-list">${tech.subs.map(s =>
                              `<li><span class="s-id">${esc(s.id)}</span> ${esc(s.name)}</li>`).join("")}</ul>`
                        : `<p style="font-size:0.76rem;color:var(--text-mute);margin:0;">Aucune.</p>`}
                </div>
            </div>

            ${notes ? `<div class="mit-notes"><h4 style="margin:22px 0 9px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-mute);">Notes de mitigation</h4>${notes}</div>` : ""}

            <div class="panel-foot">
                <span class="grow">ATT&amp;CK Enterprise v${esc(data.version)}</span>
                <a class="btn btn-sm" href="${esc(tech.url)}" target="_blank" rel="noopener">Fiche MITRE ↗</a>
            </div>
        </div>`, { wide: true });

    panel.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = () => {
            const id = button.dataset.edit;
            closeModal();
            app.show("quiz", { mitigation: id });
        };
    });
}

/** Rafraîchit la matrice si elle est déjà construite (retour du questionnaire). */
export function repaintMatrix(app) {
    if ($("#matrix-grid")) {
        refreshMitigationLabels(app);
        paint(app);
    }
}

/** Remet les filtres à zéro : appelé quand on change de layer. */
export function resetMatrixView() {
    view.query = "";
    view.highlight = "";
    view.showSubs = false;
    view.platformsReady = false;
}
