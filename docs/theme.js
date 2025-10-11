// Fichier: theme.js (Logique pour basculer entre dark/light mode)

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Fonction pour appliquer le thème
    function applyTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Mettre à jour l'icône
        if (theme === 'dark') {
            themeToggle.innerHTML = '☀️';
            themeToggle.title = 'Passer en mode Clair';
        } else {
            themeToggle.innerHTML = '🌙';
            themeToggle.title = 'Passer en mode Sombre';
        }
    }

    // Charger le thème depuis le stockage local
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Écouteur d'événement pour le bouton
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
});