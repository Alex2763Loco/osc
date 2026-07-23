let allEpisodes = [];

// Cargar episodios desde el archivo JSON
fetch('episodes.json')
  .then(response => response.json())
  .then(data => {
    allEpisodes = data;
    renderEpisodes(allEpisodes);
  })
  .catch(error => console.error('Error cargando episodios:', error));

// Función para renderizar los videos en la pantalla
function renderEpisodes(episodes) {
  const container = document.getElementById('episodes-container');
  container.innerHTML = '';

  if (episodes.length === 0) {
    container.innerHTML = '<p>No hay episodios en esta categoría aún.</p>';
    return;
  }

  episodes.forEach(ep => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${ep.title}</h3>
      <div class="video-wrapper">
        <iframe 
          src="https://www.youtube.com/embed/${ep.youtubeId}" 
          title="${ep.title}" 
          frameborder="0" 
          allowfullscreen>
        </iframe>
      </div>
    `;
    container.appendChild(card);
  });
}

// Función de filtrado por serie
function filterEpisodes(showCode) {
  if (showCode === 'all') {
    renderEpisodes(allEpisodes);
  } else {
    const filtered = allEpisodes.filter(ep => ep.show === showCode);
    renderEpisodes(filtered);
  }
}
