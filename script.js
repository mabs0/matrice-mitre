const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
let tactics = [], techniques = [], mitigations = [], relationships = [], allObjects = [];
let userScores = {};

const TACTIC_ORDER_IDS = {
    "tactic--ffd5bcee-6e16-4eb2-8eca-74c693332024": 1, "tactic--71073099-0604-460d-9e61-f4c079207e8e": 2,
    "tactic--78b23412-3273-455a-b605-728b94875080": 3, "tactic--5bc3d492-49da-411a-888e-7e9ca9813264": 4,
    "tactic--5373f782-9653-469b-8255-7fc75e9b7244": 5, "tactic--9a4da9b7-005d-4f01-9037-33e72e1e0a29": 6,
    "tactic--7865943d-c276-4d40-ba35-3006368d1358": 7, "tactic--20658760-449e-4e46-9d6e-8217f227b615": 8,
    "tactic--c6978df0-f81d-48ef-8232-15989104085f": 9, "tactic--5f68c785-5a2a-43cf-8700-1c3274291f09": 10,
    "tactic--03998da3-5b87-43c2-8418-5a415a953932": 11, "tactic--939f4019-338b-4a57-9d7a-d035e1d70e4e": 12,
    "tactic--7464e837-147b-4029-9e8c-55c3c0b0f719": 13, "tactic--77f2cc96-3e01-44a6-9810-74673629f63f": 14
};

// Extrait fidèle de docs/Mitigations MITRE ATT&CK v9.xlsx, onglet M1032.
// G=Niveau visé par la question, H=Preuve documentaire attendue, I=Références.
const mitigationDemo = {
    id: "M1032",
    name: "Multi-factor Authentication",
    description: "L'authentification multi-facteur (MFA) améliore la sécurité en exigeant que les utilisateurs fournissent au moins deux formes de vérification pour prouver leur identité avant de leur accorder l'accès.",
    bareme: [
        "Aucun mécanisme d'authentification à plusieurs facteurs en place.",
        "MFA activé de manière ponctuelle, sans politique claire ni cohérence globale.",
        "MFA appliqué sur des comptes critiques, avec une politique partielle.",
        "MFA obligatoire sur tous les comptes sensibles, avec processus formalisé et suivi.",
        "MFA adaptatif et contextuel, géré de façon centralisée, avec revues régulières et audit."
    ],
    questions: [
        { num: 1, level: 1, docRequired: false, references: "ISO 27002 8.2, 8.5, 5.17 ; NIST PR.AC-7, PR.AC-6",
          text: "Votre organisation applique-t-elle une authentification multi-facteurs (MFA) pour les comptes utilisateurs sensibles (administrateurs, comptes cloud, développeurs, etc.) ?" },
        { num: 2, level: 2, docRequired: false, references: "ISO 27002 8.3, 8.5 ; NIST PR.AC-5",
          text: "MFA est-il activé sur tous les services exposés à Internet (VPN, RDP, SaaS, Webmail, etc.) ?" },
        { num: 3, level: 2, docRequired: true, references: "ISO 27002 5.1, 5.16, 5.17 ; NIST PR.IP-1",
          text: "Une politique formelle d'authentification incluant le MFA est-elle définie et diffusée ?" },
        { num: 4, level: 3, docRequired: false, references: "ISO 27002 8.5 ; NIST PR.AC-7",
          text: "Le MFA repose-t-il sur au moins deux facteurs distincts conformes (ex : OTP + mot de passe, carte à puce, biométrie...) ?" },
        { num: 5, level: 3, docRequired: false, references: "ISO 27002 8.2, 8.3, 8.4 ; NIST PR.IP-11",
          text: "Le MFA est-il contextuel ou adaptatif (en fonction du rôle, du lieu, de l'état du terminal, etc.) ?" },
        { num: 6, level: 4, docRequired: true, references: "ISO 27002 5.36 ; NIST PR.IP-8",
          text: "L'organisation effectue-t-elle des revues régulières des activations/désactivations MFA ?" },
        { num: 7, level: 4, docRequired: false, references: "ISO 27002 8.15, 8.16 ; NIST DE.CM-7",
          text: "Des alertes sont-elles générées en cas d'échec MFA répété ou de contournement ?" }
    ]
};

let demoIndex = 0;
let demoAnswers = {};
let demoDone = false;

document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    const resp = await fetch(JSON_URL);
    const data = await resp.json();
    allObjects = data.objects;

    tactics = allObjects.filter(o => o.type === "x-mitre-tactic")
        .sort((a, b) => (TACTIC_ORDER_IDS[a.id] || 99) - (TACTIC_ORDER_IDS[b.id] || 99));
    
    techniques = allObjects.filter(o => 
        o.type === "attack-pattern" && o.x_mitre_is_subtechnique === false && 
        o.x_mitre_deprecated !== true && o.revoked !== true
    );
    
    mitigations = allObjects.filter(o => 
        o.type === "course-of-action" && o.x_mitre_deprecated !== true && o.revoked !== true
    );
    
    relationships = allObjects.filter(o => o.type === "relationship");

    initInterface();
}

function initInterface() {
    const sel = document.getElementById('mitigation-select');
    sel.innerHTML = '<option value="">Filtrer par Mitigation (Ordre ID)...</option>';
    
    // TRI PAR ID CROISSANT
    mitigations.sort((a, b) => {
        const idA = a.external_references?.[0]?.external_id || "";
        const idB = b.external_references?.[0]?.external_id || "";
        return idA.localeCompare(idB, undefined, { numeric: true });
    }).forEach(m => {
        let opt = document.createElement('option');
        opt.value = m.id;
        const mId = m.external_references?.[0]?.external_id || "M";
        opt.textContent = `[${mId}] ${m.name}`;
        sel.appendChild(opt);
    });
    
    sel.onchange = (e) => highlightMitigation(e.target.value);
    
    const modal = document.getElementById('tech-modal');
    document.querySelector('.close-btn').onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if(e.target == modal) modal.style.display = "none"; };
    document.onkeydown = (e) => { if(e.key === "Escape") modal.style.display = "none"; };

    renderMatrix(); renderQuiz();
}

function renderMatrix() {
    const cont = document.getElementById('matrix-container');
    cont.innerHTML = '';
    tactics.forEach(t => {
        const col = document.createElement('div');
        col.className = 'tactic-column';
        const techs = techniques.filter(tech => tech.kill_chain_phases?.some(p => p.phase_name === t.x_mitre_shortname));
        col.innerHTML = `<div class="tactic-header"><div>${t.name}</div><div class="tech-count">${techs.length} techniques</div></div>`;
        techs.forEach(tech => {
            const extId = tech.external_references[0].external_id;
            const cell = document.createElement('div');
            cell.className = 'technique-cell';
            cell.id = `tech-${tech.id}`;
            if(userScores[extId] !== undefined) {
                const s = userScores[extId];
                cell.classList.add(s >= 4 ? 'score-high' : s >= 2 ? 'score-med' : 'score-low');
            }
            cell.innerHTML = `<b>${extId}</b><br>${tech.name}`;
            cell.onclick = () => showTechDetails(tech);
            col.appendChild(cell);
        });
        cont.appendChild(col);
    });
}

function showTechDetails(tech) {
    const techId = tech.external_references[0].external_id;
    const subTechs = allObjects.filter(o => o.type === "attack-pattern" && o.x_mitre_is_subtechnique === true && o.external_references[0].external_id.startsWith(techId + "."));
    
    const assocMits = relationships.filter(r => r.relationship_type === "mitigates" && r.target_ref === tech.id)
        .map(r => allObjects.find(obj => obj.id === r.source_ref))
        .filter(m => m != null);

    document.getElementById('modal-body').innerHTML = `
        <h3>${techId} - ${tech.name}</h3><hr>
        <div style="font-size:0.8rem; margin-bottom:15px; background:#f9f9f9; padding:10px;">${tech.description || ""}</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.75rem;">
            <div><b>Sous-techniques:</b><ul>${subTechs.map(s => `<li><a href="${s.external_references[0].url}" target="_blank">${s.external_references[0].external_id}</a></li>`).join('') || "Aucune"}</ul></div>
            <div><b>Mitigations associées:</b><ul>${assocMits.map(m => {
                const mId = m.external_references?.[0]?.external_id || "M";
                const mUrl = m.external_references?.[0]?.url || "#";
                return `<li><a href="${mUrl}" target="_blank">${mId}: ${m.name}</a></li>`;
            }).join('') || "Aucune"}</ul></div>
        </div>
        <div style="margin-top:20px; text-align:right;">
            <a href="${tech.external_references[0].url}" target="_blank" class="btn-primary" style="text-decoration:none;">Voir fiche MITRE</a>
        </div>`;
    document.getElementById('tech-modal').style.display = "block";
}

function computeDemoScore() {
    let max = 0;
    mitigationDemo.questions.forEach(q => {
        if (demoAnswers[q.num] === 'Oui' && q.level > max) max = q.level;
    });
    return max;
}

function renderQuiz() {
    const container = document.getElementById('quiz-step');
    const total = mitigationDemo.questions.length;

    if (demoDone) {
        const score = computeDemoScore();
        container.innerHTML = `
            <div class="quiz-result level-${score}">
                <div class="quiz-tag">${mitigationDemo.id} — TEST</div>
                <div class="result-badge">Niveau ${score}</div>
                <h3>${mitigationDemo.name}</h3>
                <p class="result-text">${mitigationDemo.bareme[score]}</p>
                <div class="level-track">${renderLevelTrack(score)}</div>
                <div class="result-actions">
                    <button class="btn-quiz-secondary" onclick="restartDemo()">↺ Recommencer le test</button>
                    <button class="btn-primary" onclick="showView('view-matrix')">Voir la matrice</button>
                </div>
            </div>`;
        return;
    }

    const q = mitigationDemo.questions[demoIndex];
    const pct = Math.round((demoIndex / total) * 100);
    const answered = demoAnswers[q.num];

    container.innerHTML = `
        <div class="quiz-shell">
            <div class="quiz-topbar">
                <div class="quiz-tag">${mitigationDemo.id} — TEST</div>
                <h2 class="quiz-title">${mitigationDemo.name}</h2>
                <p class="quiz-desc">${mitigationDemo.description}</p>
            </div>

            <div class="level-track">${renderLevelTrack(computeDemoScore())}</div>

            <div class="quiz-progress-wrap">
                <div class="quiz-progress-label">Question ${demoIndex + 1} / ${total}</div>
                <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
            </div>

            <div class="quiz-card level-${q.level}">
                <div class="quiz-card-level">Niveau visé : <b>${q.level}</b>${q.docRequired ? ' · <span class="doc-flag">📄 preuve documentaire attendue</span>' : ''}</div>
                <p class="quiz-question">${q.text}</p>
                <div class="quiz-answers">
                    <button class="quiz-answer yes ${answered === 'Oui' ? 'selected' : ''}" onclick="answerDemo('Oui')">✔ Oui</button>
                    <button class="quiz-answer no ${answered === 'Non' ? 'selected' : ''}" onclick="answerDemo('Non')">✘ Non</button>
                    <button class="quiz-answer na ${answered === 'N/A' ? 'selected' : ''}" onclick="answerDemo('N/A')">– N/A</button>
                </div>
                <div class="quiz-refs">Réf. ${q.references}</div>
            </div>

            <div class="quiz-nav">
                <button class="quiz-back" ${demoIndex === 0 ? 'disabled' : ''} onclick="goBackDemo()">← Précédent</button>
            </div>
        </div>`;
}

function renderLevelTrack(currentLevel) {
    const labels = ["Inexistant", "Informel", "Répétable", "Défini", "Maîtrisé"];
    let html = '';
    for (let i = 0; i <= 4; i++) {
        const state = i < currentLevel ? 'done' : i === currentLevel ? 'active' : '';
        html += `<div class="level-dot lvl${i} ${state}" title="${labels[i]}">${i}</div>`;
    }
    return html;
}

function answerDemo(val) {
    const q = mitigationDemo.questions[demoIndex];
    demoAnswers[q.num] = val;

    if (val === 'Non') { demoDone = true; renderQuiz(); return; }

    if (demoIndex + 1 >= mitigationDemo.questions.length) { demoDone = true; renderQuiz(); return; }

    demoIndex++;
    renderQuiz();
}

function goBackDemo() {
    if (demoIndex > 0) { demoIndex--; renderQuiz(); }
}

function restartDemo() {
    demoIndex = 0; demoAnswers = {}; demoDone = false;
    renderQuiz();
}

function exportData(type) {
    if(type === 'json') {
        const pass = document.getElementById('export-pass').value;
        if(!pass) return alert("Mot de passe obligatoire !");
        const out = CryptoJS.AES.encrypt(JSON.stringify(userScores), pass).toString();
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], {type: "text/plain"})); a.download = "data.json"; a.click();
    } else {
        const ws = XLSX.utils.json_to_sheet(Object.keys(userScores).map(id => ({ "ID": id, "Score": userScores[id] })));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Maturité"); XLSX.writeFile(wb, "results.xlsx");
    }
}

function processImport() {
    const file = document.getElementById('import-file').files[0];
    const pass = document.getElementById('import-pass').value;
    const reader = new FileReader();
    reader.onload = (e) => {
        if(file.name.endsWith('.json')) {
            const dec = CryptoJS.AES.decrypt(e.target.result, pass).toString(CryptoJS.enc.Utf8);
            userScores = JSON.parse(dec);
        } else {
            const wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
            XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).forEach(row => userScores[row.ID] = row.Score);
        }
        renderMatrix(); showView('view-matrix');
    };
    if(file.name.endsWith('.json')) reader.readAsText(file); else reader.readAsArrayBuffer(file);
}

function highlightMitigation(mitId) {
    document.querySelectorAll('.technique-cell').forEach(c => c.classList.remove('active', 'inactive'));
    if(!mitId) return;
    const targets = relationships.filter(r => r.relationship_type === "mitigates" && r.source_ref === mitId).map(r => r.target_ref);
    document.querySelectorAll('.technique-cell').forEach(cell => {
        if(targets.includes(cell.id.replace('tech-',''))) cell.classList.add('active');
        else cell.classList.add('inactive');
    });
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}