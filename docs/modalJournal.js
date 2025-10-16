// docs/modalJournal.js - Logique de gestion de la Modale de Détail du Journal (P3.3)

/**
 * Gestionnaire d'action pour ouvrir la modale de détail d'une entrée de journal.
 * Cette fonction est appelée par window.handleUserAction('journal-detail', entryId).
 * @param {string} entryId ID de l'entrée de journal à afficher.
 */
window.handleJournalDetailAction = async function(entryId) {
    if (!window.openModal || !window.fetchData) {
        console.error("Dépendances modales non disponibles.");
        return;
    }
    
    // 🛑 Endpoint pour la récupération d'une seule entrée (contrat API)
    const endpoint = `/api/journal/entry/${entryId}`;
    const title = `Chargement de l'Entrée #${entryId}...`;

    // 1. Affichage immédiat du spinner
    const loadingContent = `<p style="text-align: center;"><div class="loading-spinner"></div><br>Chargement de l'entrée...</p>`;
    window.openModal(title, loadingContent); 

    try {
        // 2. Appel API asynchrone pour les détails
        const data = await window.fetchData(endpoint); 

        if (!data || !data.title) {
            throw new Error('Données de journal introuvables ou incomplètes.');
        }

        // 3. Construction du contenu HTML détaillé
        const detailHTML = `
            <div class="journal-detail-container">
                <h3 class="font-red" style="margin-bottom: 5px;">${data.title}</h3>
                <p class="entry-meta-detail">
                    <i class="fas fa-calendar-alt"></i> ${new Date(data.date).toLocaleDateString('fr-FR')} | 
                    <i class="fas fa-tag"></i> ${data.category}
                </p>
                <hr style="border-top: 1px dashed var(--color-ui-border); margin: 15px 0;">
                
                <p style="white-space: pre-wrap; margin-bottom: 20px;">${data.content}</p>
                
                ${data.sources ? `<p><b>Sources/Références :</b> ${data.sources}</p>` : ''}
                
                <div style="text-align: center; margin-top: 25px;">
                    <button class="btn btn-secondary" onclick="window.closeModal()">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        // 4. Mise à jour de la modale avec le contenu final
        window.openModal(`📰 Journal : ${data.title}`, detailHTML);

    } catch (error) {
        console.error(`Erreur de chargement de l'entrée de journal ${entryId}:`, error);
        window.openModal(`Erreur Journal : ${entryId}`, `<p class="font-red" style="text-align: center;">❌ Échec du chargement du détail : ${error.message}.</p>`);
    }
}
