// modalProfile.js - Gestion et Affichage de l'État de l'Agent

// Tableau des seuils de niveau (doit être cohérent avec toute l'application)
const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, title: "Agent Novice" },
    { level: 2, xp: 500, title: "Opérateur de Veille" },
    { level: 3, xp: 1500, title: "Planificateur Tactique" },
    { level: 4, xp: 3000, title: "Architecte de la Résistance" },
];
/**
 * Retourne le seuil d'XP nécessaire pour le niveau actuel ou le prochain.
 */
export function getNextLevelThreshold() {
    const profile = window.AGENT_PROFILE;
    const currentLevel = profile.level;

    // Le seuil actuel est l'XP nécessaire pour atteindre le N+1 (ou une valeur par défaut si max level atteint)
    const nextLevelData = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
    
    // Si un niveau suivant existe, retourner son XP requis. Sinon, retourner un grand nombre ou une valeur par défaut.
    return nextLevelData ? nextLevelData.xp : profile.experience + 1000; 
}

/**
 * Met à jour l'affichage des statistiques de l'Agent dans le panneau id="agent-status".
 */
export function updateProfileUI() {
    if (typeof window.AGENT_PROFILE === 'undefined') {
        console.error("[ProfileUI] Le profil d'Agent n'est pas défini.");
        return;
    }
    
    const profile = window.AGENT_PROFILE;
    
    // 1. Mise à jour du Niveau et du Titre
    const levelElement = document.getElementById('agent-level');
    if (levelElement) {
        const currentLevelTitle = (LEVEL_THRESHOLDS.find(l => l.level === profile.level) || { title: 'Agent Inconnu' }).title;
        levelElement.textContent = `Niv. ${profile.level} (${currentLevelTitle})`;
    }

    // 2. Mise à jour de l'Énergie d'Action (EA)
    const energyValueElement = document.getElementById('agent-energy-value');
    const energyProgressElement = document.getElementById('energy-progress');
    
    if (energyValueElement && energyProgressElement) {
        const energyPercentage = (profile.energy / profile.maxEnergy) * 100;
        
        energyValueElement.textContent = `${profile.energy}/${profile.maxEnergy} EA`;
        energyProgressElement.style.width = `${energyPercentage}%`;
        
        // Logique de couleur d'alerte visuelle (assumes les variables CSS : --color-red, etc.)
        const red = 'var(--color-red, red)';
        const yellow = 'var(--color-yellow, orange)';
        const green = 'var(--color-green, limegreen)';

        if (energyPercentage < 20) {
            energyProgressElement.style.backgroundColor = red;
        } else if (energyPercentage < 50) {
            energyProgressElement.style.backgroundColor = yellow;
        } else {
            energyProgressElement.style.backgroundColor = green;
        }
    }

    // 3. Mise à jour des Crédits UTMI
    const utmiElement = document.getElementById('agent-utmi');
    if (utmiElement) {
        const formattedUTMI = profile.utmiCredits.toLocaleString('fr-FR');
        utmiElement.textContent = `${formattedUTMI} UTMI`;
    }
    
    console.log(`[ProfileUI] Statut Agent mis à jour. Niv:${profile.level}, EA:${profile.energy}, UTMI:${profile.utmiCredits}`);
}


/**
 * Vérifie si l'agent doit monter de niveau et met à jour l'UI si nécessaire.
 */
export function checkLevelUp() {
    if (typeof window.AGENT_PROFILE === 'undefined') return;
    
    const currentXP = window.AGENT_PROFILE.experience;
    let newLevel = window.AGENT_PROFILE.level;

    for (const threshold of LEVEL_THRESHOLDS) {
        if (currentXP >= threshold.xp) {
            newLevel = threshold.level;
        }
    }

    if (newLevel > window.AGENT_PROFILE.level) {
        const oldLevel = window.AGENT_PROFILE.level;
        window.AGENT_PROFILE.level = newLevel;
        console.warn(`🎉 NOUVEAU NIVEAU ! Agent passé du Niveau ${oldLevel} à ${newLevel}.`);
        updateProfileUI(); 
    }
};

/**
 * Octroie la récompense (XP et Énergie).
 * Centralise la logique de gain de ressource pour toute l'application.
 */
export function grantReward(xp, energyGain = 0) {
    if (typeof window.AGENT_PROFILE === 'undefined') return;

    window.AGENT_PROFILE.experience += xp;
    window.AGENT_PROFILE.utmiCredits += xp; 
    
    // Gérer le gain d'énergie (ne dépasse pas le maximum)
    window.AGENT_PROFILE.energy = Math.min(window.AGENT_PROFILE.maxEnergy, window.AGENT_PROFILE.energy + energyGain);
    
    checkLevelUp();
    updateProfileUI(); // Mise à jour après la récompense/level-up
};
// Exposez-la également globalement pour l'accès
// --- Exposition Globale (pour les scripts qui ne sont pas des modules) ---
// Ceci est souvent nécessaire dans des projets hybrides.
window.updateProfileUI = updateProfileUI;
window.checkLevelUp = checkLevelUp;
window.getNextLevelThreshold = getNextLevelThreshold; 
window.grantReward = grantReward;