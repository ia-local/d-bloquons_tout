// Fichier : services/utils.js

function cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    // Assurez-vous que les vecteurs ont la même taille, sinon gérer l'erreur
    if (v1.length !== v2.length) {
        throw new Error("Les vecteurs n'ont pas la même dimension pour la similarité cosinus.");
    }
    
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        magnitude1 += v1[i] ** 2;
        magnitude2 += v2[i] ** 2;
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    // Éviter la division par zéro
    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
}

module.exports = {
    cosineSimilarity
};