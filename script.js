const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
let tactics = [], techniques = [], mitigations = [], relationships = [], allObjects = [];
let userScores = {}, currentQuizStep = 0;

const TACTIC_ORDER_IDS = {
    "tactic--ffd5bcee-6e16-4eb2-8eca-74c693332024": 1, "tactic--71073099-0604-460d-9e61-f4c079207e8e": 2,
    "tactic--78b23412-3273-455a-b605-728b94875080": 3, "tactic--5bc3d492-49da-411a-888e-7e9ca9813264": 4,
    "tactic--5373f782-9653-469b-8255-7fc75e9b7244": 5, "tactic--9a4da9b7-005d-4f01-9037-33e72e1e0a29": 6,
    "tactic--7865943d-c276-4d40-ba35-3006368d1358": 7, "tactic--20658760-449e-4e46-9d6e-8217f227b615": 8,
    "tactic--c6978df0-f81d-48ef-8232-15989104085f": 9, "tactic--5f68c785-5a2a-43cf-8700-1c3274291f09": 10,
    "tactic--03998da3-5b87-43c2-8418-5a415a953932": 11, "tactic--939f4019-338b-4a57-9d7a-d035e1d70e4e": 12,
    "tactic--7464e837-147b-4029-9e8c-55c3c0b0f719": 13, "tactic--77f2cc96-3e01-44a6-9810-74673629f63f": 14
};

const quizData = [
    { q: "Avez-vous activé le MFA ?", tech: "T1078", options: [{l:"Oui", v:5}, {l:"Partiel", v:2}, {l:"Non", v:0}] },
    { q: "Filtrez-vous les emails (Phishing) ?", tech: "T1566", options: [{l:"Oui", v:5}, {l:"Non", v:0}] }
];

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
    
    mitigations = allObjects.filter(o => o.type === "course-of-action" && o.x_mitre_deprecated !== true);
    relationships = allObjects.filter(o => o.type === "relationship");

    initInterface();
}

function initInterface() {
    const sel = document.getElementById('mitigation-select');
    sel.innerHTML = '<option value="">Filtrer par Mitigation...</option>';
    mitigations.sort((a,b) => a.name.localeCompare(b.name)).forEach(m => {
        let opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `[${m.external_references?.[0]?.external_id || "M"}] ${m.name}`;
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
        .map(r => allObjects.find(obj => obj.id === r.source_ref)).filter(m => m != null);

    document.getElementById('modal-body').innerHTML = `
        <h3>${techId} - ${tech.name}</h3><hr>
        <div style="font-size:0.8rem; margin-bottom:15px; background:#f9f9f9; padding:10px;">${tech.description || ""}</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.75rem;">
            <div><b>Sous-techniques:</b><ul>${subTechs.map(s => `<li><a href="${s.external_references[0].url}" target="_blank">${s.external_references[0].external_id}</a></li>`).join('') || "Aucune"}</ul></div>
            <div><b>Mitigations:</b><ul>${assocMits.map(m => `<li>${m.name}</li>`).join('') || "Aucune"}</ul></div>
        </div>`;
    document.getElementById('tech-modal').style.display = "block";
}

function renderQuiz() {
    const container = document.getElementById('quiz-step');
    if(currentQuizStep >= quizData.length) {
        container.innerHTML = "<h3>Quiz terminé !</h3><button class='btn-primary' onclick='showView(\"view-matrix\")'>Voir Matrice</button>";
        return;
    }
    const q = quizData[currentQuizStep];
    container.innerHTML = `<h4>Question ${currentQuizStep + 1}</h4><p>${q.q}</p><div class="quiz-options"></div>`;
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "btn-quiz"; btn.innerText = opt.l;
        btn.onclick = () => { userScores[q.tech] = opt.v; currentQuizStep++; renderQuiz(); renderMatrix(); };
        container.querySelector('.quiz-options').appendChild(btn);
    });
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