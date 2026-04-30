const JSON_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

let tactics = [], techniques = [], mitigations = [], relationships = [];

// On attend que le HTML soit chargé avant de lancer le JS
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

async function loadData() {
    // Petit indicateur de chargement dans le select
    const select = document.getElementById('mitigation-select');
    if (select) select.innerHTML = '<option>Chargement du MITRE ATT&CK...</option>';

    try {
        const resp = await fetch(JSON_URL);
        if (!resp.ok) throw new Error("Erreur lors de la récupération du JSON");
        
        const data = await resp.json();
        const objects = data.objects;

        // Filtrage des données
        tactics = objects.filter(o => o.type === "x-mitre-tactic").sort((a,b) => a.name.localeCompare(b.name));
        techniques = objects.filter(o => o.type === "attack-pattern" && !o.x_mitre_is_subtechnique);
        mitigations = objects.filter(o => o.type === "course-of-action" && !o.x_mitre_deprecated);
        relationships = objects.filter(o => o.type === "relationship" && o.relationship_type === "mitigates");

        initInterface();
    } catch (e) {
        console.error("Détails de l'erreur:", e);
        // Si l'élément select existe, on y affiche l'erreur
        if (select) select.innerHTML = `<option>Erreur de chargement : ${e.message}</option>`;
    }
}

function getExtId(obj) {
    return obj.external_references?.[0]?.external_id || "N/A";
}

function initInterface() {
    const select = document.getElementById('mitigation-select');
    select.innerHTML = '<option value="">Choisir une Mitigation...</option>';
    
    mitigations.sort((a,b) => a.name.localeCompare(b.name)).forEach(m => {
        const id = getExtId(m);
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `[${id}] ${m.name}`;
        select.appendChild(opt);
    });

    renderMatrix();
    select.addEventListener('change', (e) => highlightMitigation(e.target.value));
    
    // Fermeture modale
    document.querySelector('.close-btn').onclick = () => document.getElementById('tech-modal').style.display = "none";
    window.onclick = (e) => { if(e.target.className === 'modal') e.target.style.display = "none"; };
}

function renderMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';

    tactics.forEach(tactic => {
        const col = document.createElement('div');
        col.className = 'tactic-column';
        col.innerHTML = `<div class="tactic-header">${tactic.name}</div>`;

        const tacticTechs = techniques.filter(tech => 
            tech.kill_chain_phases?.some(phase => phase.phase_name === tactic.x_mitre_shortname)
        );

        tacticTechs.forEach(tech => {
            const cell = document.createElement('div');
            cell.className = 'technique-cell';
            cell.id = `tech-${tech.id}`;
            cell.innerHTML = `<div>${tech.name}</div><div style="font-size:0.6rem; color: #888;">${getExtId(tech)}</div>`;
            cell.onclick = () => showTechDetails(tech);
            col.appendChild(cell);
        });

        container.appendChild(col);
    });
}

function highlightMitigation(mitigationId) {
    document.querySelectorAll('.technique-cell').forEach(c => c.classList.remove('active', 'inactive'));
    if (!mitigationId) return;

    const targetedTechIds = relationships
        .filter(rel => rel.source_ref === mitigationId)
        .map(rel => rel.target_ref);

    document.querySelectorAll('.technique-cell').forEach(cell => {
        const techId = cell.id.replace('tech-', '');
        if (targetedTechIds.includes(techId)) cell.classList.add('active');
        else cell.classList.add('inactive');
    });
    document.getElementById('counter').textContent = `${targetedTechIds.length} techniques mitigées`;
}

function showTechDetails(tech) {
    const modal = document.getElementById('tech-modal');
    const body = document.getElementById('modal-body');
    const id = getExtId(tech);
    
    body.innerHTML = `
        <span class="tech-id-label">${id}</span>
        <h2>${tech.name}</h2>
        <hr>
        <p>${tech.description ? tech.description.replace(/\n/g, '<br>') : 'Pas de description.'}</p>
        <div style="margin-top:20px;">
            <a href="${tech.external_references[0].url}" target="_blank" style="color:#205493;">Voir sur le site officiel MITRE ATT&CK →</a>
        </div>
    `;
    modal.style.display = "block";
}

loadData();