// docs/journal.js - Logique de rendu de la page Journal (P3.3)

/**
 * Charge les entrées du journal depuis l'API et rend la liste.
 * Appelé par app.js::window.showPage('journal') après le chargement du HTML.
 */
window.loadJournalEntries = async function() {
    const container = document.getElementById('journal-entries-grid');
    if (!container || container.hasLoaded) return;
    
    container.innerHTML = `<p style="text-align: center; margin-top: 30px;">📡 Récupération des données du Journal de Bord...</p>`;
    
    try {
        // 🛑 Appel API : /api/journal/entries
        const entries = await window.fetchData('/api/journal/entries');
        
        if (!entries || entries.length === 0) {
            container.innerHTML = `<p class="font-yellow" style="text-align: center;">Aucune entrée de journal trouvée pour le moment.</p>`;
            container.hasLoaded = true;
            return;
        }

        const entriesHTML = entries.map(entry => {
            const date = new Date(entry.date).toLocaleDateString('fr-FR');
            const summary = entry.content.substring(0, 100) + '...';

            return `
                <div class="journal-entry-card" data-entry-id="${entry.id}">
                    <h4>${entry.title}</h4>
                    <p class="entry-meta">Catégorie: ${entry.category} | ${date}</p>
                    <p>${summary}</p>
                    <button class="btn btn-sm btn-link" onclick="window.handleUserAction('journal-detail', '${entry.id}')">
                        Lire le détail <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = entriesHTML;
        container.hasLoaded = true;

        // Attachement des écouteurs de clics pour les cartes entières
        const cards = container.querySelectorAll('.journal-entry-card');
        cards.forEach(card => {
             card.addEventListener('click', (e) => {
                 // Ne pas ouvrir la modale si l'utilisateur clique directement sur le bouton "Lire le détail"
                 if (!e.target.closest('button')) {
                    window.handleUserAction('journal-detail', card.getAttribute('data-entry-id'));
                 }
             });
        });

    } catch (error) {
        console.error("Erreur critique lors du chargement du journal:", error);
        container.innerHTML = `<p class="font-red" style="text-align: center;">❌ Échec du chargement du Journal. Vérifiez l'API /api/journal/entries.</p>`;
    }
}
