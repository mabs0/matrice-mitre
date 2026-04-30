const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
let tactics = [], techniques = [], mitigations = [], relationships = [], allObjects = [];
let userScores = {}; 
let currentQuizStep = 0;

// Ordre officiel des tactiques (ID STIX immuables) pour un replica parfait
const TACTIC_ORDER_IDS = {
    "tactic--ffd5bcee-6e16-4eb2-8eca-74c693332024": 1, // Reconnaissance
    "tactic--71073099-0604-460d-9e61-f4c079207e8e": 2, // Resource Development
    "tactic--78b23412-3273-455a-b605-728b94875080": 3, // Initial Access
    "tactic--5bc3d492-49da-411a-888e-7e9ca9813264": 4, // Execution
    "tactic--5373f782-9653-469b-8255-7fc75e9b7244": 5, // Persistence
    "tactic--9a4da9b7-005d-4f01-9037-33e72e1e0a29": 6, // Privilege Escalation
    "tactic--7865943d-c276-4d40-ba35-3006368d1358": 7, // Defense Evasion
    "tactic--20658760-449e-4e46-9d6e-8217f227b615": 8, // Credential Access
    "tactic--c6978df0-f81d-48ef-8232-15989104085f": 9, // Discovery
    "tactic--5f68c785-5a2a-43cf-8700-1c3274291f09": 10, // Lateral Movement
    "tactic--03998da3-5b87-43c2-8418-5a415a953932": 11, // Collection
    "tactic--939f4019-338b-4a57-9d7a-d035e1d70e4e": 12, // Command and Control
    "tactic--7464e837-147b-4029-9e8c-55c3c0b0f719": 13, // Exfiltration
    "tactic--77f2cc96-3e01-44a6-9810-74673629f63f": 14  // Impact
};

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
        allObjects = data.objects;

        // 1. Filtrage et tri des tactiques
        tactics = allObjects.filter(o => o.type === "x-mitre-tactic")
            .sort((a, b) => (TACTIC_ORDER_IDS[a.id] || 99) - (TACTIC_ORDER_IDS[b.id] || 99));
        
        // 2. FILTRAGE STRICT TECHNIQUES MÈRES (Exclut dépréciées, révoquées et sous-techniques)
        techniques = allObjects.filter(o => 
            o.type === "attack-pattern" && 
            o.x_mitre_is_subtechnique === false && 
            o.x_mitre_deprecated !== true && 
            o.revoked !== true
        );
        
        mitigations = allObjects.filter(o => 
            o.type === "course-of-action" && 
            o.x_mitre_deprecated !== true && 
            o.revoked !== true
        );
        
        relationships = allObjects.filter(o => o.type === "relationship");

        initInterface();
    } catch (e) {
        console.error("Erreur critique de chargement :", e);
    }
}

function initInterface() {
    const sel = document.getElementById('mitigation-select');
    sel.innerHTML = '<option value="">Filtrer par Mitigation...</option>';
    mitigations.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
        let opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `[${m.external_references?.[0]?.external_id || "M"}] ${m.name}`;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => highlightMitigation(e.target.value);
    
    // Gestion de la modale
    const modal = document.getElementById('tech-modal');
    document.querySelector('.close-btn').onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if(e.target == modal) modal.style.display = "none"; };
    document.onkeydown = (e) => { if(e.key === "Escape") modal.style.display = "none"; };

    renderMatrix();
    renderQuiz();
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

        col.innerHTML = `
            <div class="tactic-header">
                <div>${t.name}</div>
                <div class="tech-count">${techsInTactic.length} techniques</div>
            </div>`;
        
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

function showTechDetails(tech) {
    const modal = document.getElementById('tech-modal');
    const techId = tech.external_references[0].external_id;

    // Récupération des sous-techniques (filles)
    const subTechs = allObjects.filter(o => 
        o.type === "attack-pattern" && 
        o.x_mitre_is_subtechnique === true && 
        o.external_references[0].external_id.startsWith(techId + ".") &&
        o.x_mitre_deprecated !== true &&
        o.revoked !== true
    );

    // Récupération des mitigations liées
    const associatedMits = relationships
        .filter(r => r.relationship_type === "mitigates" && r.target_ref === tech.id)
        .map(r => allObjects.find(obj => obj.id === r.source_ref))
        .filter(m => m != null && m.x_mitre_deprecated !== true);

    document.getElementById('modal-body').innerHTML = `
        <div style="color:var(--primary); font-weight:bold; margin-bottom:5px;">${techId}</div>
        <h2 style="margin-top:0;">${tech.name}</h2>
        <hr>
        <div style="font-size:0.85rem; max-height:150px; overflow-y:auto; margin-bottom:20px; background:#f9f9f9; padding:10px; border:1px solid #ddd;">
            ${tech.description || "Aucune description disponible."}
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div>
                <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:0;">Sous-techniques (${subTechs.length})</h4>
                <ul style="font-size:0.75rem; padding-left:15px; list-style:square;">
                    ${subTechs.map(s => `<li><a href="${s.external_references[0].url}" target="_blank">${s.external_references[0].external_id} - ${s.name}</a></li>`).join('') || "Aucune"}
                </ul>
            </div>
            <div>
                <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:0;">Mitigations</h4>
                <ul style="font-size:0.75rem; padding-left:15px; list-style:square;">
                    ${associatedMits.map(m => `<li><a href="${m.external_references?.[0]?.url || '#'}" target="_blank">${m.name}</a></li>`).join('') || "Aucune"}
                </ul>
            </div>
        </div>
        <div style="margin-top:20px; text-align:right;">
            <a href="${tech.external_references[0].url}" target="_blank" style="background:var(--primary); color:white; padding:10px 18px; border-radius:4px; text-decoration:none; font-size:0.85rem; font-weight:bold;">Voir sur le site MITRE ATT&CK →</a>
        </div>
    `;
    modal.style.display = "block";
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function renderQuiz() {
    const container = document.getElementById('quiz-step');
    if(currentQuizStep >= quizData.length) {
        container.innerHTML = "<h3>Quiz terminé !</h3><p>Analyse terminée. Les scores ont été appliqués à la matrice.</p><button class='btn-primary' onclick='showView(\"view-matrix\")'>Retourner à la Matrice</button>";
        return;
    }
    const q = quizData[currentQuizStep];
    container.innerHTML = `<h4>Question ${currentQuizStep + 1}/${quizData.length}</h4><p style="font-weight:bold;">${q.q}</p>`;
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "btn-primary"; btn.style.marginRight = "10px"; btn.style.marginBottom = "5px"; btn.innerText = opt.l;
        btn.onclick = () => {
            userScores[q.tech] = opt.v;
            currentQuizStep++;
            renderQuiz();
            renderMatrix();
        };
        container.appendChild(btn);
    });
}

function exportData(type) {
    if(type === 'json') {
        const pass = document.getElementById('export-pass').value;
        if(!pass) return alert("ERREUR : Vous devez définir un mot de passe pour chiffrer l'export JSON !");
        
        const dataStr = JSON.stringify(userScores);
        const encrypted = CryptoJS.AES.encrypt(dataStr, pass).toString();
        
        const a = document.createElement('a');
        const file = new Blob([encrypted], {type: "text/plain"});
        a.href = URL.createObjectURL(file);
        a.download = "cyber_assessment_secure.json";
        a.click();
    } else {
        const rows = Object.keys(userScores).map(id => ({ "ID_Technique": id, "Score_Maturite": userScores[id] }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Maturité_Cyber");
        XLSX.writeFile(wb, "resultats_mitre.xlsx");
    }
}

function processImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    const pass = document.getElementById('import-pass').value;
    
    if(!file) return alert("Veuillez sélectionner un fichier.");
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            if(file.name.endsWith('.json')) {
                if(!pass) return alert("Mot de passe requis pour déchiffrer le JSON.");
                const bytes = CryptoJS.AES.decrypt(e.target.result, pass);
                const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
                if(!decryptedData) throw new Error();
                userScores = JSON.parse(decryptedData);
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                userScores = {};
                json.forEach(row => {
                    if(row.ID_Technique) userScores[row.ID_Technique] = row.Score_Maturite;
                });
            }
            renderMatrix();
            showView('view-matrix');
            alert("Données importées avec succès !");
        } catch(err) {
            alert("Échec de l'import : Fichier corrompu ou mot de passe incorrect.");
        }
    };
    
    if(file.name.endsWith('.json')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
}

function highlightMitigation(mitId) {
    document.querySelectorAll('.technique-cell').forEach(c => c.classList.remove('active', 'inactive'));
    if(!mitId) return;

    // Recherche des relations de type 'mitigates' impliquant cette mitigation
    const targets = relationships
        .filter(r => r.relationship_type === "mitigates" && r.source_ref === mitId)
        .map(r => r.target_ref);

    document.querySelectorAll('.technique-cell').forEach(cell => {
        const techIdStix = cell.id.replace('tech-','');
        if(targets.includes(techIdStix)) {
            cell.classList.add('active');
        } else {
            cell.classList.add('inactive');
        }
    });
}