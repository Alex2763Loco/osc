// Cargar los episodios desde el archivo JSON
fetch('episodes.json')
  .then(response => response.json())
  .then(episodes => {
    const episodesContainer = document.getElementById('episodes-container');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Función para renderizar los episodios en pantalla
    function renderEpisodes(episodesToRender) {
      episodesContainer.innerHTML = '';

      episodesToRender.forEach(ep => {
        const card = document.createElement('div');
        card.className = 'card';

        // Si es el ID de Inanimate Insanity 1 original que bloquea el reproductor embebido
        if (ep.youtubeId === "M4u5QZ5IN4M" || ep.youtubeId === "M4u5QZ5iN4M" || ep.youtubeId === "lcGtU2eYeyU") {
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

    // Cargar todos al inicio
    renderEpisodes(episodes);

    // Lógica para los botones de filtrado
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Cambiar la clase activa
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const showFilter = button.getAttribute('data-show');

        if (showFilter === 'all') {
          renderEpisodes(episodes);
        } else {
          const filtered = episodes.filter(ep => ep.show === showFilter);
          renderEpisodes(filtered);
        }
      });
    });
  })
  .catch(error => console.error('Error al cargar los episodios:', error));
