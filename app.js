var allEpisodes = [];
var currentFilter = 'all';
var searchQuery = '';

// Cargar favoritos guardados en el navegador
var favoriteIds = JSON.parse(localStorage.getItem('osc_favs') || '[]');

var audioCtx = null;

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

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

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

function toggleFavorite(id, starElement) {
  var index = favoriteIds.indexOf(id);
  if (index === -1) {
    favoriteIds.push(id);
    starElement.classList.add('active');
    starElement.textContent = '★';
  } else {
    favoriteIds.splice(index, 1);
    starElement.classList.remove('active');
    starElement.textContent = '☆';
  }
  
  localStorage.setItem('osc_favs', JSON.stringify(favoriteIds));

  // Si estamos en la pestaña de favoritos, actualizamos la vista
  if (currentFilter === 'favs') {
    applyFilters();
  }
}

function applyFilters() {
  var filtered = allEpisodes;

  if (currentFilter === 'favs') {
    filtered = filtered.filter(function(ep) {
      return favoriteIds.indexOf(ep.youtubeId) !== -1;
    });
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(function(ep) {
      return ep.show === currentFilter;
    });
  }

  if (searchQuery.trim() !== '') {
    var query = searchQuery.toLowerCase();
    filtered = filtered.filter(function(ep) {
      return ep.title.toLowerCase().indexOf(query) !== -1;
    });
  }

  renderEpisodes(filtered);
}

function renderEpisodes(episodesToRender) {
  var episodesContainer = document.getElementById('episodes-container');
  if (!episodesContainer) return;

  episodesContainer.innerHTML = '';

  if (episodesToRender.length === 0) {
    var emptyMessage = currentFilter === 'favs' 
      ? 'Aún no has guardado episodios en Favoritos (haz clic en la estrella ☆ para guardar uno).'
      : 'No se encontraron episodios.';
    episodesContainer.innerHTML = '<p class="no-episodes">' + emptyMessage + '</p>';
    return;
  }

  episodesToRender.forEach(function(ep) {
    var card = document.createElement('div');
    card.className = 'card';

    card.addEventListener('mouseenter', playGuiHoverSound);

    var isFav = favoriteIds.indexOf(ep.youtubeId) !== -1;
    var starIcon = isFav ? '★' : '☆';
    var starClass = isFav ? 'star-btn active' : 'star-btn';

    var headerHTML = 
      '<div class="card-header">' +
        '<h3>' + ep.title + '</h3>' +
        '<button class="' + starClass + '" data-id="' + ep.youtubeId + '" title="Guardar en favoritos">' + starIcon + '</button>' +
      '</div>';

    card.innerHTML = headerHTML +
      '<iframe src="https://www.youtube.com/embed/' + ep.youtubeId + '" title="' + ep.title + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

    // Agregar evento a la estrella de la tarjeta
    var starBtn = card.querySelector('.star-btn');
    starBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFavorite(ep.youtubeId, starBtn);
    });

    episodesContainer.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  window.addEventListener('click', initAudio, { once: true });

  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  var filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(function(button) {
    button.addEventListener('mouseenter', playGuiHoverSound);

    button.addEventListener('click', function() {
      filterButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      currentFilter = button.getAttribute('data-show');
      applyFilters();
    });
  });

  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var currentTheme = document.documentElement.getAttribute('data-theme');
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
    .then(function(response) {
      if (!response.ok) throw new Error("Error en episodes.json");
      return response.json();
    })
    .then(function(episodes) {
      allEpisodes = episodes;
      renderEpisodes(allEpisodes);
    })
    .catch(function(error) {
      console.error('Error al cargar episodes.json:', error);
    });
});
