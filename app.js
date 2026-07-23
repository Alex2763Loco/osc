let allEpisodes = [];
const blockedEmbedIds = ["lcGtU2eYeyU", "YQa2-DY7Y0Q"];

// AudioContext global
let audioCtx = null;

// Inicializa el audio tras cualquier interacción previa del usuario
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Sonido "Pop/GUI"
function playGuiHoverSound() {
  try {
    initAudio();
    if (!audioCtx || audioCtx.state !== 'running') return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    console.error(e);
  }
}

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

    // Agregar sonido también cuando pasas por encima de CADA tarjeta de video
    card.addEventListener('mouseenter', playGuiHoverSound);

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

document.addEventListener('DOMContentLoaded', () => {
  // Desbloquear audio en el primer clic a la página
  window.addEventListener('click', initAudio, { once: true });

  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('mouseenter', playGuiHoverSound);

    button.addEventListener('click', () => {
      const showFilter = button.getAttribute('data-show');
      filterEpisodes(showFilter);
    });
  });

  fetch('episodes.json')
    .then(response => {
      if (!response.ok) throw new Error("Error en episodes.json");
      return response.json();
    })
    .then(episodes => {
      allEpisodes = episodes;
      renderEpisodes(allEpisodes);
    })
    .catch(error => console.error('Error al cargar episodes.json:', error));
});
