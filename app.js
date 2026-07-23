let allEpisodes = [];
let currentFilter = 'all';
let searchQuery = '';

const blockedEmbedIds = ["lcGtU2eYeyU", "YQa2-DY7Y0Q"];
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

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

// Aplica el filtro por categoría y por término de búsqueda
function applyFilters() {
  let filtered = allEpisodes;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(ep => ep.show === currentFilter);
  }

  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(ep => ep.title.toLowerCase().includes(query));
  }

  renderEpisodes(filtered);
}

function renderEpisodes(episodesToRender) {
  const episodesContainer = document.getElementById('episodes-container');
  if (!episodesContainer) return;

  episodesContainer.innerHTML = '';

  if (episodesToRender.length === 0) {
    episodesContainer.innerHTML = '<p class="no-episodes">No se encontraron episodios.</p>';
    return;
  }

  episodesToRender.forEach(ep => {
    const card = document.createElement('div');
    card.className = 'card';

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
  window.addEventListener('click', initAudio, { once: true });

  // Evento para el buscador en tiempo real
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  // Eventos para los botones de filtro
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('mouseenter', playGuiHoverSound);

    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      currentFilter = button.getAttribute('data-show');
      applyFilters();
    });
  });

  // Cambio de modo claro / oscuro
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Modo Claro';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙 Modo Oscuro';
      }
    });
  }

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
