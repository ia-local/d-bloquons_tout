// Fichier : utils/modulleAscii.js - Logique de construction ASCII Art (CommonJS pour Node.js)

// --- 1. Définition des Caractères Tensor ---

/**
 * Caractères de bordure et de coin pour les cadres.
 */
const TENSOR_BORDERS = {
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
 */
const TENSOR_JOINTS = {
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
const TENSOR_RENDER = {
    LINE_SIMPLE: '─',
    LINE_VERTICAL_SIMPLE: '│',
    POINT_SMALL: '·',
    POINT_MEDIUM: ':',
    SOLID_BLOCK: '█',
    LIGHT_BLOCK: '░', 
    FILL_LIGHT: '░', 
    FILL_MEDIUM: '▒', 
    FILL_HEAVY: '▓', 
    FILL_SOLID: '█', 
};
/**
 * Constante logique représentant une condition de bordure pour le remplissage.
 */
const TENSOR_CONSTANTS = {
    BLOCK_CONDITION: "[x === width - 1] = 1",
    SOLID_BLOCK: '█',
    EMPTY_BLOCK: '░'
};

// --- Fonctions de Base de Rendu ASCII (simplifiées pour la CJS) ---
// Note: Les fonctions utilitaires complètes drawAsciiTable, drawSimpleFrame, etc., ne sont pas incluses 
// dans ce module Node.js car elles sont seulement utilisées par le Frontend, mais leurs constantes le sont.

// 🛑 NOUVELLES CONSTANTES AGRÉGÉES (TENSORS FINALS) 🛑

/**
 * Tenseur final pour la création de tableaux.
 */
const TENSOR_TABLEAU = 
    TENSOR_BORDERS.CORNER_TOP_LEFT + TENSOR_BORDERS.CORNER_TOP_RIGHT + TENSOR_BORDERS.CORNER_BOTTOM_LEFT + TENSOR_BORDERS.CORNER_BOTTOM_RIGHT +
    TENSOR_BORDERS.LINE_HORIZONTAL + TENSOR_BORDERS.LINE_VERTICAL + 
    TENSOR_JOINTS.JOINT_LEFT_T + TENSOR_JOINTS.JOINT_RIGHT_T + TENSOR_JOINTS.JOINT_TOP_T + TENSOR_JOINTS.JOINT_BOTTOM_T + TENSOR_JOINTS.JOINT_CROSS;

/**
 * Tenseur final pour la création de graphiques et de barres de progression.
 */
const TENSOR_CHART = 
    TENSOR_RENDER.LINE_SIMPLE + TENSOR_RENDER.LINE_VERTICAL_SIMPLE + 
    TENSOR_RENDER.POINT_SMALL + TENSOR_RENDER.POINT_MEDIUM + 
    TENSOR_RENDER.FILL_LIGHT + TENSOR_RENDER.FILL_MEDIUM + TENSOR_RENDER.FILL_HEAVY + TENSOR_RENDER.FILL_SOLID;


// 🛑 EXPORTATION COMMONJS 🛑
module.exports = {
    TENSOR_BORDERS,
    TENSOR_JOINTS,
    TENSOR_RENDER,
    TENSOR_CONSTANTS,
    TENSOR_TABLEAU,
    TENSOR_CHART
};
