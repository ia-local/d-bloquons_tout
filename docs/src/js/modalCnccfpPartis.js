// Fichier : public/src/js/modalCnccfpPartis.js

/**
 * Génère le contenu HTML spécifique pour les partis politiques (cnccfp).
 * @param {Object} item - Le point de donnée enrichi.
 * @returns {string} Le contenu HTML spécifique.
 */
export function renderCnccfpPartis(item) {
    const acronym = item.name || 'N/A';
    const fullName = item.parnom || 'Non spécifié';

    return `
        <div class="specific-details">
            <h4>Parti Politique</h4>
            <p><strong>Nom Complet:</strong> ${fullName}</p>
            <p><strong>Acronyme:</strong> ${acronym}</p>
            <p><strong>Code CNCCFP:</strong> ${item.cnccfp || 'Non déclaré'}</p>
        </div>
    `;
}
