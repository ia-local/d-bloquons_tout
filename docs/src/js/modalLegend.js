// Fichier : public/src/js/modalLegend.js (CORRECTION RECHERCHE PAR ID/VILLE ET ID COMPLEXE)

import { renderSyndicats } from './modalSyndicats.js';
import { renderClimat } from './modalClimat.js'; 
import { renderOrganisation } from './modalOrganisation.js'; 
import { renderCnccfpPartis } from './modalCnccfpPartis.js';
import { renderMairies } from './modalMairies.js';
import { renderRassemblement } from './modalRassemblement.js'; // 🛑 NOUVEL IMPORT

let globalDataCache = {}; 

export function setGlobalDataCache(data) {
    globalDataCache = data;
}

/**
 * Tente de retrouver les données enrichies (avec média) d'un point.
 * @param {string} itemId L'ID unique du point (qui est l'ID original, l'ID de la ville, ou le nom du point).
 * @param {string} itemCategory Le nom de la catégorie (ex: "Parti Politique").
 */
function findEnrichedItem(itemId, itemCategory) {
    
    let dataKey = null;
    let searchId = String(itemId).trim(); 
    
    // 🛑 NOUVELLE LOGIQUE CRITIQUE : Simplifier l'ID si c'est un ID complexe de sous-action.
    // L'ID complexe contient les coordonnées ou le type (ex: manif-18-01_Manifestation_42.7011).
    // Nous avons besoin uniquement de l'ID principal (manif-18-01) pour trouver la bonne entrée JSON.
    let simpleId = searchId;
    if (searchId.includes('_')) {
        simpleId = searchId.split('_')[0];
    }
    
    // 1. DÉTERMINATION DU dataKey basée sur la CATEGORIE
    if (itemCategory) {
        const normalizedCategory = itemCategory.toLowerCase().trim();
        
        // 🛑 CAS DES MANIFESTATIONS/RASSEMBLEMENTS : recherche dans tous les fichiers manif
        if (normalizedCategory.includes("rassemblement") || normalizedCategory.includes("manifestation") || normalizedCategory.includes("blocage") || normalizedCategory.includes("grève") || normalizedCategory.includes("opérations spéciales")) { 
            const manifKeys = ['manifestation_points_10_septembre', 'manifestation_points_18_septembre', 'manifestation_points_2_octobre', 'manifestations'];
            
            for (const key of manifKeys) {
                const items = globalDataCache[key];
                if (items && Array.isArray(items)) {
                    // Recherche de l'item PAR L'ID SIMPLE
                    let item = items.find(i => 
                        String(i.id).trim() === simpleId || 
                        String(i.city || '').trim() === simpleId || 
                        String(i.name || '').trim() === simpleId
                    );
                    if (item) {
                        dataKey = key;
                        // Renvoyer l'item trouvé immédiatement, car on a géré la complexité de l'ID en amont.
                        console.log(`[MODAL SUCCESS] Élément trouvé dans la clé: ${dataKey}`);
                        return item;
                    }
                }
            }
            // Si l'item n'est pas trouvé dans les fichiers manif, on continue la fonction.
        }
        
        // 🛑 CAS RESTANTS (Déduction simple par catégorie)
        else if (normalizedCategory.includes("climat")) { 
            dataKey = 'marche_climat';
        }
        else if (normalizedCategory.includes("syndical")) { 
            dataKey = 'syndicats';
        }
        else if (normalizedCategory.includes("parti")) { 
            dataKey = 'cnccfp_partis';
        }
        else if (normalizedCategory.includes("organisation")) { 
            dataKey = 'organisation';
        }
        // Cas administratifs
        else if (normalizedCategory.includes("préfecture")) {
            dataKey = 'prefectures';
        } else if (normalizedCategory.includes("élysée")) {
            dataKey = 'elysee';
        } else if (normalizedCategory.includes("impôts")) {
             dataKey = 'taxes';
        } else if (normalizedCategory.includes("mairie")) { 
            dataKey = 'mairies'; 
        }
        // Déduction des réseaux sociaux
        else if (["telegram", "signal", "whatsapp", "facebook", "instagram", "youtube", "site"].some(t => normalizedCategory.includes(t))) {
             dataKey = 'reseau';
        }
    }
    
    if (!dataKey) {
        console.error(`[MODAL CRITICAL FAIL] Impossible de déterminer le DataKey pour ID: ${itemId}, Catégorie: ${itemCategory}.`);
        return null;
    }

    const items = globalDataCache[dataKey];
    if (!items || !Array.isArray(items)) {
        console.error(`[MODAL FAIL] DataKey déterminé '${dataKey}' mais non trouvé dans le cache global.`);
        return null;
    }
    
    // 2. RECHERCHE D'ITEM CIBLÉE ROBUSTE (pour les cas non-manifestations)
    let item = null;
    
    // Recherche A: ID exact (numérique ou chaîne) / Nom de Ville / Nom de l'item (Utilisation de searchId car simpleId n'est pertinent que pour les manif)
    item = items.find(i => 
        String(i.id).trim() === searchId || 
        String(i.city || '').trim() === searchId || 
        String(i.name || '').trim() === searchId ||
        String(i.department || '').trim() === searchId
    );
    
    // Recherche B: ID numérique tolérant 
    if (!item) {
        item = items.find(i => i.id == searchId); 
    }
    
    // Le code d'origine pour la Recherche C (ID complexe) n'est plus nécessaire ici
    // car il est géré par la logique "simpleId" dans le bloc des manifestations.

    if (!item) {
        console.error(`[MODAL DEBUG] Échec de la recherche pour ID: ${itemId}. DataKey: ${dataKey}.`);
    } else {
        console.log(`[MODAL SUCCESS] Élément trouvé dans la clé: ${dataKey}`);
    }

    return item;
}


export async function openModalLegend(itemId, itemCategory) {
// ... (Reste de la fonction openModalLegend inchangé)
    const item = findEnrichedItem(itemId, itemCategory);

    if (!item) {
        return;
    }
    
    let modal = document.getElementById('legend-modal');
    if (!modal) {
        modal = createModalStructure();
    }
    
    const modalBody = document.getElementById('legend-modal-body');
    modalBody.innerHTML = getItemContent(item);
    
    modal.style.display = 'block';
}

function createModalStructure() {
// ... (Fonction inchangée)
    const modal = document.createElement('div');
    modal.id = 'legend-modal';
    modal.className = 'modal-legend';
    modal.innerHTML = `
        <div class="modal-legend-content">
            <span class="close-btn" id="close-legend-modal-btn">&times;</span>
            <div id="legend-modal-body" class="modal-body-content">
                </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('close-legend-modal-btn');
    closeBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    return modal;
}

function getItemContent(item) {
// ... (Fonction inchangée)
    
    let mediaHTML = '';
    // Utilisation du champ 'video_link' spécifique aux rassemblements s'il existe
    if (item.video_link) {
        // Le rendu de la vidéo est géré directement par renderRassemblement, mais
        // ici on gère le cas de 'mediaSource' pour la compatibilité avec d'autres types.
        // On laisse mediaHTML vide pour le rassemblement afin d'éviter les doublons.
        mediaHTML = ''; 
    }
    else if (item.mediaSource && item.mediaType) {
        if (item.mediaType === 'video') {
            mediaHTML = `<div class="modal-media-video"><iframe width="100%" height="315" src="${item.mediaSource}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
        } else if (item.mediaType === 'image') {
            mediaHTML = `<div class="modal-media-image"><img src="${item.mediaSource}" alt="${item.name || 'Image Média'}" style="width: 100%; height: auto;"></div>`;
        }
    }
    
    let specificDetails = '';
    
    // LOGIQUE DE RENDU FACTORISÉE ET ROUTÉE COMPLÈTE
    const itemTypeNormalized = (item.type || '').toLowerCase();
    
    if (itemTypeNormalized.includes("rassemblement") || itemTypeNormalized.includes("manifestation") || itemTypeNormalized.includes("blocage") || itemTypeNormalized.includes("grève") || itemTypeNormalized.includes("opérations spéciales")) {
        specificDetails = renderRassemblement(item); // 🛑 ROUTAGE VERS LE RENDER RASSEMBLEMENT
    } else if (itemTypeNormalized.includes("siège syndical")) {
        specificDetails = renderSyndicats(item);
    } else if (itemTypeNormalized.includes("marche") && itemTypeNormalized.includes("climat")) {
         specificDetails = renderClimat(item);
    } else if (itemTypeNormalized.includes("organisation locale")) {
         specificDetails = renderOrganisation(item);
    } else if (itemTypeNormalized.includes("parti politique")) {
         specificDetails = renderCnccfpPartis(item);
    } else if (itemTypeNormalized.includes("mairie")) { 
         specificDetails = renderMairies(item);
    } 
    else {
        // Rendu par défaut si non spécifié
        specificDetails = `
            <h4>Informations Générales</h4>
            <p>Pas de détails spécifiques pour ce type de point (Type: ${item.type || 'Non défini'}).</p>
        `;
    }
    
    return `
        <div class="modal-header">
            <h2>${item.name || item.title || 'Détails Événement'}</h2>
        </div>
        <div class="modal-body">
            ${mediaHTML}
            
            ${specificDetails}

            <h4>Détails Généraux</h4>
            <p>${item.description || 'Description non disponible.'}</p>
            <p><strong>Type de Point:</strong> ${item.type || 'Non spécifié'}</p>
            <p><strong>Localisation:</strong> ${item.city ? item.city + ', ' : ''} (${item.lat}, ${item.lon})</p>
        </div>
    `;
}