// docs/modalChatbot.js - Composant pour la logique du Chatbot IA

/**
 * Initialise le Chatbot en chargeant l'historique et en attachant les écouteurs.
 * Est appelé par modalGestion.js lorsque la modale est ouverte.
 */
window.initializeChatbot = async function() {
    const display = document.getElementById('messages-display');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-input');
    const personaSelect = document.getElementById('persona-select');

    // Garde-fou crucial car initializeChatbot est appelé dynamiquement
    if (!display || !form || !input || !personaSelect) {
        console.error("Éléments du Chatbot introuvables. Vérifiez modalGestion.js et le HTML.");
        return;
    }

    let isLoading = false;
    
    // Ajout d'une barre de défilement automatique
    const scrollToBottom = () => {
        // Ajoute un léger délai pour s'assurer que le contenu a été rendu
        setTimeout(() => {
            display.scrollTop = display.scrollHeight;
        }, 50); 
    };

    // --- Fonctions de Rendu ---
    const renderMessage = (msg) => {
        const typeClass = msg.role === 'user' ? 'chat-user' : 'chat-ai';
        // Afficher le rôle seulement pour l'IA
        const personaLabel = msg.role === 'ai' && msg.persona ? `<span style="font-weight: 600; color: var(--color-accent-red); margin-right: 5px;">${msg.persona}:</span>` : '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${typeClass}`;
        messageDiv.innerHTML = `${personaLabel} ${msg.content}`;
        display.appendChild(messageDiv);
    };
    
    const loadHistory = async () => {
        // S'assurer que fetchData est disponible (défini dans app.js)
        if (!window.fetchData) {
            display.innerHTML = '<p class="chat-system font-red">❌ Erreur: La fonction fetchData (app.js) n\'est pas chargée.</p>';
            return;
        }

        display.innerHTML = '<p class="chat-system">Chargement de l\'historique...</p>';
        try {
            // Utiliser window.fetchData défini dans app.js
            const history = await window.fetchData('/api/chat/history'); 
            display.innerHTML = ''; // Nettoyer après le chargement
            
            if (history && Array.isArray(history)) {
                history.forEach(renderMessage);
                display.innerHTML += '<p class="chat-system">Historique chargé.</p>';
            }
        } catch (error) {
            display.innerHTML = '<p class="chat-system font-red">❌ Échec du chargement de l\'historique. Le serveur est-il accessible ?</p>';
        }
        scrollToBottom();
    };
    
    // --- Gestion de la soumission de message ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        const persona = personaSelect.value;

        if (message === '' || isLoading) return;

        isLoading = true;
        input.value = '';
        
        // 1. Afficher le message utilisateur immédiatement
        renderMessage({ role: 'user', content: message, persona: 'vous' });
        scrollToBottom();

        // 2. Afficher l'indicateur de chargement IA
        const loadingIndicator = document.createElement('p');
        loadingIndicator.className = 'chat-system';
        loadingIndicator.id = 'loading-ai';
        loadingIndicator.textContent = 'L\'IA réfléchit... 🧠';
        display.appendChild(loadingIndicator);
        scrollToBottom();

        try {
            // 3. Envoyer le message à l'API (Simulé dans la démo, mais prêt pour le back-end)
            const aiResponse = await window.fetchData('/api/chat/message', 'POST', { 
                message: message,
                persona: persona 
            });

            // 4. Retirer l'indicateur de chargement
            loadingIndicator.remove();

            // 5. Afficher la réponse IA (aiResponse est déjà formaté par l'API avec { role, content, persona })
            // Pour la démo, si l'API ne renvoie pas de réponse structurée :
            const finalResponse = aiResponse.content ? aiResponse : { 
                role: 'ai', 
                content: `(Simulé par l'IA en tant que ${persona}) : Je traite votre demande "${message}".`, 
                persona: persona 
            };
            
            renderMessage(finalResponse);

        } catch (error) {
            console.error("Erreur lors de l'envoi du message au Chatbot:", error);
            loadingIndicator.textContent = '❌ Erreur de connexion avec l\'IA. Vérifiez la console.';
        } finally {
            isLoading = false;
            scrollToBottom();
        }
    });

    // Lancer le chargement initial
    loadHistory();
};