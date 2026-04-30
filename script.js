const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
let tactics = [], techniques = [], mitigations = [], relationships = [];
let userScores = {}; 
let currentQuizStep = 0;

const quizData = [
    { q: "Utilisez-vous l'authentification multi-facteurs (MFA) ?", tech: "T1078", options: [{l:"Oui", v:5}, {l:"Partiel", v:2}, {l:"Non", v:0}] },
    { q: "Vos emails sont-ils scannés contre le Phishing ?", tech: "T1566", options: [{l:"Oui", v:5}, {l:"Non", v:0}] },
    { q: "Avez-vous un EDR déployé ?", tech: "T1059", options: [{l:"Oui", v:5}, {l:"Partiel", v:3}, {l:"Non", v:0}] }
];

document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    try {
        const resp = await fetch(JSON_URL);
        const data = await resp.json();
        const obj = data.objects;
        tactics = obj.filter(o => o.type === "x-mitre-tactic").sort((a,b) => a.name.localeCompare(b.name));
        techniques = obj.filter(o => o.type === "attack-pattern" && !o.x_mitre_is_subtechnique);
        mitigations = obj.filter(o => o.type === "course-of-action" && !o.x_mitre_deprecated);
        relationships = obj.filter(o => o.type === "relationship" && o.relationship_type === "mitigates");
        initInterface();
    } catch (e) { console.error("Erreur chargement MITRE", e); }
}

function initInterface() {
    const sel = document.getElementById('mitigation-select');
    sel.innerHTML = '<option value="">Couverture par Mitigation...</option>';
    mitigations.sort((a,b)=>a.name.localeCompare(b.name)).forEach(m => {
        let opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `[${m.external_references?.[0]?.external_id}] ${m.name}`;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => highlightMitigation(e.target.value);
    renderMatrix();
    renderQuiz();
    document.querySelector('.close-btn').onclick = () => document.getElementById('tech-modal').style.display="none";
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function renderMatrix() {
    const cont = document.getElementById('matrix-container');
    cont.innerHTML = '';
    tactics.forEach(t => {
        const col = document.createElement('div');
        col.className = 'tactic-column';
        col.innerHTML = `<div class="tactic-header">${t.name}</div>`;
        
        techniques.filter(tech => tech.kill_chain_phases?.some(p => p.phase_name === t.x_mitre_shortname))
        .forEach(tech => {
            const extId = tech.external_references[0].external_id;
            const cell = document.createElement('div');
            cell.className = 'technique-cell';
            cell.id = `tech-${tech.id}`;
            
            // Priorité aux couleurs de maturité (Quiz/Import)
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

function highlightMitigation(mitId) {
    // Reset Matrix
    document.querySelectorAll('.technique-cell').forEach(c => c.classList.remove('active', 'inactive'));
    
    if(!mitId) return;

    // Trouver les techniques liées à la mitigation sélectionnée
    const targetedTechIds = relationships
        .filter(r => r.source_ref === mitId)
        .map(r => r.target_ref);

    document.querySelectorAll('.technique-cell').forEach(cell => {
        const techId = cell.id.replace('tech-','');
        if(targetedTechIds.includes(techId)) {
            cell.classList.add('active');
        } else {
            cell.classList.add('inactive');
        }
    });
    document.getElementById('counter').innerText = `${targetedTechIds.length} techniques couvertes`;
}

function renderQuiz() {
    const container = document.getElementById('quiz-step');
    if(currentQuizStep >= quizData.length) {
        container.innerHTML = "<h3>Quiz terminé !</h3><p>Vos résultats sont prêts.</p><button class='btn-primary' onclick='showView(\"view-import\")'>Aller à l'exportation</button>";
        return;
    }
    const q = quizData[currentQuizStep];
    container.innerHTML = `<h3>Question ${currentQuizStep + 1}/${quizData.length}</h3><p>${q.q}</p>`;
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "btn-primary"; btn.style.marginRight = "10px"; btn.innerText = opt.l;
        btn.onclick = () => {
            userScores[q.tech] = opt.v;
            currentQuizStep++;
            renderQuiz();
            renderMatrix();
        };
        container.appendChild(btn);
    });
}

function showTechDetails(tech) {
    const m = document.getElementById('tech-modal');
    const id = tech.external_references[0].external_id;
    const url = tech.external_references[0].url;
    
    document.getElementById('modal-body').innerHTML = `
        <span style="color:var(--primary); font-weight:bold;">${id}</span>
        <h2>${tech.name}</h2>
        <hr>
        <p style="line-height:1.5;">${tech.description.replace(/\n/g, '<br>')}</p>
        <br>
        <a href="${url}" target="_blank" style="color:var(--primary); text-decoration:underline;">
            Voir la fiche technique sur le site MITRE ATT&CK →
        </a>
    `;
    m.style.display = "block";
}

// EXPORT & IMPORT (On garde ton code qui fonctionne nickel)
function exportData(type) {
    if(type === 'excel') {
        const rows = Object.keys(userScores).map(id => ({ "Technique": id, "Niveau": userScores[id] }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Maturité");
        XLSX.writeFile(wb, "cyber_results.xlsx");
    } else {
        const pass = document.getElementById('export-pass').value;
        const out = pass ? CryptoJS.AES.encrypt(JSON.stringify(userScores), pass).toString() : JSON.stringify(userScores);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([out], {type: "text/plain"}));
        a.download = "data.json"; a.click();
    }
}

function processImport() {
    const file = document.getElementById('import-file').files[0];
    const pass = document.getElementById('import-pass').value;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            if(file.name.endsWith('.json')) {
                let raw = e.target.result;
                try {
                    let dec = pass ? CryptoJS.AES.decrypt(raw, pass).toString(CryptoJS.enc.Utf8) : raw;
                    userScores = JSON.parse(dec);
                } catch { userScores = JSON.parse(raw); }
            } else {
                const wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
                XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).forEach(row => userScores[row.Technique] = row.Niveau);
            }
            renderMatrix(); showView('view-matrix'); alert("Import réussi !");
        } catch(err) { alert("Échec de l'import : vérifiez le fichier ou le mot de passe."); }
    };
    if(file.name.endsWith('.json')) reader.readAsText(file); else reader.readAsArrayBuffer(file);
}