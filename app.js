let allEpisodes = [];

// Lista de IDs de videos con bloqueo de reproductor embebido
const blockedEmbedIds = ["lcGtU2eYeyU", "YQa2-DY7Y0Q"];

// Sintetizador de sonido cómodo de GUI usando Web Audio API
let audioCtx = null;

function playGuiHoverSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // Onda suave y limpia
    osc.frequency.setValueAtTime(480, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volumen suave para no molestar
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Silencioso en caso de bloqueo por política de autoproductores del navegador
  }
}

// Función para filtrar episodios y actualizar botones
function filterEpisodes(show) {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-show') === show) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

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

    // Manejo de videos bloqueados
    if (blockedEmbedIds.includes(ep.youtubeId)) {
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

  // Agregar el sonido de gui a los botones rojos de enlace que se acaban de renderizar
  const ytButtons = document.querySelectorAll('.yt-link-btn');
  ytButtons.forEach(btn => {
    btn.addEventListener('mouseenter', playGuiHoverSound);
  });
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    // Sonido al pasar el cursor
    button.addEventListener('mouseenter', playGuiHoverSound);

    // Acción de filtrado al dar click
    button.addEventListener('click', () => {
      const showFilter = button.getAttribute('data-show');
      filterEpisodes(showFilter);
    });
  });

  // Cargar datos JSON
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
