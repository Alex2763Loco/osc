let allEpisodes = [];

// Cargar episodios con ruta relativa './'
fetch('./episodes.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    allEpisodes = data;
    renderEpisodes(allEpisodes);
  })
  .catch(error => {
    console.error('Error cargando episodios:', error);
    const container = document.getElementById('episodes-container');
    container.innerHTML = `<p style="color: #ff5252;">Error al cargar el JSON: ${error.message}</p>`;
  });

function renderEpisodes(episodes) {
  const container = document.getElementById('episodes-container');
  container.innerHTML = '';

  if (!episodes || episodes.length === 0) {
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

function filterEpisodes(showCode) {
  if (showCode === 'all') {
    renderEpisodes(allEpisodes);
  } else {
    const filtered = allEpisodes.filter(ep => ep.show === showCode);
    renderEpisodes(filtered);
  }
}
