// Fichier : public/src/js/modal-rics.js
// Gère la logique d'affichage et de masquage de la modale en utilisant des exports de module.

/**
 * Affiche la modale avec le titre et le contenu donnés.
 * @param {string} title - Le titre de la modale.
 * @param {Node} content - Le contenu à afficher dans la modale.
 */
export function showModal(title, content) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalTitle || !modalContent) return;

    modalTitle.textContent = title;
    modalContent.innerHTML = '';
    modalContent.appendChild(content);

    modal.classList.add('is-visible');
    // Ajout d'une classe pour bloquer le scroll du body si nécessaire
    document.body.style.overflow = 'hidden';
}

/**
 * Cache la modale.
 */
export function hideModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.classList.remove('is-visible');
    }
    document.body.style.overflow = ''; // Rétablit le scroll du body
}

/**
 * Configure les écouteurs d'événements pour la modale (fermeture, etc.).
 */
export function setupModal() {
    const modal = document.getElementById('app-modal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (!modal) return;
    
    // Ferme la modale en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Ferme la modale via le bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }
}