// Fichier : public/src/js/modalOrganisation.js

/**
 * Génère le contenu HTML spécifique pour les organisations locales.
 */
export function renderOrganisation(item) {
    return `
        <div class="specific-details">
            <h4>Structure Locale / Association</h4>
            <p><strong>Affiliation:</strong> ${item.type || 'Non spécifié'}</p>
            <p><strong>Objectif:</strong> ${item.description || 'Description non disponible.'}</p>
        </div>
    `;
}