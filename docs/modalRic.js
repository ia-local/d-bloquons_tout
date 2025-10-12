// modalRic.js - Logique Modales Spécifiques RIC et Logique de Vote (VERSION CORRIGÉE)

// Fonction utilitaire pour extraire et formater les templates du DOM
function getTemplateContent(id) {
    const template = document.getElementById(id);
    // Utilisation de .innerHTML car les templates sont désormais dans index.html
    return template ? template.innerHTML : null; 
}

// 🛑 FONCTION pour gérer les détails d'un RIC actif
window.handleRicActiveDetail = function(ricId) {
    const ric = window.ACTIVE_RICS.find(r => r.id === ricId);
    
    if (!ric) {
        window.openModal("Erreur", `Initiative RIC active ID ${ricId} introuvable.`);
        return;
    }
    
    let contentHTML = getTemplateContent('ric-description-template');
    if (!contentHTML) {
        // Devrait être résolu par l'ajout des templates ci-dessus.
        window.openModal("Détail Initiative", "Erreur critique: Template de description RIC manquant. Vérifiez index.html.");
        return;
    }

    const votesTotal = (ric.votes_for || 0) + (ric.votes_against || 0);

    // Remplissage des données
    contentHTML = contentHTML.replace('<p id="ric-modal-description"></p>', `<p id="ric-modal-description">${ric.description}</p>`)
                           .replace('<p id="ric-modal-deadline"></p>', `<p id="ric-modal-deadline">Date butoir: <b>${ric.deadline}</b></p>`)
                           .replace('<p id="ric-modal-status"></p>', `<p id="ric-modal-status">Statut: <b style="color:var(--color-yellow)">${ric.status}</b></p>`)
                           .replace('<p id="ric-modal-votes"></p>', `<p id="ric-modal-votes">Votes (OUI/NON): <b>${votesTotal.toLocaleString('fr-FR')}</b></p>`);
    
    // 1. Ouvrir la modale
    window.openModal(`🗳️ Initiative Active : ${ric.question}`, contentHTML);
    
    // 2. Créer et insérer le bouton de vote dans le placeholder
    const votePlaceholder = document.getElementById('vote-button-placeholder');
    if (votePlaceholder) {
        const voteButton = document.createElement('button');
        voteButton.className = 'btn btn-primary';
        voteButton.textContent = 'Voter sur cette Initiative (Simulé)';
        voteButton.style.cssText = 'padding: 10px 20px; font-size: 1em; background: var(--color-accent-red);';
        
        // Attacher l'événement pour passer à la modale de vote
        voteButton.onclick = () => {
            window.closeModal(); // Fermer la modale de détail
            window.handleUserAction('ric-vote', ricId); // Ouvrir la modale de vote
        };

        votePlaceholder.appendChild(voteButton);
    } else {
        console.error("Placeholder 'vote-button-placeholder' manquant dans la modale.");
    }
}

// 🛑 FONCTION pour gérer le vote simulé
window.handleRicVote = function(ricId) {
    const ric = window.ACTIVE_RICS.find(r => r.id === ricId);

    if (!ric) {
        window.openModal("Erreur de vote", "Initiative introuvable.");
        return;
    }
    
    let contentHTML = getTemplateContent('ric-vote-template');
    if (!contentHTML) {
        window.openModal("Erreur de vote", "Template de vote manquant.");
        return;
    }
    
    // Remplissage du template
    contentHTML = contentHTML.replace('<h4 id="ric-vote-question"></h4>', `<h4 id="ric-vote-question">${ric.question}</h4>`)
                           .replace('<p id="ric-vote-description"></p>', `<p id="ric-vote-description">${ric.description}</p>`);

    window.openModal(`Vote sur : ${ric.question}`, contentHTML);
    
    // Logique de simulation de vote (gagne de l'UTMi pour l'interaction)
    const container = document.getElementById('modal-content-container');
    container.querySelector('#vote-yes-btn').onclick = () => { simulateVote(ricId, 'OUI'); };
    container.querySelector('#vote-no-btn').onclick = () => { simulateVote(ricId, 'NON'); };
    container.querySelector('#vote-abstention-btn').onclick = () => { simulateVote(ricId, 'ABSTENTION'); };
}

function simulateVote(ricId, choice) {
    if (typeof window.grantReward === 'function') {
        window.grantReward(25, 0); // Récompense pour avoir voté
        console.log(`🌟 VOTE SIMULÉ enregistré: +25 UTMi pour l'interaction.`);
    }
    window.closeModal();
    window.openModal("✅ Vote Enregistré", `Votre vote **${choice}** sur l'initiative ${ricId} a été enregistré. Merci pour votre participation ! (+25 UTMi)`);
}

document.addEventListener('DOMContentLoaded', () => {
    // Exposer les fonctions utilitaires pour modalGestion.js
    window.handleRicActiveDetail = window.handleRicActiveDetail;
    window.handleRicVote = window.handleRicVote;
});