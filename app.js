// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcUdBkyrT6jyV-w1hycZ25tMFR3JAk5eE",
  authDomain: "wotosc-66c47.firebaseapp.com",
  projectId: "wotosc-66c47",
  storageBucket: "wotosc-66c47.firebasestorage.app",
  messagingSenderId: "252026023370",
  appId: "1:252026023370:web:cf217f507607ffa0bc3333",
  measurementId: "G-F23DFYVPLF"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

var allEpisodes = [];
var currentFilter = 'all';
var searchQuery = '';
var favoriteIds = [];
var currentUser = null;
var audioCtx = null;

// Sistema de Audio
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

// Favoritos (Local o Nube)
function loadLocalFavorites() {
  favoriteIds = JSON.parse(localStorage.getItem('osc_favs') || '[]');
}

function saveFavorites(id, starElement) {
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

  if (currentUser) {
    db.collection('users').doc(currentUser.uid).set({
      favorites: favoriteIds
    }, { merge: true });
  } else {
    localStorage.setItem('osc_favs', JSON.stringify(favoriteIds));
  }

  if (currentFilter === 'favs') {
    applyFilters();
  }
}

// Gestión del Perfil (Avatar + Nombre Personalizado)
function setupProfile() {
  const btnLogin = document.getElementById('login-btn');
  const btnLogout = document.getElementById('logout-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userNameDisplay = document.getElementById('user-name-display');
  const userNameEdit = document.getElementById('user-name-edit');

  if (currentUser) {
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (userAvatar) userAvatar.style.display = 'inline-block';
    if (userNameDisplay) userNameDisplay.style.display = 'inline-block';
    if (userNameEdit) userNameEdit.style.display = 'none';
  } else {
    if (btnLogin) btnLogin.style.display = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'none';
    if (userAvatar) userAvatar.style.display = 'none';
    if (userNameDisplay) userNameDisplay.style.display = 'none';
    if (userNameEdit) userNameEdit.style.display = 'none';
  }
}

function toggleNameEdit() {
  const userNameDisplay = document.getElementById('user-name-display');
  const userNameEdit = document.getElementById('user-name-edit');
  if (!userNameDisplay || !userNameEdit) return;

  userNameEdit.value = userNameDisplay.textContent;
  userNameDisplay.style.display = 'none';
  userNameEdit.style.display = 'inline-block';
  userNameEdit.focus();
}

function saveCustomName(e) {
  if (e.key === 'Enter') {
    const userNameEdit = document.getElementById('user-name-edit');
    const userNameDisplay = document.getElementById('user-name-display');
    const newName = userNameEdit.value.trim();

    if (newName && currentUser) {
      db.collection('users').doc(currentUser.uid).set({
        displayName: newName
      }, { merge: true }).then(() => {
        userNameDisplay.textContent = newName;
        userNameDisplay.style.display = 'inline-block';
        userNameEdit.style.display = 'none';
      });
    }
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

    var starBtn = card.querySelector('.star-btn');
    starBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      saveFavorites(ep.youtubeId, starBtn);
    });

    episodesContainer.appendChild(card);
  });
}

// Inicializar Aplicación
document.addEventListener('DOMContentLoaded', function() {
  window.addEventListener('click', initAudio, { once: true });

  var loginBtn = document.getElementById('login-btn');
  var logoutBtn = document.getElementById('logout-btn');
  var userNameEdit = document.getElementById('user-name-edit');

  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(function(error) {
        console.error("Error al iniciar sesión:", error);
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      auth.signOut();
    });
  }

  if (userNameEdit) {
    userNameEdit.addEventListener('keydown', saveCustomName);
  }

  // Escuchar estado de autenticación
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      setupProfile();

      var localFavs = JSON.parse(localStorage.getItem('osc_favs') || '[]');
      db.collection('users').doc(user.uid).get().then(function(doc) {
        var userNameDisplay = document.getElementById('user-name-display');
        
        if (doc.exists) {
          // Favoritos
          if (doc.data().favorites) {
            var cloudFavs = doc.data().favorites;
            favoriteIds = Array.from(new Set(localFavs.concat(cloudFavs)));
            db.collection('users').doc(user.uid).set({ favorites: favoriteIds }, { merge: true });
          } else {
            favoriteIds = localFavs;
          }

          // Nombre personalizado
          if (doc.data().displayName && userNameDisplay) {
            userNameDisplay.textContent = doc.data().displayName;
          } else if (user.displayName && userNameDisplay) {
            userNameDisplay.textContent = user.displayName;
          }
        } else {
          favoriteIds = localFavs;
          if (userNameDisplay && user.displayName) {
            userNameDisplay.textContent = user.displayName;
          }
        }
        applyFilters();
      }).catch(function(err) {
        console.error("Error leyendo Firestore:", err);
        loadLocalFavorites();
        applyFilters();
      });

    } else {
      currentUser = null;
      setupProfile();
      loadLocalFavorites();
      applyFilters();
    }
  });

  // Buscador
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  // Filtros de navegación
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

  // Modo Claro/Oscuro
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

  // Cargar lista de episodios
  fetch('episodes.json')
    .then(function(response) {
      if (!response.ok) throw new Error("Error en episodes.json");
      return response.json();
    })
    .then(function(episodes) {
      allEpisodes = episodes;
      applyFilters();
    })
    .catch(function(error) {
      console.error('Error al cargar episodios:', error);
    });
});
