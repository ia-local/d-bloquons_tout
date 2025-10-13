// Fichier : services/dataService.js (Version finale et générique)

const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_PATH = path.join(__dirname, '..','src','json','map', 'manifestation.json');

// --- Fonctions utilitaires ---
const readData = async () => JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
const writeData = async (data) => fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));

// --- Fonctions CRUD Génériques ---

const getAllData = () => readData();

const addElement = async (section, elementData) => {
    const data = await readData();
    if (!data[section] || !Array.isArray(data[section])) {
        throw new Error(`La section '${section}' n'existe pas ou n'est pas une liste.`);
    }
    const newElement = { id: `${section.slice(0, 3)}_${uuidv4()}`, ...elementData };
    data[section].push(newElement);
    await writeData(data);
    return newElement;
};

const updateElement = async (section, id, updates) => {
    const data = await readData();
    if (!data[section] || !Array.isArray(data[section])) {
        throw new Error(`La section '${section}' n'existe pas.`);
    }
    const elementIndex = data[section].findIndex(el => el.id === id);
    if (elementIndex === -1) throw new Error(`Élément avec l'ID '${id}' non trouvé dans '${section}'.`);
    
    data[section][elementIndex] = { ...data[section][elementIndex], ...updates };
    await writeData(data);
    return data[section][elementIndex];
};

const deleteElement = async (section, id) => {
    const data = await readData();
    if (!data[section] || !Array.isArray(data[section])) {
        throw new Error(`La section '${section}' n'existe pas.`);
    }
    const initialLength = data[section].length;
    data[section] = data[section].filter(el => el.id !== id);
    if (data[section].length === initialLength) {
        throw new Error(`Élément avec l'ID '${id}' non trouvé, suppression impossible.`);
    }
    await writeData(data);
};

module.exports = {
    getAllData,
    addElement,
    updateElement,
    deleteElement
};