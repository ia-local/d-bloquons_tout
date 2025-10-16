
// docs/post-it.js - Module de rendu pour le composant réutilisable Post-it (P3.4)

/**
 * Charge les données des post-its et les rend dans un conteneur spécifié.
 * @param {string} containerId L'ID du conteneur DOM où injecter la grille.
 * @param {string} endpoint L'endpoint API pour charger les données (utilise fetchData).
 */
export async function renderPostItGrid(containerId, endpoint = '/api/post-it/notes') {
    const container = document.getElementById(containerId);
    if (!container) return console.error(`Conteneur Post-it #${containerId} non trouvé.`);

    container.innerHTML = `<p style="text-align: center;">Chargement des notes...</p>`;

    try {
        // NOTE: On suppose que fetchData est global (défini dans app.js)
        const notes = await window.fetchData(endpoint); 

        if (!notes || notes.length === 0) {
            container.innerHTML = `<p class="font-yellow" style="text-align: center;">Aucune note post-it à afficher.</p>`;
            return;
        }

        let htmlContent = '<div class="post-it-grid">';

        notes.forEach(note => {
            const date = new Date(note.date).toLocaleDateString('fr-FR');
            
            // Applique le template HTML directement
            let cardHTML = `
                <div class="post-it-card" data-post-it-id="${note.id}" data-color="${note.color || 'yellow'}">
                    <h4 class="post-it-title">${note.title}</h4>
                    <p class="post-it-body">${note.content}</p>
                    <span class="post-it-date">${date}</span>
                </div>
            `;
            htmlContent += cardHTML;
        });

        htmlContent += '</div>';
        
        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Erreur lors du rendu du Post-it:", error);
        container.innerHTML = `<p class="font-red" style="text-align: center;">Échec du chargement des post-its (API/JSON).</p>`;
    }
}

// NOTE: Pour intégrer ce module, vous devez l'importer dans le fichier JS de la page cible
// et l'appeler : renderPostItGrid('ID_DU_CONTENEUR').
