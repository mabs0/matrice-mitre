/* ============================================================================
   Page d'accueil.

   Deux entrées, comme le demande le cadrage :
     - Nouveau layer          -> démarre le questionnaire
     - Ouvrir un layer existant -> importe un JSON ou un Excel, puis reprend
       à la première question non répondue (ou va droit à la matrice si tout
       est complété)
   ========================================================================= */

import { esc, $, toast, openModal, closeModal } from "../ui.js";
import { createLayer, nextTarget, progress } from "../layer.js";
import { readLayerFile, isEncrypted } from "../io.js";
import { rosace, matrixBackdrop } from "./home-visuals.js";

/* Les deux entrées portaient un losange plein et un losange vide. Côte à côte,
   ces deux états d'un même signe se lisent comme « sélectionné » et « non
   sélectionné » — alors que ce sont deux actions distinctes, dont aucune n'est
   un choix déjà fait. Deux dessins sans rapport l'un avec l'autre lèvent
   l'ambiguïté : on crée d'un côté, on ouvre de l'autre. */
const GLYPH_NEW = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" stroke-width="1.6"/>
        <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

const GLYPH_OPEN = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 15.5V4m0 0L8.2 7.8M12 4l3.8 3.8" stroke="currentColor" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4.5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor"
              stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

/**
 * Emplacement du compteur de fréquentation.
 *
 * Il prend la place du bandeau de version, qui redisait ce que porte déjà le
 * badge en haut à droite. La valeur n'est pas affichée tant qu'aucune source ne
 * l'alimente : un chiffre inventé sur une page publique se lit comme un chiffre
 * vrai. Brancher une source revient à écrire le nombre dans `#home-visitors`.
 */
function visitorSlot() {
    return `<p class="home-visitors" id="home-visitors" hidden><b></b> visiteurs ce mois-ci</p>`;
}

export function renderHome(app) {
    const { data } = app;

    $("#view-home").innerHTML = `
        ${matrixBackdrop(data)}
        <div class="home-inner">
            <div class="home-first">
                <div class="home-hero">
                    ${visitorSlot()}
                    <h1>Évaluez la <em>maturité cyber</em> de votre organisation<br>sur la matrice MITRE ATT&amp;CK</h1>
                    <p class="home-lead">
                        L'outil s'appuie sur les ${data.counts.mitigations} mesures d'atténuation d'ATT&amp;CK Enterprise.
                        Chacune est notée de 0 à 4 sur une échelle inspirée du CMMI et de l'échelle SSI de l'ANSSI.
                        Le résultat colore la matrice et donne une cartographie de votre couverture défensive.
                    </p>
                    ${rosace(data)}
                </div>

                <div class="home-actions">
                    <div class="action-card">
                        <span class="glyph">${GLYPH_NEW}</span>
                        <h2>Nouveau layer</h2>
                        <p>
                            Démarrez une évaluation vierge et répondez au questionnaire mitigation par
                            mitigation. La matrice se remplit au fil des réponses.
                        </p>
                        <button class="btn btn-primary" id="home-new">Créer un layer</button>
                    </div>

                    <div class="action-card">
                        <span class="glyph">${GLYPH_OPEN}</span>
                        <h2>Ouvrir un layer existant</h2>
                        <p>
                            Reprenez une évaluation en important son fichier. On repart à la première
                            question sans réponse, ou droit à la matrice si tout est renseigné.
                        </p>
                        <div class="drop-zone" id="home-drop">
                            <b>Choisir un fichier</b> ou le déposer ici<br>
                            un fichier exporté par cet outil, JSON ou Excel
                        </div>
                        <input type="file" id="home-file" class="sr-only" accept=".json,.xlsx,.xls">
                    </div>
                </div>
            </div>

            <div class="home-figures">
                <div class="figure"><span class="v">${data.counts.mitigations}</span><span class="k">mitigations</span></div>
                <div class="figure"><span class="v">${data.counts.techniques}</span><span class="k">techniques</span></div>
                <div class="figure"><span class="v">${data.counts.subTechniques}</span><span class="k">sous-techniques</span></div>
            </div>

            <ol class="home-steps">
                <li class="step">
                    <span class="step-num">1</span>
                    <h3>Questionnaire</h3>
                    <p>
                        Le nombre de questions s'adapte à votre organisation : un « Oui » fait avancer,
                        un « Non » clôt la mitigation et fixe sa note.
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
        // Les messages sont déjà écrits pour être lus tels quels : le détail
        // technique part en console, côté io.js et excel.js.
        toast(`Import impossible — ${err.message}.`, "error");
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
                    « ${esc(file.name)} » a été exporté avec une clé. Saisissez-la pour l'ouvrir.
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
