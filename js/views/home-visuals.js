/* ============================================================================
   Les deux visuels de la page d'accueil.

   Tous deux sont des **exemples**, pas des données : au premier chargement il n'y
   a aucune évaluation à montrer, et l'accueil doit tout de même donner à voir ce
   que l'outil produit. La légende qui le disait sous la rosace a été retirée —
   elle expliquait l'évidence à un lecteur qui n'a encore rien saisi. Le statut
   d'exemple reste porté par le `aria-label`, pour qui ne voit pas le dessin.

   Rien d'externe, rien de calculé au fil du temps : du SVG statique et deux
   animations CSS confiées au compositeur. Les deux respectent
   `prefers-reduced-motion`, géré dans home.css.
   ========================================================================= */

import { esc } from "../ui.js";

/**
 * Profil de maturité illustratif, de l'ordre de ce qu'on observe : une majorité
 * de pratiques informelles à définies, quelques points forts, quelques trous.
 * Fixe, pour que l'accueil ne clignote pas d'un rendu à l'autre.
 *
 * Il y a plus de valeurs que de tactiques : le référentiel en a gagné une en
 * v19 et peut en gagner d'autres, la liste est parcourue de façon cyclique.
 */
const DEMO_LEVELS = [2, 3, 1, 2, 3, 1, 2, 2, 0, 3, 2, 1, 3, 2, 1, 2, 4, 2];

/* --------------------------------------------------------------- la rosace */

/* Le viewBox déborde de la boîte du dessin : `marge` est la couronne, à gauche
   et à droite, où s'écrivent les noms de tactiques. Les libellés sont posés à
   l'horizontale, seule façon de les lire d'un coup d'œil, et c'est ce qui coûte
   cette place — un nom couché tiendrait dans moins, mais se déchiffrerait la
   tête penchée. Le banc mesure cette marge plutôt que de la supposer. */
const ROSACE = { size: 320, r0: 30, rMax: 108, marge: 34, ecartLibelle: 9 };

const polar = (cx, cy, r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

/**
 * Découpe un nom de tactique en lignes courtes.
 *
 * Les noms d'ATT&CK vont jusqu'à trois mots, et les écrire d'un seul tenant
 * demanderait une couronne deux fois plus large que le dessin lui-même. Coupés
 * aux espaces, ils tiennent dans la moitié — et jamais à l'intérieur d'un mot,
 * qui deviendrait illisible.
 */
function lignesDuNom(nom, maxi = 15) {
    const lignes = [];
    for (const mot of String(nom).split(/\s+/).filter(Boolean)) {
        const derniere = lignes.at(-1);
        if (derniere && `${derniere} ${mot}`.length <= maxi) lignes[lignes.length - 1] = `${derniere} ${mot}`;
        else lignes.push(mot);
    }
    return lignes.length ? lignes : [""];
}

/**
 * Rosace de maturité, en toile d'araignée : un rayon par tactique, un sommet
 * par niveau atteint, et le polygone qui les relie.
 *
 * Par tactique et non par mitigation : c'est l'axe de lecture d'ATT&CK, celui de
 * la matrice et celui d'une question de direction — « où sommes-nous faibles ? »
 * se répond en phases d'attaque, pas en mesures d'atténuation. Quinze rayons se
 * lisent aussi d'un coup d'œil, là où quarante-trois faisaient une dentelle.
 *
 * C'est la forme d'ensemble qui parle : là où le polygone se creuse, la maturité
 * manque. Chaque rayon est nommé en bout pour qu'on sache *laquelle* se creuse
 * sans avoir à survoler — un geste qui n'existe pas au doigt.
 *
 * @param {object} data référentiel ATT&CK normalisé
 */
export function rosace(data, reels = null) {
    const { size, r0, rMax, marge, ecartLibelle } = ROSACE;
    const c = size / 2;
    const tactiques = data?.tactics ?? [];
    const noms = tactiques.map(t => t.name);
    if (!noms.length) return "";
    const step = 360 / noms.length;

    /** Rayon d'un niveau. Le 0 reste visible, sur le cercle intérieur. */
    const radiusOf = level => r0 + ((rMax - r0) * level) / 4;
    const angleOf = i => -90 + i * step;

    // La toile : un rayon par tactique, et un polygone de repère par palier.
    const spokes = noms.map((_, i) => {
        const [x, y] = polar(c, c, rMax, angleOf(i));
        return `<line class="ros-spoke" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }).join("");

    const webPoints = r => noms
        .map((_, i) => polar(c, c, r, angleOf(i)).map(v => v.toFixed(1)).join(","))
        .join(" ");

    const webs = [1, 2, 3, 4].map(level =>
        `<polygon class="ros-web" points="${webPoints(radiusOf(level))}"/>`).join("");

    const ticks = [1, 2, 3, 4].map(level =>
        `<text class="ros-tick" x="${c + 4}" y="${(c - radiusOf(level)).toFixed(1)}">${level}</text>`).join("");

    // Le nom de la tactique au bout de son rayon, à l'horizontale.
    //
    // L'ancrage suit le côté : à droite le texte part du rayon vers l'extérieur,
    // à gauche il s'y termine, en haut et en bas il se centre. C'est ce qui le
    // fait toujours s'éloigner du dessin au lieu de le recouvrir. Le bloc de
    // lignes est centré sur le point d'ancrage, sans quoi un nom sur deux lignes
    // pendrait sous son rayon.
    const axes = noms.map((nom, i) => {
        const angle = angleOf(i);
        const [x, y] = polar(c, c, rMax + ecartLibelle, angle);
        const cos = Math.cos((angle * Math.PI) / 180);
        const ancre = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "mid";
        const lignes = lignesDuNom(nom);
        const depart = -((lignes.length - 1) * 4.6);

        const tspans = lignes.map((ligne, n) =>
            `<tspan x="${x.toFixed(1)}" dy="${n === 0 ? depart.toFixed(1) : 9.2}">${esc(ligne)}</tspan>`
        ).join("");

        return `<text class="ros-axis ${ancre}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${tspans}</text>`;
    }).join("");

    // Le tracé de la maturité.
    //
    // Sans niveaux réels — c'est le cas de l'accueil, où aucune évaluation
    // n'existe encore — on montre un profil d'exemple, faute de quoi la page
    // s'ouvrirait sur une rosace plate qui n'apprend rien.
    //
    // Avec des niveaux réels, une tactique non évaluée vaut `null` : son sommet
    // se pose au centre et elle ne compte pas dans la moyenne. La confondre avec
    // un zéro ferait lire « aucune pratique » là où il n'y a qu'une absence de
    // mesure.
    const levels = tactiques.map((t, i) => reels
        ? reels.get(t.shortname) ?? null
        : DEMO_LEVELS[i % DEMO_LEVELS.length]);

    const notes = levels.filter(l => l !== null);
    const sum = notes.reduce((a, b) => a + b, 0);

    const points = levels.map((level, i) => polar(c, c, radiusOf(level ?? 0), angleOf(i)));
    const shape = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

    // Le contour se déroule par `stroke-dasharray` : il faut son périmètre exact,
    // segment de fermeture compris. Une valeur approchée le montrerait déjà
    // partiellement tracé au départ, ou couperait la fin de l'animation.
    const perimeter = points.reduce((total, [x, y], i) => {
        const [px, py] = points[(i + points.length - 1) % points.length];
        return total + Math.hypot(x - px, y - py);
    }, 0);

    // La pastille prend la couleur du palier le plus proche : la rampe n'a que
    // cinq teintes, une note de 2,3 se lit sur celle du 2.
    const vertices = levels.map((level, i) => {
        const [x, y] = polar(c, c, radiusOf(level ?? 0), angleOf(i));
        const classes = level === null ? "ros-dot vide" : `ros-dot l${Math.round(level)}`;
        const mot = level === null ? "non évaluée" : `niveau ${level.toFixed(1).replace(".", ",")}`;
        return `<circle class="${classes}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"
                        style="--i:${i}"><title>${esc(noms[i])} — ${mot}</title></circle>`;
    }).join("");

    // La moyenne ne porte que sur ce qui a été évalué : la diluer avec les
    // tactiques non mesurées ferait baisser la note à mesure qu'on découvre
    // l'étendue du référentiel, ce qui n'a aucun sens.
    const average = notes.length
        ? (sum / notes.length).toFixed(1).replace(".", ",")
        : "—";

    const label = reels
        ? `Rosace de maturité : niveau atteint sur les ${noms.length} tactiques d'ATT&CK Enterprise`
        : `Rosace d'exemple : niveau de maturité sur les ${noms.length} tactiques d'ATT&CK Enterprise`;

    // Le viewBox est plus large que le dessin, de `marge` de chaque côté : c'est
    // la couronne où s'écrivent les noms. Il déborde aussi un peu en hauteur, un
    // libellé sur deux lignes dépassant en haut et en bas du cercle.
    const vb = `${-marge} -8 ${size + marge * 2} ${size + 16}`;

    return `
        <figure class="rosace-figure">
            <svg class="rosace" viewBox="${vb}" role="img" aria-label="${esc(label)}">
                <g class="ros-web-group">${spokes}${webs}</g>
                <polygon class="ros-shape" points="${shape}" style="--tour:${perimeter.toFixed(0)}"/>
                <g class="ros-dots">${vertices}</g>
                <g class="ros-axes">${axes}</g>
                ${ticks}
                <!-- Le moyeu suit la note qu'il porte : à 30 px, « 1,9 » débordait
                     du disque de rayon r0 − 6. -->
                <circle class="ros-hub" cx="${c}" cy="${c}" r="${r0 - 1}"/>
                <text class="ros-value" x="${c}" y="${c + 3}">${average}</text>
                <text class="ros-unit" x="${c}" y="${c + 17}">/ 4</text>
            </svg>
        </figure>`;
}

/* ------------------------------------------------- la matrice en arrière-plan */

/* Une seule bande, et des cases plus grandes.
   Trois bandes de vitesses différentes donnaient trois fois la même découpe à
   trois hauteurs : la répétition sautait aux yeux et la matrice n'était plus
   reconnaissable, juste un motif. Une bande unique, avec des cases assez larges
   pour qu'on lise les en-têtes de tactique, redonne à l'accueil ce qu'il doit
   montrer — la vraie silhouette d'ATT&CK. */
const BACKDROP = {
    cellW: 92, cellH: 16, gap: 4,
    header: 26,        // hauteur de l'en-tête de tactique
    maxRows: 28,       // les tactiques les plus fournies sont écrêtées
    repeats: 2,        // blocs de matrice côte à côte dans une trame
    bands: 1,
    /* Plancher de largeur à couvrir. La largeur réelle est celle de la fenêtre,
       ce plancher lui laissant de la marge pour une rotation ou un
       redimensionnement — le fond n'est pas recomposé à chaque resize. Le nombre
       de copies s'en déduit plutôt que d'être fixé : la trame dépend du nombre de
       tactiques du référentiel, et une valeur en dur redeviendrait fausse si
       celui-ci changeait. Couvrir 4 K en toutes circonstances coûtait une copie
       de plus à tout le monde, téléphones compris, pour trois bandes à composer
       en continu. */
    coverFloor: 1440,
};

/** Durée de défilement. Lente : le fond doit vivre, pas attirer l'œil. */
const BAND_DURATIONS = [190];

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
    const cover = Math.max(BACKDROP.coverFloor, globalThis.innerWidth || 0);
    const copyCount = Math.max(2, Math.ceil(cover / width) + 1);
    const totalWidth = copyCount * width;

    // Chaque bande est un élément **HTML**, pas un groupe SVG.
    //
    // Ce n'est pas un détail de forme : WebKit n'anime pas de façon fiable une
    // transformation CSS posée sur un élément interne d'un SVG. Le fond restait
    // parfaitement immobile sur iOS quand il défilait sur Chrome. Translater un
    // `div` est en revanche le cas le mieux accéléré qui existe, partout.
    const strips = Array.from({ length: bands }, (_, b) => {
        const duration = BAND_DURATIONS[b % BAND_DURATIONS.length];

        // Deux bandes voisines ne doivent pas montrer la même découpe au même
        // moment. Le décalage est pris sur la **phase** de l'animation, par un
        // délai négatif, et non sur la position des copies : déplacer les copies
        // rognerait la couverture d'un côté ou de l'autre.
        const phase = -((b * duration) / bands).toFixed(1);

        const copies = Array.from({ length: copyCount }, (_, i) =>
            `<use href="#bd-tiles" x="${i * width}" y="0"/>`).join("");
        return `<div class="bd-band" style="--dur:${duration}s;--phase:${phase}s">
            <svg width="${totalWidth}" height="${bandHeight}"
                 viewBox="0 0 ${totalWidth} ${bandHeight}">${copies}</svg>
        </div>`;
    }).join("");

    // `--trame` est l'amplitude du défilement : le CSS anime de cette largeur
    // exactement, sans avoir à connaître la géométrie décrite ici.
    //
    // La trame ne vit qu'une fois, dans un SVG de définitions que les bandes
    // reprennent par `<use>` — c'est la technique du sprite, et elle marche entre
    // deux `<svg>` du même document. Ce conteneur n'est pas en `display:none` :
    // certains navigateurs cessent alors de résoudre les références.
    return `
        <div class="home-backdrop" aria-hidden="true" data-couvre="${cover}" style="--trame:${width}px">
            <svg class="bd-defs" width="0" height="0" aria-hidden="true" focusable="false">
                <defs><g id="bd-tiles">${parts.join("")}</g></defs>
            </svg>
            ${strips}
        </div>`;
}
