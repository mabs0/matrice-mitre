/* ============================================================================
   Page d'accueil.

   Deux entrées, comme le demande le cadrage :
     - Nouveau layer          -> démarre le questionnaire
     - Ouvrir un layer existant -> importe un JSON ou un Excel, puis reprend
       à la première question non répondue (ou va droit à la matrice si tout
       est complété)
   ========================================================================= */

import { esc, $, toast, openModal, closeModal } from "../ui.js";
import { totalQuestions, QUESTIONNAIRES } from "../catalog.js";
import { savedQuestions } from "../shared-questions.js";
import { createLayer, nextTarget, progress } from "../layer.js";
import { readLayerFile, isEncrypted } from "../io.js";
import { rosace, matrixBackdrop } from "./home-visuals.js";

export function renderHome(app) {
    const { data } = app;
    // Les questions communes à plusieurs mitigations ne sont posées qu'une fois :
    // c'est ce nombre-là qu'il faut annoncer, pas le total du classeur.
    const catalogQuestions = totalQuestions() - savedQuestions();

    $("#view-home").innerHTML = `
        ${matrixBackdrop(data)}
        <div class="home-inner">
            <div class="home-hero">
                <div class="hero-text">
                    <span class="home-eyebrow">
                        MITRE ATT&amp;CK Enterprise <b>v${esc(data.version)}</b><span class="eb-long"> · relu à chaque chargement</span>
                    </span>
                    <h1>Évaluez la <em>maturité cyber</em> de votre organisation<br>sur la matrice MITRE ATT&amp;CK</h1>
                    <p class="home-lead">
                        L'outil s'appuie sur les ${data.counts.mitigations} mesures d'atténuation d'ATT&amp;CK Enterprise.
                        Chacune est notée de 0 à 4 sur une échelle inspirée du CMMI et de l'échelle SSI de l'ANSSI,
                        à partir d'un questionnaire progressif. Le résultat colore la matrice et donne
                        une cartographie de votre couverture défensive.
                    </p>
                </div>
                ${rosace()}
            </div>

            <div class="home-actions">
                <div class="action-card primary">
                    <span class="glyph">◆</span>
                    <h2>Nouveau layer</h2>
                    <p>
                        Démarrez une évaluation vierge et répondez au questionnaire mitigation par mitigation.
                        L'avancement s'affiche en continu et la matrice se remplit au fil des réponses.
                    </p>
                    <button class="btn btn-primary" id="home-new">Créer un layer</button>
                </div>

                <div class="action-card">
                    <span class="glyph">◇</span>
                    <h2>Ouvrir un layer existant</h2>
                    <p>
                        Reprenez une évaluation en important son fichier. Si toutes les questions sont
                        déjà renseignées, la matrice s'affiche directement ; sinon on reprend à la
                        première question sans réponse.
                    </p>
                    <div class="drop-zone" id="home-drop">
                        <b>Choisir un fichier</b> ou le déposer ici<br>
                        un fichier exporté par cet outil, JSON ou Excel
                    </div>
                    <input type="file" id="home-file" class="sr-only" accept=".json,.xlsx,.xls">
                </div>
            </div>

            <div class="home-stats">
                <div class="stat"><span class="v">${data.counts.mitigations}</span><span class="k">mitigations</span></div>
                <div class="stat"><span class="v">${data.counts.techniques}</span><span class="k">techniques</span></div>
                <div class="stat"><span class="v">${data.counts.subTechniques}</span><span class="k">sous-techniques</span></div>
            </div>

            <ol class="home-steps">
                <li class="step">
                    <span class="step-num">1</span>
                    <h3>Questionnaire</h3>
                    <p>
                        ${catalogQuestions} questions progressives sur ${QUESTIONNAIRES.size} mitigations.
                        Un « Oui » fait avancer, un « Non » clôt la mitigation et fixe sa note.
                    </p>
                </li>
                <li class="step">
                    <span class="step-num">2</span>
                    <h3>Matrice</h3>
                    <p>
                        Les notes remontent sur les ${data.counts.techniques} techniques
                        d'ATT&amp;CK Enterprise et colorent chaque case de 0 à 4.
                    </p>
                </li>
                <li class="step">
                    <span class="step-num">3</span>
                    <h3>Export</h3>
                    <p>
                        JSON chiffré ou classeur Excel. C'est ce fichier qui conserve
                        l'évaluation et permet de la reprendre plus tard.
                    </p>
                </li>
            </ol>

            <div class="home-secondary">
                <button class="btn btn-ghost" id="home-explore">Explorer la matrice sans évaluation →</button>
            </div>

            <p class="home-foot">Données tirées de MITRE ATT&amp;CK</p>
        </div>`;

    $("#home-new").onclick = () => promptNewLayer(app);
    $("#home-explore").onclick = () => {
        if (!app.layer) app.setLayer(createLayer({ name: "Exploration", attackVersion: data.version }));
        app.show("matrix");
    };

    /* --- import : bouton, glisser-déposer --- */
    const drop = $("#home-drop");
    const input = $("#home-file");

    drop.onclick = () => input.click();
    // On ne vide le champ qu'une fois l'import terminé : le remettre à zéro
    // pendant les `await` libère le File sélectionné, et sa lecture échoue.
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        try { await importFile(app, file); } finally { input.value = ""; }
    };

    for (const type of ["dragenter", "dragover"]) {
        drop.addEventListener(type, e => { e.preventDefault(); drop.classList.add("hover"); });
    }
    for (const type of ["dragleave", "drop"]) {
        drop.addEventListener(type, e => { e.preventDefault(); drop.classList.remove("hover"); });
    }
    drop.addEventListener("drop", e => {
        const file = e.dataTransfer?.files?.[0];
        if (file) importFile(app, file);
    });
}

/* ------------------------------------------------------- création d'un layer */

function promptNewLayer(app) {
    // Le modèle du layer porte toujours un répondant et une organisation, et
    // l'export les reprend : ils ne sont simplement plus demandés au départ.
    openModal(`
        <div class="modal-head">
            <h3 style="margin:0;font-size:1.02rem;">Nouveau layer</h3>
            <p style="margin:6px 0 0;font-size:0.76rem;color:var(--text-dim);line-height:1.5;">
                Un nom pour retrouver cette évaluation dans ses fichiers.
            </p>
        </div>
        <div class="modal-body">
            <div class="field">
                <label for="nl-name">Nom du layer</label>
                <input type="text" id="nl-name" value="Évaluation ${new Date().getFullYear()}" autocomplete="off">
            </div>
            <div class="form-actions">
                <button class="btn" id="nl-cancel">Annuler</button>
                <button class="btn btn-primary" id="nl-ok">Démarrer le questionnaire</button>
            </div>
        </div>`);

    $("#nl-name").select();
    $("#nl-cancel").onclick = closeModal;
    $("#nl-ok").onclick = () => {
        const layer = createLayer({
            name: $("#nl-name").value,
            attackVersion: app.data.version,
        });
        closeModal();
        app.setLayer(layer);
        app.show("quiz");
    };
}

/* ------------------------------------------------------------------ import */

async function importFile(app, file) {
    try {
        // Un JSON chiffré porte un en-tête reconnaissable : on demande la clé
        // avant de tenter la lecture, plutôt que d'échouer sur un message obscur.
        const layer = (await isEncrypted(file))
            ? await readEncrypted(file)
            : await readLayerFile(file);
        if (!layer) return;                 // demande de clé annulée
        layer.attackVersion ||= app.data.version;
        app.setLayer(layer);

        const state = progress(layer);
        const next = nextTarget(layer);

        if (!next) {
            toast(`« ${layer.name} » importé — questionnaire complet.`);
            app.show("matrix");
            return;
        }

        layer.cursor = next;
        toast(`« ${layer.name} » importé — ${state.completeMitigations}/${state.mitigations} mitigations traitées, reprise en cours.`);
        app.show("quiz");
    } catch (err) {
        toast(`Import impossible : ${err.message}`, "error");
    }
}

/**
 * Demande la clé de déchiffrement dans une modale, et laisse réessayer sur une
 * clé erronée sans avoir à re-sélectionner le fichier.
 * @returns {Promise<object|null>} null si l'utilisateur renonce
 */
function readEncrypted(file) {
    return new Promise(resolve => {
        const panel = openModal(`
            <div class="modal-head">
                <h3 style="margin:0;font-size:1.02rem;">Fichier chiffré</h3>
                <p style="margin:6px 0 0;font-size:0.76rem;color:var(--text-dim);line-height:1.5;">
                    « ${esc(file.name) }» a été exporté avec une clé. Saisissez-la pour l'ouvrir.
                </p>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label for="dec-pass">Clé de déchiffrement</label>
                    <input type="password" id="dec-pass" autocomplete="off">
                    <span class="help" id="dec-error" style="color:var(--danger);"></span>
                </div>
                <div class="form-actions">
                    <button class="btn" id="dec-cancel">Annuler</button>
                    <button class="btn btn-primary" id="dec-ok">Ouvrir</button>
                </div>
            </div>`);

        const input = panel.querySelector("#dec-pass");
        const error = panel.querySelector("#dec-error");
        input.focus();

        const attempt = async () => {
            error.textContent = "";
            try {
                const layer = await readLayerFile(file, input.value);
                closeModal();
                resolve(layer);
            } catch (err) {
                error.textContent = err.message;
                input.select();
            }
        };

        panel.querySelector("#dec-ok").onclick = attempt;
        input.onkeydown = e => { if (e.key === "Enter") attempt(); };
        panel.querySelector("#dec-cancel").onclick = () => { closeModal(); resolve(null); };
        panel.querySelector(".modal-close").onclick = () => { closeModal(); resolve(null); };
    });
}
