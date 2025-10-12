// Fichier: js/map.js

let mapInstance;

/**
 * Fonction d'initialisation de la carte Leaflet.
 * Pour le déploiement statique sur GitHub Pages, nous utilisons des fonds de carte publics.
 */
export function initMapStatic() {
    const defaultCenter = [46.603354, 1.888334]; // Centre de la France
    const defaultZoom = 6;
    
    // Vérifier si le conteneur 'map' existe
    if (!document.getElementById('map')) {
        console.error("Le conteneur de carte #map n'a pas été trouvé. Assurez-vous que index.html est correct.");
        return;
    }

    // Création de l'instance de carte
    mapInstance = L.map('map').setView(defaultCenter, defaultZoom);

    // Ajout du fond de carte (OpenStreetMap pour la compatibilité GitHub Pages)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(mapInstance);

    // --- Placeholder : Affichage de points statiques ---
    // Sur GitHub Pages, nous devrions charger les données JSON directement (sans API Node.js).
    // Exemple de point statique pour la démonstration:
    L.marker([48.8566, 2.3522]).addTo(mapInstance)
        .bindPopup("<b>Paris</b><br>Point de ralliement stratégique.")
        .openPopup();
        
    console.log("Carte Leaflet initialisée pour GitHub Pages.");
}

// Assurez-vous que la fonction d'initialisation est appelée au chargement
document.addEventListener('DOMContentLoaded', initMapStatic);