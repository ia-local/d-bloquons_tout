// Fichier: js/app.js (Logique pour la navigation statique)

document.addEventListener('DOMContentLoaded', () => {
    // Logique de navigation (simulée pour le mode statique GitHub Pages)
    const navLinks = document.querySelectorAll('#bottom-navigation-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.dataset.action;
            
            // Simulation d'une action pour la démo statique
            if (action === 'map') {
                console.log('Action: Afficher la carte.');
                // Ici, vous rechargeriez la carte ou le conteneur principal
            } else {
                alert(`Navigation vers l'action : ${action}. (Fonctionnalité en cours de développement)`);
            }

            // Mettre en évidence le bouton actif
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Optionnel: Initialiser la carte sur la page par défaut
    if (window.initMapStatic) {
        window.initMapStatic();
    }
});