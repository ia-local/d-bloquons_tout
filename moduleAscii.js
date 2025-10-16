// Fichier : docs/utils/modulleAscii.js - Logique de construction ASCII Art (Frontend)

// --- 1. Définition des Caractères Tensor ---

/**
 * Caractères de bordure et de coin pour les cadres.
 * Utilisés principalement pour construire les boîtes de dialogue et les fenêtres.
 */
export const TENSOR_BORDERS = {
    CORNER_TOP_LEFT: '╔',
    CORNER_TOP_RIGHT: '╗',
    CORNER_BOTTOM_LEFT: '╚',
    CORNER_BOTTOM_RIGHT: '╝',
    LINE_HORIZONTAL: '═',
    LINE_VERTICAL: '║',
    JOINT_LEFT: '╠',
    JOINT_RIGHT: '╣',
    JOINT_TOP: '╦',
    JOINT_BOTTOM: '╩',
    JOINT_CROSS: '╬',
};

/**
 * Caractères de raccord ou de jointure pour les tableaux et les structures internes.
 * (Utilise les caractères de bordures doubles et de jonctions simples comme spécifié)
 */
export const TENSOR_JOINTS = {
    LINE_SIMPLE: '─',
    LINE_VERTICAL_SIMPLE: '│',
    JOINT_LEFT_T: '├',
    JOINT_RIGHT_T: '┤',
    JOINT_TOP_T: '┬',
    JOINT_BOTTOM_T: '┴',
    JOINT_CROSS: '┼',
    JOINT_LEFT_DOUBLE: '╠',
    JOINT_RIGHT_DOUBLE: '╣',
    JOINT_BOTTOM_DOUBLE: '╩',
};

/**
 * Caractères de rendu pour le remplissage, les points, les séparateurs et les graphiques.
 */
export const TENSOR_RENDER = {
    LINE_SIMPLE: '─',
    LINE_VERTICAL_SIMPLE: '│',
    POINT_SMALL: '·',
    POINT_MEDIUM: ':',
    SOLID_BLOCK: '█',
    LIGHT_BLOCK: '░', // Remplissage très léger
    FILL_LIGHT: '░', 
    FILL_MEDIUM: '▒', 
    FILL_HEAVY: '▓', 
    FILL_SOLID: '█', 
};
/**
 * Constante logique représentant une condition de bordure pour le remplissage.
 */
export const TENSOR_CONSTANTS = {
    BLOCK_CONDITION: "[x === width - 1] = 1",
    SOLID_BLOCK: '█',
    EMPTY_BLOCK: '░'
};

// --- Fonctions de Base de Rendu ASCII (omis pour la concision) ---
export function drawTensorLine(width) {
    let line = '';
    const { SOLID_BLOCK, EMPTY_BLOCK } = TENSOR_CONSTANTS;

    for (let x = 0; x < width; x++) {
        if (x === width - 1) {
            line += SOLID_BLOCK; 
        } else if (x === 0) {
            line += SOLID_BLOCK; 
        } else {
            line += EMPTY_BLOCK;
        }
    }
    return line;
}

export function drawSimpleFrame(title = "STATUS", width = 50, filler = TENSOR_RENDER.FILL_LIGHT) {
    const { CORNER_TOP_LEFT, CORNER_TOP_RIGHT, CORNER_BOTTOM_LEFT, CORNER_BOTTOM_RIGHT, LINE_HORIZONTAL, LINE_VERTICAL } = TENSOR_BORDERS;

    const title_line = `${LINE_VERTICAL}${title.padEnd(width)}${LINE_VERTICAL}`;
    const top_line = `${CORNER_TOP_LEFT}${LINE_HORIZONTAL.repeat(width)}${CORNER_TOP_RIGHT}`;
    const middle_line = `${LINE_VERTICAL}${filler.repeat(width)}${LINE_VERTICAL}`;
    const bottom_line = `${CORNER_BOTTOM_LEFT}${LINE_HORIZONTAL.repeat(width)}${CORNER_BOTTOM_RIGHT}`;

    return [
        top_line,
        title_line,
        middle_line,
        bottom_line
    ].join('\n');
}

export function drawAsciiList(items, width = 60) {
    const { LINE_VERTICAL, LINE_HORIZONTAL, CORNER_TOP_LEFT, CORNER_TOP_RIGHT, JOINT_LEFT, JOINT_RIGHT, CORNER_BOTTOM_LEFT, CORNER_BOTTOM_RIGHT } = TENSOR_BORDERS;
    const HEADER_WIDTH = width + 5; 

    let output = '';
    
    output += CORNER_TOP_LEFT + LINE_HORIZONTAL.repeat(HEADER_WIDTH) + CORNER_TOP_RIGHT + '\n';
    output += `${LINE_VERTICAL} [ 📜 Liste de Contrôle ] `.padEnd(HEADER_WIDTH + 1) + LINE_VERTICAL + '\n';
    output += JOINT_LEFT + LINE_HORIZONTAL.repeat(HEADER_WIDTH) + JOINT_RIGHT + '\n';

    items.forEach((item, index) => {
        const checkbox = index === 0 ? '[XX]' : '[__]';
        const content = `${checkbox} ${item}`;
        
        output += `${LINE_VERTICAL} ${content.padEnd(HEADER_WIDTH)} ${LINE_VERTICAL}\n`;
    });

    output += CORNER_BOTTOM_LEFT + LINE_HORIZONTAL.repeat(HEADER_WIDTH) + CORNER_BOTTOM_RIGHT;
    
    return output;
}

// 🛑 NOUVELLES CONSTANTES AGRÉGÉES (TENSORS FINALS) 🛑

/**
 * Tenseur final pour la création de tableaux.
 * Combinaison des bordures doubles (BORDERS) et des jonctions simples (JOINTS) pour le contenu.
 */
export const TENSOR_TABLEAU = 
    TENSOR_BORDERS.CORNER_TOP_LEFT + TENSOR_BORDERS.CORNER_TOP_RIGHT + TENSOR_BORDERS.CORNER_BOTTOM_LEFT + TENSOR_BORDERS.CORNER_BOTTOM_RIGHT +
    TENSOR_BORDERS.LINE_HORIZONTAL + TENSOR_BORDERS.LINE_VERTICAL + 
    TENSOR_JOINTS.JOINT_LEFT_T + TENSOR_JOINTS.JOINT_RIGHT_T + TENSOR_JOINTS.JOINT_TOP_T + TENSOR_JOINTS.JOINT_BOTTOM_T + TENSOR_JOINTS.JOINT_CROSS;

/**
 * Tenseur final pour la création de graphiques et de barres de progression.
 * Utilise les caractères de rendu pour les barres, lignes et remplissage.
 */
export const TENSOR_CHART = 
    TENSOR_RENDER.LINE_SIMPLE + TENSOR_RENDER.LINE_VERTICAL_SIMPLE + 
    TENSOR_RENDER.POINT_SMALL + TENSOR_RENDER.POINT_MEDIUM + 
    TENSOR_RENDER.FILL_LIGHT + TENSOR_RENDER.FILL_MEDIUM + TENSOR_RENDER.FILL_HEAVY + TENSOR_RENDER.FILL_SOLID;
