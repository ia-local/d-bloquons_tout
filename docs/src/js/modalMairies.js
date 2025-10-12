/**
 * Génère le contenu HTML spécifique pour les Mairies.
 */
export function renderMairies(item) {
    return `
        <div class="specific-details">
            <h4>Détails de l'Administration Communale</h4>
            <p><strong>Département:</strong> ${item.department || 'Non spécifié'}</p>
            <p><strong>Niveau Administratif:</strong> ${item.level || 'Non spécifié'}</p>
            <p><strong>Type de Lieu:</strong> ${item.type || 'Mairie'}</p>
        </div>
    `;
}