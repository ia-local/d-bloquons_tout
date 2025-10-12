// docs/ric.js - Logique de Rendu spécifique au Référendum d'Initiative Citoyenne (RIC)

window.loadRICContent = async function() {
    const container = document.getElementById('ric-content-container');
    if (container.hasLoaded) return; 

    // Gérer l'affichage temporaire du bouton et le message de chargement
    container.innerHTML = '<div><p class="font-yellow" style="margin-top: 15px;">Récupération des détails du Référendum d\'Initiative Citoyenne...</p></div>';

    try {
        const ricData = await window.fetchData('/api/ric/data');

        // Rendu des cartes RIC
        const typeCards = ricData.types.map((type, index) => `
            <div class="feature-card ric-card-trigger" data-ric-index="${index}" style="transform: none; background: var(--color-ui-primary); border-color: var(--color-accent-red); color: var(--color-text); cursor: pointer;">
                <h4 class="font-yellow" style="font-size: 1.1em;">${type.name}</h4>
                <p style="font-size: 0.9em; margin-top: 5px; color: var(--color-text);">${type.desc}</p>
            </div>
        `).join('');

        // Rendu de la séparation des pouvoirs
        const powersHtml = ricData.separation_of_powers.map(p => `
            <div class="feature-card" style="background: var(--color-ui-content); padding: 15px; border-left: 5px solid var(--color-accent-yellow);">
                <i class="${p.icon} font-red" style="font-size: 1.5em;"></i>
                <h4 class="font-yellow" style="margin-top: 5px;">${p.power}</h4>
                <p style="font-size: 0.9em;">${p.description}</p>
                <p style="font-size: 0.8em; color: #aaa; margin-top: 5px;">* ${p.details}</p>
            </div>
        `).join('');


        const ricHtml = `
            <div class="content" style="transform: rotate(0.5deg); margin-bottom: 20px;">
                <h3 class="font-red">🏛️ Qu'est-ce que le RIC ?</h3>
                <p style="margin-top: 10px;">${ricData.definition}</p>
                <p style="margin-top: 15px; font-weight: bold;">Le RIC est notre proposition fondamentale pour restaurer la souveraineté populaire.</p>
                
                <a href="${ricData.manifestoLink}" target="_blank" class="btn btn-secondary" style="
                    display: inline-block; margin-top: 15px; padding: 8px 15px; 
                    background: var(--color-accent-red); color: white; 
                    border: 2px solid white; font-weight: bold;
                    ">
                    👉 Lire l'intégralité de la proposition de réforme (Manifeste)
                </a>
            </div>
            
            <div class="content" style="transform: rotate(-0.5deg); margin-bottom: 30px;">
                <h3 class="font-red">✅ Séparation des Pouvoirs & Processus</h3>
                <div class="feature-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-top: 15px;">
                    ${powersHtml}
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <button data-action="ric-form" class="btn btn-primary" id="propose-ric-btn">
                    <i class="fas fa-edit"></i> Soumettre ma Proposition de RIC
                </button>
            </div>

            <div class="content" style="transform: rotate(-0.5deg);">
                <h3 class="font-red">📋 Les 4 Piliers du RIC (Cliquez pour les détails)</h3>
                <div id="ric-feature-grid" class="feature-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 15px;">
                    ${typeCards}
                </div>
            </div>
        `;

        // 1. INJECTION DU CONTENU COMPLET DANS LE DOM
        container.innerHTML = ricHtml;
        
        // 2. 🛑 ATTACHEMENT SÉCURISÉ DES ÉCOUTEURS
        if (window.handleUserAction) {
            // Bouton "Soumettre ma Proposition de RIC"
            const proposeRicBtn = document.getElementById('propose-ric-btn');
            if (proposeRicBtn) {
                 proposeRicBtn.addEventListener('click', (e) => {
                     e.preventDefault();
                     window.handleUserAction('ric-form');
                 });
            }
            
            // Cartes pour les détails spécifiques (ric-detail)
            const ricCards = container.querySelectorAll('.ric-card-trigger');
            ricCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    const ricIndex = card.getAttribute('data-ric-index'); 
                    window.handleUserAction('ric-detail', ricIndex); 
                });
            });
        } else {
             console.error("Erreur d'initialisation: window.handleUserAction n'est pas prêt.");
        }


        container.hasLoaded = true;

    } catch (error) {
        console.error("Erreur lors du chargement du contenu RIC (Simulé):", error);
        container.innerHTML = `<p class="font-red">❌ Échec du chargement du contenu RIC. Veuillez vérifier la connexion aux données.</p>`;
    }
};