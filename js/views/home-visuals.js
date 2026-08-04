/* ============================================================================
   Les deux visuels de la page d'accueil.

   Tous deux sont des **exemples**, pas des données : au premier chargement il n'y
   a aucune évaluation à montrer, et l'accueil doit tout de même donner à voir ce
   que l'outil produit. Ils sont donc explicitement légendés comme tels.

   Rien d'externe, rien de calculé au fil du temps : du SVG statique et deux
   animations CSS confiées au compositeur. Les deux respectent
   `prefers-reduced-motion`, géré dans home.css.
   ========================================================================= */

import { QUESTIONNAIRES } from "../catalog.js";
import { esc } from "../ui.js";

/**
 * Profil de maturité illustratif, de l'ordre de ce qu'on observe : une majorité
 * de pratiques informelles à définies, quelques points forts, quelques trous.
 * Fixe, pour que l'accueil ne clignote pas d'un rendu à l'autre.
 */
const DEMO_LEVELS = [
    1, 3, 2, 3, 3, 1, 2, 2, 2, 1, 1, 3, 3, 2, 2, 2, 3, 4, 2, 1, 2,
    3, 3, 1, 2, 1, 3, 2, 0, 1, 2, 1, 3, 2, 4, 2, 3, 2, 3, 2, 1, 2, 0,
];

/* --------------------------------------------------------------- la rosace */

const ROSACE = { size: 320, r0: 34, rMax: 146 };

const polar = (cx, cy, r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

/**
 * Rosace de maturité, en toile d'araignée : un rayon par mitigation, un sommet
 * par niveau atteint, et le polygone qui les relie.
 *
 * Les axes ne sont pas étiquetés — à 43 rayons les libellés se chevaucheraient.
 * C'est la forme d'ensemble qui parle : là où le polygone se creuse, la maturité
 * manque. Le détail se lit au survol de chaque sommet.
 */
export function rosace() {
    const { size, r0, rMax } = ROSACE;
    const c = size / 2;
    const ids = [...QUESTIONNAIRES.keys()];
    const step = 360 / ids.length;

    /** Rayon d'un niveau. Le 0 reste visible, sur le cercle intérieur. */
    const radiusOf = level => r0 + ((rMax - r0) * level) / 4;
    const angleOf = i => -90 + i * step;

    // La toile : un rayon par mitigation, et un polygone de repère par palier.
    const spokes = ids.map((_, i) => {
        const [x, y] = polar(c, c, rMax, angleOf(i));
        return `<line class="ros-spoke" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }).join("");

    const webPoints = r => ids
        .map((_, i) => polar(c, c, r, angleOf(i)).map(v => v.toFixed(1)).join(","))
        .join(" ");

    const webs = [1, 2, 3, 4].map(level =>
        `<polygon class="ros-web" points="${webPoints(radiusOf(level))}"/>`).join("");

    const ticks = [1, 2, 3, 4].map(level =>
        `<text class="ros-tick" x="${c + 4}" y="${(c - radiusOf(level)).toFixed(1)}">${level}</text>`).join("");

    // Le tracé de la maturité.
    let sum = 0;
    const levels = ids.map((_, i) => {
        const level = DEMO_LEVELS[i % DEMO_LEVELS.length];
        sum += level;
        return level;
    });

    const points = levels.map((level, i) => polar(c, c, radiusOf(level), angleOf(i)));
    const shape = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

    // Le contour se déroule par `stroke-dasharray` : il faut son périmètre exact,
    // segment de fermeture compris. Une valeur approchée le montrerait déjà
    // partiellement tracé au départ, ou couperait la fin de l'animation.
    const perimeter = points.reduce((total, [x, y], i) => {
        const [px, py] = points[(i + points.length - 1) % points.length];
        return total + Math.hypot(x - px, y - py);
    }, 0);

    const vertices = levels.map((level, i) => {
        const [x, y] = polar(c, c, radiusOf(level), angleOf(i));
        return `<circle class="ros-dot l${level}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"
                        style="--i:${i}"><title>${ids[i]} — niveau ${level}</title></circle>`;
    }).join("");

    const average = (sum / ids.length).toFixed(1).replace(".", ",");

    return `
        <figure class="rosace-figure">
            <svg class="rosace" viewBox="0 0 ${size} ${size}" role="img"
                 aria-label="Rosace d'exemple : niveau de maturité des ${ids.length} mitigations évaluables">
                <g class="ros-web-group">${spokes}${webs}</g>
                <polygon class="ros-shape" points="${shape}" style="--tour:${perimeter.toFixed(0)}"/>
                <g class="ros-dots">${vertices}</g>
                ${ticks}
                <circle class="ros-hub" cx="${c}" cy="${c}" r="${r0 - 6}"/>
                <text class="ros-value" x="${c}" y="${c - 1}">${average}</text>
                <text class="ros-unit" x="${c}" y="${c + 12}">/ 4</text>
            </svg>
            <figcaption>
                <b>Exemple</b> — un rayon par mitigation, le tracé donne le niveau atteint.
                Votre rosace se dessine au fil du questionnaire.
            </figcaption>
        </figure>`;
}

/* ------------------------------------------------- la matrice en arrière-plan */

const BACKDROP = {
    cellW: 68, cellH: 12, gap: 3,
    header: 20,        // hauteur de l'en-tête de tactique
    maxRows: 28,       // les tactiques les plus fournies sont écrêtées
    repeats: 2,        // blocs de matrice côte à côte dans une trame
    bands: 3,
    /* Largeur d'écran à couvrir. Le nombre de copies s'en déduit, plutôt que
       d'être fixé : la trame dépend du nombre de tactiques du référentiel, et une
       valeur en dur redeviendrait fausse si celui-ci changeait. */
    coverWidth: 4096,
};

/** Durées de défilement, une par bande. Décalées pour donner de la profondeur. */
const BAND_DURATIONS = [118, 156, 134];

/**
 * Générateur déterministe. Deux rendus successifs doivent donner exactement la
 * même trame : sans quoi le fond changerait à chaque retour sur l'accueil.
 */
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

/**
 * La matrice ATT&CK qui défile sans fin derrière l'accueil.
 *
 * C'est la vraie structure qui est reprise : une colonne par tactique, dans
 * l'ordre du référentiel, et autant de cases que la tactique compte de
 * techniques. C'est cette silhouette en dents de scie qui rend la matrice
 * reconnaissable au premier coup d'œil — une trame inventée n'y ressemblerait
 * pas. Seules les couleurs sont un exemple.
 *
 * Le bloc de 15 colonnes est répété pour composer une trame assez large, avec
 * des couleurs différentes à chaque répétition pour ne pas donner à voir un
 * carrelage. La trame est ensuite reprise par `<use>` : translater d'exactement
 * sa largeur ramène au point de départ, la boucle est donc sans couture, et le
 * document ne porte les rectangles qu'une seule fois.
 */
export function matrixBackdrop(data) {
    const { cellW, cellH, gap, header, maxRows, repeats, bands } = BACKDROP;
    const pitchX = cellW + gap;
    const pitchY = cellH + gap;

    const tactics = data?.tactics ?? [];
    if (!tactics.length) return "";

    const blockWidth = tactics.length * pitchX;
    const width = repeats * blockWidth;
    const rows = Math.min(maxRows, Math.max(...tactics.map(t =>
        (data.byTactic?.get(t.shortname)?.length ?? 0))) || maxRows);
    const bandHeight = header + rows * pitchY + 18;
    const random = seeded(20260804);

    const parts = [];
    for (let rep = 0; rep < repeats; rep++) {
        tactics.forEach((tactic, col) => {
            const x = rep * blockWidth + col * pitchX;
            const count = Math.min(maxRows, data.byTactic?.get(tactic.shortname)?.length ?? 0);

            parts.push(`<rect class="bd-head" x="${x}" y="0" width="${cellW}" height="${header}" rx="2"/>`);
            parts.push(`<text class="bd-head-text" x="${x + 4}" y="${header - 7}">${esc(tactic.name)}</text>`);

            for (let row = 0; row < count; row++) {
                // Une case sur cinq reste vide : les techniques non couvertes.
                const level = random() < 0.2 ? "none" : Math.min(4, Math.floor(random() * 5));
                parts.push(`<rect class="bd-cell l${level}" x="${x}" y="${header + row * pitchY}"
                                  width="${cellW}" height="${cellH}" rx="2"/>`);
            }
        });
    }

    // Les copies de la trame, alignées bout à bout à partir de l'origine.
    //
    // La bande part de −1 trame et remonte à 0 : le défilement se fait donc vers
    // la droite, et la matière qui entre par la gauche est celle des copies
    // suivantes. Tout reste en coordonnées positives, ce qui compte — un `<svg>`
    // écrête à son viewport, et une copie placée avant l'origine ne serait tout
    // simplement pas dessinée.
    //
    // Couverture à l'instant t ∈ [−trame, 0] :
    //     [t, copies × trame + t]
    // Le bord gauche reste ≤ 0, et le bord droit vaut au pire
    // (copies − 1) × trame : c'est cette valeur qui doit dépasser l'écran, d'où
    // le nombre de copies.
    const copyCount = Math.max(2, Math.ceil(BACKDROP.coverWidth / width) + 1);
    const totalWidth = copyCount * width;
    const strips = Array.from({ length: bands }, (_, b) => {
        const y = b * bandHeight;
        const duration = BAND_DURATIONS[b % BAND_DURATIONS.length];

        // Deux bandes voisines ne doivent pas montrer la même découpe au même
        // moment. Le décalage est pris sur la **phase** de l'animation, par un
        // délai négatif, et non sur la position des copies : déplacer les copies
        // rognerait la couverture d'un côté ou de l'autre.
        const phase = -((b * duration) / bands).toFixed(1);

        const copies = Array.from({ length: copyCount }, (_, i) =>
            `<use href="#bd-tiles" x="${i * width}" y="${y}"/>`).join("");
        return `<g class="bd-band" style="--dur:${duration}s;--phase:${phase}s">
            ${copies}
        </g>`;
    }).join("");

    // `--trame` est l'amplitude du défilement : le CSS anime de cette largeur
    // exactement, sans avoir à connaître la géométrie décrite ici.
    return `
        <div class="home-backdrop" aria-hidden="true" style="--trame:${width}px">
            <svg width="${totalWidth}" height="${bandHeight * bands}"
                 viewBox="0 0 ${totalWidth} ${bandHeight * bands}">
                <defs><g id="bd-tiles">${parts.join("")}</g></defs>
                ${strips}
            </svg>
        </div>`;
}
