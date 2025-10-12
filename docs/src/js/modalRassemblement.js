// Fichier : public/src/js/modalRassemblement.js

/**
 * Génère le contenu HTML spécifique pour un point de rassemblement ou de manifestation.
 * @param {object} item L'objet de données enrichi (trouvé via findEnrichedItem).
 * @returns {string} Le contenu HTML spécifique.
 */
export function renderRassemblement(item) {
    
    let videoHTML = '';
    // Utilise le champ 'video_link' que vous avez fourni dans vos données JSON
    if (item.video_link) {
        // Le lien YouTube simple doit être transformé en lien embed
        let embedUrl = item.video_link;
        if (embedUrl.includes("youtube.com/watch?v=")) {
            embedUrl = embedUrl.replace("watch?v=", "embed/");
        } else if (embedUrl.includes("youtu.be/")) {
             embedUrl = embedUrl.replace("youtu.be/", "www.youtube.com/embed/");
        }
        
        videoHTML = `
            <div class="modal-media-video">
                <h4>Vidéo Source</h4>
                <iframe 
                    width="100%" 
                    height="315" 
                    src="${embedUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }

    return `
        <div class="modal-specific-details">
            <h4>Détails de la Manifestation</h4>
            <p><strong>Ville:</strong> ${item.city || 'Non spécifié'}</p>
            <p><strong>Estimation:</strong> ${item.count > 0 ? item.count.toLocaleString() + ' personnes' : 'Non estimé'}</p>
            <p><strong>Source:</strong> ${item.source || 'Non spécifié'}</p>
            ${videoHTML}
        </div>
    `;
}