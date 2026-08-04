/* ============================================================================
   Le questionnaire.

   Parcours progressif : on passe à la question suivante si la réponse est
   « Oui », un « Non » clôt la mitigation. « N/A » ne bloque pas — la question
   sort du périmètre du répondant sans interrompre la progression.

   Seule M1032 est renseignée pour l'instant ; la vue parcourt n'importe quel
   nombre de mitigations du catalogue.
   ========================================================================= */

import { esc, $, toast } from "../ui.js";
import { QUESTIONNAIRES, LEVEL_LABELS, getQuestionnaire } from "../catalog.js";
import { resolvedEntries, sharedText, sharedWith } from "../shared-questions.js";
import { mitigationLevel } from "../scoring.js";
import { setAnswer, progress, questionnaireState, nextTarget, reviewTarget, acquiredMitigations } from "../layer.js";

/** Position courante dans le questionnaire. */
const cursor = { mitigation: null, index: 0, showResult: false };

/** Repart de zéro : appelé quand on charge ou crée un autre layer. */
export function resetQuiz() {
    cursor.mitigation = null;
    cursor.index = 0;
    cursor.showResult = false;
}

export function renderQuiz(app, { mitigation } = {}) {
    if (!QUESTIONNAIRES.size) {
        $("#view-quiz").innerHTML = `<div class="quiz-inner"><p class="matrix-empty">
            Aucun questionnaire n'est encore intégré.</p></div>`;
        return;
    }

    if (mitigation && QUESTIONNAIRES.has(mitigation)) {
        // Arrivée depuis « Modifier ma réponse » : on ouvre la mitigation visée
        // au début de son questionnaire.
        goTo(mitigation, 0);
        paint(app);
        return;
    }

    // Première passe : la prochaine mitigation à traiter, jamais ouverte en
    // priorité. Une fois tout traité, on repart du début du catalogue pour une
    // passe de relecture, en ne s'arrêtant que sur les « Non ».
    const target = nextTarget(app.layer) || reviewTarget(app.layer);

    if (target) {
        goTo(target.mitigation, indexOfQuestion(target.mitigation, target.question));
    } else {
        // Tout est traité et rien ne mérite relecture.
        paintNothingToReview(app);
        return;
    }

    paint(app);
}

function goTo(mitigationId, index, showResult = false) {
    cursor.mitigation = mitigationId;
    cursor.index = Math.max(0, index);
    cursor.showResult = showResult;
}

function indexOfQuestion(mitigationId, num) {
    const questions = getQuestionnaire(mitigationId).questions;
    const i = questions.findIndex(q => q.num === num);
    return i < 0 ? 0 : i;
}

/**
 * Tout est traité et aucune mitigation n'est bloquée sur un « Non » : il n'y a
 * rien à relire ici. On oriente vers la matrice, seul endroit d'où l'on peut
 * revenir sur un « Oui », en passant par la technique concernée.
 */
function paintNothingToReview(app) {
    const acquired = acquiredMitigations(app.layer);

    $("#view-quiz").innerHTML = `
        <div class="quiz-inner">
            <div class="quiz-result">
                <div class="result-badge" style="background:var(--lvl4);color:var(--lvl4-ink);">✓</div>
                <h2 class="quiz-title">Rien à revoir</h2>
                <p class="result-text">
                    Les ${acquired.length} mitigation${acquired.length > 1 ? "s" : ""} du questionnaire
                    ${acquired.length > 1 ? "sont terminées" : "est terminée"} sans aucun « Non » :
                    il n'y a pas de point de blocage à reprendre.
                </p>
                <p class="result-text" style="font-size:0.78rem;color:var(--text-mute);">
                    Pour revenir sur une réponse « Oui », ouvrez la technique concernée dans la
                    matrice et utilisez « Modifier ma réponse ».
                </p>
                <div class="result-actions">
                    <button class="btn btn-primary" id="r-matrix">Voir la matrice</button>
                </div>
            </div>
        </div>`;

    $("#r-matrix").onclick = () => app.show("matrix");
}

/* -------------------------------------------------------------------- rendu */

function paint(app) {
    const { layer } = app;
    const questionnaire = getQuestionnaire(cursor.mitigation);
    const entries = resolvedEntries(layer, cursor.mitigation);
    const level = mitigationLevel(questionnaire, entries, layer.scoring, layer);

    if (cursor.showResult) { paintResult(app, questionnaire, level ?? 0); return; }

    const total = questionnaire.questions.length;
    const question = questionnaire.questions[cursor.index];
    const entry = entries[question.num];
    const answered = entry?.value ?? null;
    const pct = Math.round((cursor.index / total) * 100);
    const global = progress(layer);

    $("#view-quiz").innerHTML = `
        <div class="quiz-inner">
            <div class="quiz-topbar">
                <div class="quiz-tag">${esc(questionnaire.id)}</div>
                <h2 class="quiz-title">${esc(questionnaire.name)}</h2>
                <p class="quiz-desc">${esc(questionnaire.description)}</p>
                ${contributionNotice(app.layer, questionnaire)}
            </div>

            <div class="level-track">${levelTrack(level ?? 0, question.level)}</div>
            <p class="track-caption">
                Niveaux acquis en plein · cerclé : le niveau que vise la question affichée
            </p>

            <div class="quiz-progress">
                <div class="quiz-progress-label">
                    Question ${cursor.index + 1} / ${total}
                    · ${global.completeMitigations}/${global.mitigations} mitigation${global.mitigations > 1 ? "s" : ""} traitée${global.completeMitigations > 1 ? "s" : ""}
                </div>
                <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
            </div>

            <div class="quiz-card level-${question.level}">
                <div class="quiz-card-level">
                    Niveau visé : <b>${question.level} — ${esc(LEVEL_LABELS[question.level])}</b>
                    ${question.docRequired ? ' · <span class="doc-flag">preuve documentaire attendue</span>' : ""}
                </div>
                <p class="quiz-question">${esc(sharedText(questionnaire.id, question.num) ?? question.text)}</p>
                ${sharedNotice(questionnaire.id, question.num)}

                <div class="quiz-answers">
                    <button class="quiz-answer yes ${answered === "Oui" ? "selected" : ""}" data-answer="Oui">Oui</button>
                    <button class="quiz-answer no ${answered === "Non" ? "selected" : ""}" data-answer="Non">Non</button>
                    <button class="quiz-answer na ${answered === "N/A" ? "selected" : ""}" data-answer="N/A">N/A</button>
                </div>

                <div class="quiz-tool">
                    <label for="q-tool">Outil en place, si applicable</label>
                    <input type="text" id="q-tool" value="${esc(entry?.tool || "")}"
                           placeholder="ex : Entra ID, Duo, PingID…" autocomplete="off">
                    <span class="help">Repris dans la fiche de la mitigation, dans le récapitulatif
                        de fin de questionnaire et dans l'export (colonne « Outil »).</span>
                </div>

                <div class="quiz-refs">Réf. ${esc(question.references)}</div>
            </div>

            <div class="quiz-nav">
                <button class="btn btn-ghost" id="q-back" ${cursor.index === 0 ? "disabled" : ""}>← Précédent</button>
                <span class="grow"></span>
                ${answered ? `<button class="btn btn-sm" id="q-next">Suivant →</button>` : ""}
                <button class="btn btn-sm" id="q-matrix">Voir la matrice</button>
            </div>
        </div>`;

    for (const button of document.querySelectorAll("[data-answer]")) {
        button.onclick = () => answer(app, button.dataset.answer);
    }
    // On enregistre l'outil dès la frappe : sinon quitter la question par un
    // clic sur « Oui » perdrait la saisie en cours.
    $("#q-tool").oninput = e => {
        setAnswer(app.layer, cursor.mitigation, question.num, { tool: e.target.value.trim() });
    };
    $("#q-back").onclick = () => { if (cursor.index > 0) { cursor.index--; paint(app); } };
    const next = $("#q-next");                 // rendu seulement si la question a une réponse
    if (next) next.onclick = () => advance(app);
    $("#q-matrix").onclick = () => app.show("matrix");
}

/** Signale qu'une question est commune à d'autres mitigations. */
function sharedNotice(mitigationId, num) {
    const others = sharedWith(mitigationId, num);
    if (!others.length) return "";

    return `<p class="quiz-shared">
        <span class="quiz-shared-icon" aria-hidden="true">⇄</span>
        Même question que ${others.map(id => `<b>${esc(id)}</b>`).join(" et ")}
    </p>`;
}

/**
 * Signale qu'une note dépend aussi d'une question posée dans une autre
 * mitigation, et où en est cette réponse.
 */
function contributionNotice(layer, questionnaire) {
    if (!questionnaire.contributions?.length) return "";

    const parts = questionnaire.contributions.map(({ from, question, weight }) => {
        const value = resolvedEntries(layer, from)[question]?.value;
        const effect = value === "Oui" ? `+${weight}`
            : value === "Non" ? `−${weight}`
                : value ? "sans effet" : "pas encore répondue";
        return `<b>${esc(from)}</b> question ${question} (±${weight}) — ${esc(effect)}`;
    });

    return `<p class="quiz-link">Cette note dépend aussi de : ${parts.join(" · ")}</p>`;
}

/**
 * Frise des cinq niveaux : les paliers acquis sont pleins, et le palier visé
 * par la question affichée est cerclé — c'est ce repère qui suit la navigation.
 */
function levelTrack(attained, currentLevel = null) {
    const reached = Math.round(attained);
    return LEVEL_LABELS.map((label, i) => {
        const classes = ["level-dot", `lvl${i}`];
        if (i <= reached) classes.push("on");
        if (i === currentLevel) classes.push("current");
        else if (currentLevel === null && i === reached) classes.push("current");
        return `<div class="${classes.join(" ")}" title="${esc(label)}">${i}</div>`;
    }).join("");
}

/* ------------------------------------------------------------------ réponses */

function answer(app, value) {
    const questionnaire = getQuestionnaire(cursor.mitigation);
    const question = questionnaire.questions[cursor.index];

    const wasAnswered = resolvedEntries(app.layer, cursor.mitigation)[question.num]?.value ?? null;
    const dropped = setAnswer(app.layer, cursor.mitigation, question.num, {
        value,
        tool: $("#q-tool")?.value.trim() ?? "",
    });
    app.onLayerChange();

    // Modifier une réponse commune se répercute ailleurs : on le dit, sinon la
    // note d'une autre mitigation bougerait sans explication.
    const others = sharedWith(cursor.mitigation, question.num);
    if (others.length && wasAnswered && wasAnswered !== value) {
        toast(`Réponse commune modifiée : ${others.join(", ")} ${others.length > 1 ? "sont" : "est"} aussi concernée${others.length > 1 ? "s" : ""}.`);
    }

    // Un « Non » clôt la mitigation : c'est la règle du parcours progressif.
    if (value === "Non") {
        if (dropped) {
            toast(`${dropped} réponse${dropped > 1 ? "s" : ""} suivante${dropped > 1 ? "s" : ""} effacée${dropped > 1 ? "s" : ""} : le parcours s'arrête ici.`);
        }
        cursor.showResult = true;
        paint(app);
        return;
    }

    advance(app);
}

function advance(app) {
    const questionnaire = getQuestionnaire(cursor.mitigation);
    if (cursor.index + 1 >= questionnaire.questions.length) cursor.showResult = true;
    else cursor.index++;
    paint(app);
}

/* ------------------------------------------------------------------ résultat */

/**
 * Actions de fin de mitigation.
 *
 * Sur un parcours de 43 mitigations, l'action dominante est d'enchaîner : elle
 * est seule à être mise en avant, et annonce ce qui vient pour que le répondant
 * sache où il va. Revoir ses réponses et aller à la matrice restent des
 * échappatoires, discrètes. Quand il n'y a plus rien à enchaîner, c'est la
 * matrice qui devient l'action principale.
 */
function resultActions(app, global, target) {
    const secondary = `<button class="btn btn-ghost btn-sm" id="r-review">Revoir mes réponses</button>`;

    if (!target) {
        return `<div class="result-actions">
            <div class="result-secondary">${secondary}</div>
            <button class="btn btn-primary btn-lg" id="r-matrix">
                <span class="rn-label">Voir la matrice</span>
                <span class="rn-target">Tout est traité</span>
            </button>
        </div>`;
    }

    const next = getQuestionnaire(target.mitigation);
    const label = global.complete ? "Point de blocage suivant" : "Mitigation suivante";

    return `<div class="result-actions">
        <div class="result-secondary">
            ${secondary}
            <button class="btn btn-ghost btn-sm" id="r-matrix">Voir la matrice</button>
        </div>
        <button class="btn btn-primary btn-lg" id="r-next">
            <span class="rn-label">${label} →</span>
            <span class="rn-target">${esc(target.mitigation)} · ${esc(next.name)}</span>
        </button>
    </div>`;
}

function paintResult(app, questionnaire, level) {
    const rounded = Math.round(level);
    const global = progress(app.layer);
    const entries = resolvedEntries(app.layer, questionnaire.id);
    const state = questionnaireState(questionnaire, entries);
    // En première passe, la prochaine mitigation à traiter. Une fois tout
    // traité, le prochain point de blocage à relire, en repartant après
    // celle-ci pour ne pas la reproposer.
    const target = nextTarget(app.layer) || reviewTarget(app.layer, questionnaire.id);

    // Les outils cités pendant le questionnaire, rendus visibles ici : c'est le
    // premier endroit où le répondant les retrouve après les avoir saisis.
    const tools = questionnaire.questions
        .map(q => ({ num: q.num, tool: entries[q.num]?.tool }))
        .filter(x => x.tool);

    // Le cadrage demande un aperçu de la matrice tous les cinq questionnaires
    // terminés, pour entretenir la motivation sur un parcours long.
    const milestone = global.completeMitigations > 0 && global.completeMitigations % 5 === 0;

    $("#view-quiz").innerHTML = `
        <div class="quiz-inner">
            <div class="quiz-result level-${rounded}">
                <div class="quiz-tag">${esc(questionnaire.id)}</div>
                <div class="result-badge">${level % 1 === 0 ? level : level.toFixed(1)}</div>
                <div class="result-level-name">Niveau ${rounded} · ${esc(LEVEL_LABELS[rounded])}</div>
                <h2 class="quiz-title" style="margin-top:10px;">${esc(questionnaire.name)}</h2>
                <p class="result-text">${esc(questionnaire.bareme[rounded])}</p>

                <div class="level-track">${levelTrack(level)}</div>

                <p class="result-text" style="font-size:0.78rem;color:var(--text-mute);">
                    ${state.answered} question${state.answered > 1 ? "s" : ""} répondue${state.answered > 1 ? "s" : ""}
                    sur ${questionnaire.questions.length}${state.complete && state.answered < questionnaire.questions.length
                        ? " — le parcours s'est arrêté sur un « Non »" : ""}
                    · ${global.completeMitigations}/${global.mitigations} mitigation${global.mitigations > 1 ? "s" : ""} traitée${global.completeMitigations > 1 ? "s" : ""}
                    ${milestone ? "<br>Bon moment pour aller voir la matrice se remplir." : ""}
                </p>

                ${tools.length ? `
                    <div class="tool-recap">
                        <h4>Outils cités</h4>
                        <ul>${tools.map(t =>
                            `<li><span class="t-q">Q${t.num}</span> ${esc(t.tool)}</li>`).join("")}</ul>
                    </div>` : ""}

                ${resultActions(app, global, target)}
            </div>
        </div>`;

    $("#r-review").onclick = () => { cursor.showResult = false; cursor.index = 0; paint(app); };
    $("#r-matrix").onclick = () => app.show("matrix");

    const nextButton = $("#r-next");
    if (nextButton) nextButton.onclick = () => {
        goTo(target.mitigation, indexOfQuestion(target.mitigation, target.question));
        paint(app);
        toast(`Mitigation ${target.mitigation}`);
    };
}
