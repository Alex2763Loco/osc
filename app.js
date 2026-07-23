let allEpisodes = [];

// Función para filtrar y renderizar
function filterEpisodes(show) {
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Actualizar estado activo en los botones
  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-show') === show) {
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

  if (episodesToRender.length === 0) {
    episodesContainer.innerHTML = '<p class="no-episodes">No hay episodios disponibles para esta categoría.</p>';
    return;
  }

  episodesToRender.forEach(ep => {
    const card = document.createElement('div');
    card.className = 'card';

    // Excepción para videos que bloquean embebido (Inanimate Insanity 1)
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
      // Reproductor embebido estándar
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

// Inicialización de la app
document.addEventListener('DOMContentLoaded', () => {
  // Asignar eventos a los botones desde el inicio
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const showFilter = button.getAttribute('data-show');
      filterEpisodes(showFilter);
    });
  });

  // Cargar datos del JSON
  fetch('episodes.json')
    .then(response => {
      if (!response.ok) throw new Error("Error en la respuesta de la red");
      return response.json();
    })
    .then(episodes => {
      allEpisodes = episodes;
      renderEpisodes(allEpisodes);
    })
    .catch(error => console.error('Error al cargar episodes.json:', error));
});
