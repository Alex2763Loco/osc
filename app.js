let allEpisodes = [];

// Función para filtrar episodios y actualizar botones
function filterEpisodes(show) {
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Cambiar clases activas en los botones
  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-show') === show) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Filtrar el arreglo de episodios
  if (show === 'all') {
    renderEpisodes(allEpisodes);
  } else {
    const filtered = allEpisodes.filter(ep => ep.show === show);
    renderEpisodes(filtered);
  }
}

// Función para renderizar las tarjetas
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

    // Solamente Inanimate Insanity 1 (ID: lcGtU2eYeyU) usa enlace externo por bloqueo
    if (ep.youtubeId === "lcGtU2eYeyU") {
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
      // Todos los demás episodios cargan el reproductor normal
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

// Inicialización de eventos y datos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Asignar los eventos de click a los botones desde el inicio
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const showFilter = button.getAttribute('data-show');
      filterEpisodes(showFilter);
    });
  });

  // Cargar el archivo JSON
  fetch('episodes.json')
    .then(response => {
      if (!response.ok) throw new Error("Error al obtener episodes.json");
      return response.json();
    })
    .then(episodes => {
      allEpisodes = episodes;
      renderEpisodes(allEpisodes);
    })
    .catch(error => console.error('Error al cargar episodes.json:', error));
});
