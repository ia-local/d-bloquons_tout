// Fichier : public/src/js/layerModal.js
// Ce module gère l'interface d'ouverture des différentes modales de l'application.

// Importations des fonctions d'ouverture de modales spécifiques
// 🛑 IMPORTANT : Ces fichiers ('./boycottageForm.js', './modalLegend.js', './ipCam.js')
// doivent exister dans votre structure de projet pour que ce fichier fonctionne.
import { openBoycottageFormModal } from './boycottageForm.js';
import { openModalLegend } from './modalLegend.js';
import { openIpCamModal } from './ipCam.js';

/**
 * Gère l'ouverture de la modale de formulaire de boycottage.
 */
export function openBoycottageModal() {
    console.log("Ouverture de la modale de boycottage demandée.");
    openBoycottageFormModal();
}

/**
 * Gère l'ouverture de la modale de la légende pour afficher les détails d'un point
 * de données (enrichi avec média).
 * * @param {string} id L'ID unique du point de données (ex: marche-climat_1).
 * @param {string} type Le type de l'objet (ex: 'Marche pour le climat').
 */
export function openLegendModal(id, type) {
    console.log(`Ouverture de la modale légende demandée pour ID: ${id}, Type: ${type}.`);
    // C'est ici que openModalLegend doit désormais contenir la logique pour:
    // 1. Chercher les données complètes de l'objet (y compris mediaSource et mediaType)
    // 2. Construire la modale pour afficher le titre, la description ET le contenu média (vidéo/image).
    openModalLegend(id, type);
}

/**
 * Gère l'ouverture de la modale pour les flux vidéo (caméras IP, etc.).
 * Cette fonction réutilise la logique existante pour les flux vidéo externes.
 * * @param {string} videoUrl L'URL du flux vidéo.
 * @param {string} title Le titre de la modale.
 */
export function openIpCam(videoUrl, title) {
    console.log(`Ouverture de la modale IP Cam demandée pour URL: ${videoUrl}, Titre: ${title}.`);
    openIpCamModal(videoUrl, title);
}
