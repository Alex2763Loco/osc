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
var hoverVolume = 0.15;

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
    if (!audioCtx || audioCtx.state !== 'running') return;

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(hoverVolume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

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

// La info de cuenta ya no vive en la navbar, así que solo
// necesitamos mantener sincronizado el sidebar.
function setupProfile() {
  updateSidebarUserUI();
}

// Genera todo el bloque de cuenta (avatar, nombre, login/logout)
// dentro del Sidebar derecho.
function updateSidebarUserUI() {
  const container = document.getElementById('sidebar-user-info');
  if (!container) return;

  const currentAvatarSrc = localStorage.getItem('custom_avatar') || 'profile_match.png';
  const currentDisplayName = localStorage.getItem('custom_display_name') || (currentUser ? currentUser.displayName : 'Usuario');

  if (currentUser) {
    container.innerHTML = `
      <input type="file" id="avatar-input" accept="image/*" style="display: none;" onchange="changeAvatar(event)">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <img id="user-avatar" src="${currentAvatarSrc}" onclick="document.getElementById('avatar-input').click()" title="Haz clic para cambiar foto" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #00ff66; cursor: pointer; flex-shrink: 0;" />
        <div>
          <span id="user-name-display" onclick="toggleNameEdit()" style="cursor: pointer; font-weight: bold; font-size: 0.95rem; color: #fff;" title="Haz clic para cambiar nombre">${currentDisplayName}</span>
          <div id="edit-name-container" style="display: none; align-items: center; gap: 4px; margin-top: 4px;">
            <input type="text" id="user-name-edit" style="background: #222; color: #00ff66; border: 1px solid #00ff66; border-radius: 4px; padding: 2px 6px; font-size: 13px;">
            <button onclick="saveCustomName()" class="theme-btn" style="padding: 2px 8px; font-size: 11px; cursor: pointer;">Guardar</button>
          </div>
          <p style="margin: 2px 0 0; font-size: 0.8rem; color: #00ff66;">Conectado con Google</p>
        </div>
      </div>
      <button id="sidebar-logout-btn" class="sidebar-option-btn" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); text-align: center;">Cerrar Sesión</button>
    `;

    document.getElementById('sidebar-logout-btn').addEventListener('click', function() {
      auth.signOut();
      closeSidebar();
    });

    var nameEditInput = document.getElementById('user-name-edit');
    if (nameEditInput) {
      nameEditInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveCustomName();
      });
    }
  } else {
    container.innerHTML = `
      <p style="font-size: 0.9rem; color: #a1a1aa; margin-bottom: 12px;">No has iniciado sesión con cuenta.</p>
      <button id="sidebar-login-btn" class="sidebar-option-btn" style="background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); text-align: center;">🔑 Acceder / Crear cuenta</button>
    `;

    document.getElementById('sidebar-login-btn').addEventListener('click', function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(function(error) {
        console.error("Error al iniciar sesión:", error);
      });
      closeSidebar();
    });
  }
}

// Funciones para abrir y cerrar el Sidebar
function openSidebar() {
  updateSidebarUserUI(); // Se asegura de refrescar los datos al abrir
  document.getElementById('right-sidebar').classList.add('active');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('right-sidebar').classList.remove('active');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// Mostrar campo para editar nombre (ahora dentro del sidebar)
function toggleNameEdit() {
  const userNameDisplay = document.getElementById('user-name-display');
  const editContainer = document.getElementById('edit-name-container');
  const userNameEdit = document.getElementById('user-name-edit');

  if (userNameDisplay && editContainer && userNameEdit) {
    userNameEdit.value = userNameDisplay.textContent;
    userNameDisplay.style.display = 'none';
    editContainer.style.display = 'flex';
    userNameEdit.focus();
  }
}

// Guardar nuevo nombre
function saveCustomName() {
  const userNameEdit = document.getElementById('user-name-edit');
  if (!userNameEdit) return;

  const newName = userNameEdit.value.trim();

  if (newName) {
    localStorage.setItem('custom_display_name', newName);

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).set({
        displayName: newName
      }, { merge: true });
    }
  }

  // Vuelve a pintar el bloque de cuenta con el nombre actualizado (o el anterior si se dejó vacío)
  updateSidebarUserUI();
}

// Cambiar avatar con explorador de archivos (ahora abierto desde el sidebar)
function changeAvatar(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      localStorage.setItem('custom_avatar', e.target.result);
      updateSidebarUserUI();
    };
    reader.readAsDataURL(file);
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

  // Controles del Sidebar
  var toggleBtn = document.getElementById('sidebar-toggle-btn');
  var closeBtn = document.getElementById('sidebar-close-btn');
  var overlay = document.getElementById('sidebar-overlay');
  var sidebarThemeToggle = document.getElementById('sidebar-theme-toggle');
  var volumeSlider = document.getElementById('volume-slider');

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Control de volumen del sonido de hover
  if (volumeSlider) {
    hoverVolume = parseFloat(volumeSlider.value); // toma el valor inicial del HTML (0.15)
    volumeSlider.addEventListener('input', function(e) {
      hoverVolume = parseFloat(e.target.value);
    });
  }

  // Sincronizar botón de tema dentro del sidebar
  if (sidebarThemeToggle) {
    sidebarThemeToggle.addEventListener('click', function() {
      var themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) themeToggle.click();
    });
  }

  // Escuchar estado de autenticación de Firebase
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      setupProfile();

      var localFavs = JSON.parse(localStorage.getItem('osc_favs') || '[]');
      db.collection('users').doc(user.uid).get().then(function(doc) {
        if (doc.exists) {
          if (doc.data().favorites) {
            var cloudFavs = doc.data().favorites;
            favoriteIds = Array.from(new Set(localFavs.concat(cloudFavs)));
            db.collection('users').doc(user.uid).set({ favorites: favoriteIds }, { merge: true });
          } else {
            favoriteIds = localFavs;
          }

          if (doc.data().displayName) {
            localStorage.setItem('custom_display_name', doc.data().displayName);
          }
        } else {
          favoriteIds = localFavs;
        }
        applyFilters();
        updateSidebarUserUI();
      }).catch(function(err) {
        console.error("Error leyendo Firestore:", err);
        loadLocalFavorites();
        applyFilters();
        updateSidebarUserUI();
      });

    } else {
      currentUser = null;
      setupProfile();
      loadLocalFavorites();
      applyFilters();
      updateSidebarUserUI();
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
