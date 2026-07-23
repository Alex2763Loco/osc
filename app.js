let allEpisodes = [];

// Función global para que los botones con onclick="" no fallen
function filterEpisodes(show) {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Cambiar estilos de botones activos
  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-show') === show || (show === 'all' && btn.getAttribute('data-show') === 'todos')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Filtrar episodios
  if (show === 'all') {
    renderEpisodes(allEpisodes);
  } else {
    const filtered = allEpisodes.filter(ep => ep.show === show);
    renderEpisodes(filtered);
  }
}

// Renderizar las tarjetas en la cuadrícula
function renderEpisodes(episodesToRender) {
  const episodesContainer = document.getElementById('episodes-container');
  if (!episodesContainer) return;
  
  episodesContainer.innerHTML = '';

  episodesToRender.forEach(ep => {
    const card = document.createElement('div');
    card.className = 'card';

    // Si es Inanimate Insanity 1 original que bloquea embebido
    if (ep.youtubeId === "lcGtU2eYeyU" || (ep.show === "II" && ep.title.includes("Crappy Cliff"))) {
      card.innerHTML = `
        <h3>${ep.title}</h3>
        <div class="thumb-container">
          <img src="https://img.youtube.com/vi/${ep.youtubeId}/hqdefault.jpg" alt="${ep.title}">
          <a href="https://www.youtube.com/watch?v=${ep.youtubeId}" target="_blank" class="yt-link-btn">
            ▶ Ver versión original en YouTube
          </a>
        </div>
      `;
    } else {
      // Para todos los demás videos que sí permiten reproductor embebido
      card.innerHTML = `
        <h3>${ep.title}</h3>
        <iframe 
          src="https://www.youtube.com/embed/${ep.youtubeId}" 
          title="${ep.title}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    }

    episodesContainer.appendChild(card);
  });
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  fetch('episodes.json')
    .then(response => response.json())
    .then(episodes => {
      allEpisodes = episodes;
      renderEpisodes(allEpisodes);

      // Listener para eventListeners de botones si no usan onclick
      const filterButtons = document.querySelectorAll('.filter-btn');
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          const showFilter = button.getAttribute('data-show');
          filterEpisodes(showFilter);
        });
      });
    })
    .catch(error => console.error('Error al cargar episodes.json:', error));
});
