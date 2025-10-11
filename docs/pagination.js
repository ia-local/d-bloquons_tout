// docs/pagination.js
// Gère la pagination côté client pour la liste des commandes ou des archives (Mock)

const ITEMS_PER_PAGE = 5; // Limite arbitraire pour la démonstration

/**
 * Affiche la pagination d'une liste d'éléments dans un conteneur donné.
 */
function initializePagination(items, listContainer, controlsContainer, itemRenderer) {
    let currentPage = 0; 
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    // Fonction de rendu de la page
    const renderPage = (pageIndex) => {
        currentPage = pageIndex; 

        listContainer.innerHTML = '';
        const start = pageIndex * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = items.slice(start, end);

        // Injecter le contenu de la page
        pageItems.forEach(item => {
            listContainer.innerHTML += itemRenderer(item);
        });

        // Mettre à jour les contrôles pour la page actuelle
        renderControls(pageIndex);
    };

    // Fonction de rendu des contrôles (boutons)
    const renderControls = (page) => {
        controlsContainer.innerHTML = '';

        // --- Bouton Précédent ---
        const targetPagePrev = page - 1;
        const prevButton = document.createElement('button');
        prevButton.textContent = '◀️ Précédent';
        prevButton.className = 'btn btn-secondary';
        prevButton.disabled = page === 0;
        
        // CORRECTION FINALE: Utilisation d'un écouteur d'événement simple qui appelle renderPage
        prevButton.addEventListener('click', function() {
            renderPage(targetPagePrev);
        });
        
        controlsContainer.appendChild(prevButton);

        // --- Informations de Page ---
        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` Page ${page + 1} / ${totalPages} `;
        pageInfo.style.margin = '0 15px';
        pageInfo.style.color = '#f9e25b';
        controlsContainer.appendChild(pageInfo);

        // --- Bouton Suivant ---
        const targetPageNext = page + 1;
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Suivant ▶️';
        nextButton.className = 'btn btn-secondary';
        nextButton.disabled = page === totalPages - 1;
        
        // CORRECTION FINALE: Utilisation d'un écouteur d'événement simple
        nextButton.addEventListener('click', function() {
            renderPage(targetPageNext);
        });
        
        controlsContainer.appendChild(nextButton);
    };

    // Initialisation
    renderPage(currentPage);
}

// Rendre la fonction accessible globalement pour home.js
window.initializePagination = initializePagination;
 