const ATTACK_DATA_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

let mitreData = [];
let mitigations = [];
let relationships = [];
let techniques = {};

async function init() {
    try {
        const response = await fetch(ATTACK_DATA_URL);
        const data = await response.json();
        mitreData = data.objects;

        // 1. Filtrer les mitigations et les techniques
        mitigations = mitreData.filter(obj => obj.type === "course-of-action" && !obj.x_mitre_deprecated);
        relationships = mitreData.filter(obj => obj.type === "relationship" && obj.relationship_type === "mitigates");
        
        const techObjs = mitreData.filter(obj => obj.type === "attack-pattern");
        techObjs.forEach(t => techniques[t.id] = t);

        document.getElementById('status').innerText = `Live: ${mitigations.length} Mitigations chargées.`;
        renderMatrix();
    } catch (error) {
        console.error("Erreur de fetch:", error);
        document.getElementById('status').innerText = "Erreur lors du chargement des données.";
    }
}

function renderMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';

    mitigations.sort((a, b) => a.name.localeCompare(b.name)).forEach(mit => {
        const card = document.createElement('div');
        card.className = 'mitigation-card';
        card.innerHTML = `<strong>${mit.name}</strong>`;
        card.onclick = () => showDetails(mit);
        container.appendChild(card);
    });
}

function showDetails(mitigation) {
    const modal = document.getElementById('modal');
    const list = document.getElementById('techniques-list');
    
    document.getElementById('modal-title').innerText = mitigation.name;
    document.getElementById('modal-description').innerText = mitigation.description || "Pas de description disponible.";
    
    // Trouver les techniques liées
    list.innerHTML = '';
    const relatedTechs = relationships
        .filter(rel => rel.source_ref === mitigation.id)
        .map(rel => techniques[rel.target_ref])
        .filter(t => t !== undefined);

    if (relatedTechs.length === 0) {
        list.innerHTML = "<li>Aucune technique directement associée.</li>";
    } else {
        relatedTechs.forEach(tech => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${tech.external_references[0].external_id}</strong>: ${tech.name}`;
            list.appendChild(li);
        });
    }

    modal.classList.remove('hidden');
}

// Fermeture de la modal
document.querySelector('.close-btn').onclick = () => {
    document.getElementById('modal').classList.add('hidden');
};

window.onclick = (event) => {
    if (event.target == document.getElementById('modal')) {
        document.getElementById('modal').classList.add('hidden');
    }
};

init();