// Fichier : public/src/js/modalSyndicats.js

/**
 * Génère le contenu HTML spécifique pour les sièges syndicaux.
 */
export function renderSyndicats(item) {
    const affiliations = item.syndicats && Array.isArray(item.syndicats) ? item.syndicats.join(', ') : 'Non spécifié';

    return `
        <div class="specific-details">
            <h4>Structure Syndicale</h4>
            <p><strong>Affiliations Déclarées:</strong> ${affiliations}</p>
            <p><strong>Rôle:</strong> Siège national ou départemental.</p>
        </div>
    `;
}