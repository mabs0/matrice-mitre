const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
let tactics = [], techniques = [], mitigations = [], relationships = [];
let userScores = {}; 
let currentQuizStep = 0;

// Ordre officiel strict pour le replica parfait
const OFFICIAL_TACTIC_ORDER = [
    "reconnaissance", "resource-development", "initial-access", "execution", 
    "persistence", "privilege-escalation", "defense-evasion", "credential-access", 
    "discovery", "lateral-movement", "collection", "command-and-control", 
    "exfiltration", "impact"
];

const quizData = [
    { q: "Utilisez-vous l'authentification multi-facteurs (MFA) ?", tech: "T1078", options: [{l:"Oui", v:5}, {l:"Partiel", v:2}, {l:"Non", v:0}] },
    { q: "Vos emails sont-ils scannés contre le Phishing ?", tech: "T1566", options: [{l:"Oui", v:5}, {l:"Non", v:0}] },
    { q: "Avez-vous un EDR déployé sur le parc ?", tech: "T1059", options: [{l:"Oui", v:5}, {l:"Partiel", v:3}, {l:"Non", v:0}] }
];

document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    try {
        const resp = await fetch(JSON_URL);
        const data = await resp.json();
        const obj = data.objects;

        // Tri des tactiques selon l'ordre officiel
        tactics = obj.filter(o => o.type === "x-mitre-tactic").sort((a, b) => {
            return OFFICIAL_TACTIC_ORDER.indexOf(a.x_mitre_shortname) - OFFICIAL_TACTIC_ORDER.indexOf(b.x_mitre_shortname);
        });

        techniques = obj.filter(o => o.type === "attack-pattern" && !o.x_mitre_is_subtechnique);
        
        mitigations = obj.filter(o => o.type === "course-of-action" && !o.x_mitre_deprecated)
            .sort((a, b) => {
                const idA = a.external_references?.[0]?.external_id || "";
                const idB = b.external_references?.[0]?.external_id || "";
                return idA.localeCompare(idB, undefined, { numeric: true });
            });

        relationships = obj.filter(o => o.type === "relationship" && o.relationship_type === "mitigates");
        
        initInterface();
    } catch (e) { console.error("Erreur de chargement", e); }
}

function initInterface() {
    const sel = document.getElementById('mitigation-select');
    sel.innerHTML = '<option value="">Filtrer par Mitigation (MXXXX)...</option>';
    mitigations.forEach(m => {
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
        const techsInTactic = techniques.filter(tech => 
            tech.kill_chain_phases?.some(p => p.phase_name === t.x_mitre_shortname)
        );

        col.innerHTML = `<div class="tactic-header"><div>${t.name}</div><div class="tech-count">${techsInTactic.length} techniques</div></div>`;
        
        techsInTactic.forEach(tech => {
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

function highlightMitigation(mitId) {
    document.querySelectorAll('.technique-cell').forEach(c => c.classList.remove('active', 'inactive'));
    if(!mitId) return;
    const targetedTechIds = relationships.filter(r => r.source_ref === mitId).map(r => r.target_ref);
    document.querySelectorAll('.technique-cell').forEach(cell => {
        const techId = cell.id.replace('tech-','');
        if(targetedTechIds.includes(techId)) cell.classList.add('active');
        else cell.classList.add('inactive');
    });
}

function renderQuiz() {
    const container = document.getElementById('quiz-step');
    if(currentQuizStep >= quizData.length) {
        container.innerHTML = "<h3>Quiz terminé !</h3><button class='btn-primary' onclick='showView(\"view-matrix\")'>Visualiser sur la Matrice</button>";
        return;
    }
    const q = quizData[currentQuizStep];
    container.innerHTML = `<h4>Question ${currentQuizStep + 1}/${quizData.length}</h4><p>${q.q}</p>`;
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "btn-primary"; btn.style.marginRight = "8px"; btn.innerText = opt.l;
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
    document.getElementById('modal-body').innerHTML = `
        <span style="color:var(--primary);font-weight:bold">${tech.external_references[0].external_id}</span>
        <h2>${tech.name}</h2><hr>
        <p style="font-size:0.85rem;line-height:1.4">${tech.description}</p>
        <br><a href="${tech.external_references[0].url}" target="_blank">Lien MITRE ATT&CK →</a>`;
    m.style.display = "block";
}

function exportData(type) {
    if(type === 'excel') {
        const rows = Object.keys(userScores).map(id => ({ "Technique": id, "Niveau": userScores[id] }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Maturité");
        XLSX.writeFile(wb, "export_cyber.xlsx");
    } else {
        const pass = document.getElementById('export-pass').value;
        if(!pass) return alert("ERREUR : Clé de chiffrement obligatoire pour l'export JSON !");
        const out = CryptoJS.AES.encrypt(JSON.stringify(userScores), pass).toString();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([out], {type: "text/plain"}));
        a.download = "data_secure.json"; a.click();
    }
}

function processImport() {
    const file = document.getElementById('import-file').files[0];
    const pass = document.getElementById('import-pass').value;
    if(!file) return alert("Sélectionnez un fichier.");
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            if(file.name.endsWith('.json')) {
                if(!pass) return alert("Clé requise pour le JSON.");
                let dec = CryptoJS.AES.decrypt(e.target.result, pass).toString(CryptoJS.enc.Utf8);
                userScores = JSON.parse(dec);
            } else {
                const wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
                XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).forEach(row => userScores[row.Technique] = row.Niveau);
            }
            renderMatrix(); showView('view-matrix'); alert("Importation réussie !");
        } catch(err) { alert("Erreur : Fichier invalide ou clé incorrecte."); }
    };
    if(file.name.endsWith('.json')) reader.readAsText(file); else reader.readAsArrayBuffer(file);
}