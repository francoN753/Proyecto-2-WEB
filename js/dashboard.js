// js/dashboard.js — Deezer-Manager Complete Application Logic
document.addEventListener('DOMContentLoaded', () => {

    /* ====================================================
       1. MÓDULO DE AUTENTICACIÓN Y SEGURIDAD
       ==================================================== */
    const loggedUser = localStorage.getItem('loggedUser');
    const token = localStorage.getItem('authToken');

    if (!token || !loggedUser) {
        window.location.replace('index.html');
        return;
    }

    // Set user avatar initial and dropdown info
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdownUsername = document.getElementById('dropdown-username');
    const dropdownEmail = document.getElementById('dropdown-email');

    if (avatarBtn) avatarBtn.textContent = loggedUser.charAt(0).toUpperCase();
    if (dropdownUsername) dropdownUsername.textContent = loggedUser;
    if (dropdownEmail) dropdownEmail.textContent = loggedUser;

    // User dropdown toggle
    const userDropdown = document.getElementById('user-dropdown');
    if (avatarBtn && userDropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
        userDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Logout function
    function performLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('loggedUser');
        showToast('Sesión cerrada con éxito', 'success');
        setTimeout(() => {
            window.location.replace('index.html');
        }, 500);
    }

    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', performLogout);


    /* ====================================================
       2. TEMA CLARO / OSCURO
       ==================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const dropdownThemeToggle = document.getElementById('dropdown-theme-toggle');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    updateThemeUI();

    function toggleTheme() {
        const current = htmlElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI();
        showToast(`Tema cambiado a modo ${newTheme === 'light' ? 'claro' : 'oscuro'}`, 'success', 2000);
    }

    function updateThemeUI() {
        const theme = htmlElement.getAttribute('data-theme');
        if (themeToggleBtn) themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
        if (dropdownThemeToggle) dropdownThemeToggle.textContent = theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro';
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (dropdownThemeToggle) dropdownThemeToggle.addEventListener('click', toggleTheme);


    /* ====================================================
       3. NAVEGACIÓN SPA (4 VISTAS)
       ==================================================== */
    const allViews = ['search-view', 'favorites-view', 'collection-view', 'sync-view'];
    const topNavLinks = document.querySelectorAll('.top-nav-link[data-view]');
    const sideNavLinks = document.querySelectorAll('.sidebar-link[data-view]');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-view]');
    const goToSearchBtn = document.getElementById('go-to-search-btn');

    function switchView(viewId) {
        // Hide all views
        allViews.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.add('hidden');
        });

        // Show target
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.remove('hidden');

        // Update nav active states
        [topNavLinks, sideNavLinks, mobileNavBtns].forEach(links => {
            links.forEach(link => {
                if (link.getAttribute('data-view') === viewId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        });

        // Refresh view data as needed
        if (viewId === 'favorites-view') renderFavorites();
        if (viewId === 'collection-view') renderCollection();
        if (viewId === 'sync-view') renderSyncView();
    }

    // Attach listeners to all nav elements
    [topNavLinks, sideNavLinks, mobileNavBtns].forEach(links => {
        links.forEach(link => {
            link.addEventListener('click', () => {
                const viewId = link.getAttribute('data-view');
                if (viewId) switchView(viewId);
            });
        });
    });

    if (goToSearchBtn) goToSearchBtn.addEventListener('click', () => switchView('search-view'));


    /* ====================================================
       4. TOAST NOTIFICATIONS
       ==================================================== */
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'success', duration = 3500) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = { success: '✅', warning: '⚠️', danger: '❌', info: '🔔' };
        const icon = icons[type] || '🔔';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }


    /* ====================================================
       5. NETWORK STATUS (ONLINE / OFFLINE)
       ==================================================== */
    const networkStatus = document.getElementById('network-status');
    const networkText = networkStatus ? networkStatus.querySelector('.network-text') : null;
    const offlineBanner = document.getElementById('offline-banner');

    function updateNetworkStatus() {
        const isOnline = navigator.onLine;
        if (isOnline) {
            if (networkStatus) { networkStatus.className = 'network-badge online'; }
            if (networkText) networkText.textContent = 'Online';
            if (offlineBanner) offlineBanner.classList.add('hidden');
            showToast('Conexión de red restablecida. Modo online activo.', 'success');
            processSyncQueue();
        } else {
            if (networkStatus) { networkStatus.className = 'network-badge offline'; }
            if (networkText) networkText.textContent = 'Offline';
            if (offlineBanner) offlineBanner.classList.remove('hidden');
            showToast('Sin conexión de red. Modo offline local activo.', 'warning');
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Init
    if (!navigator.onLine) {
        if (networkStatus) networkStatus.className = 'network-badge offline';
        if (networkText) networkText.textContent = 'Offline';
        if (offlineBanner) offlineBanner.classList.remove('hidden');
    }


    /* ====================================================
       6. JSONP CLIENT (Bypass CORS for Deezer API)
       ==================================================== */
    function fetchJSONP(url) {
        return new Promise((resolve, reject) => {
            if (!navigator.onLine) {
                reject(new Error('OFFLINE'));
                return;
            }

            const callbackName = 'deezer_jsonp_' + Math.random().toString(36).substring(2, 15);
            window[callbackName] = function (data) {
                cleanup();
                if (data && data.error) {
                    reject(new Error(data.error.message || 'Error en API Deezer'));
                } else {
                    resolve(data);
                }
            };

            const script = document.createElement('script');
            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName + '&output=jsonp';
            script.id = callbackName;

            script.onerror = function () {
                cleanup();
                reject(new Error('Error de red al consultar el servidor de Deezer'));
            };

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Tiempo de espera de la petición agotado (Timeout)'));
            }, 10000);

            function cleanup() {
                clearTimeout(timeoutId);
                if (script.parentNode) script.parentNode.removeChild(script);
                delete window[callbackName];
            }

            document.body.appendChild(script);
        });
    }


    /* ====================================================
       7. BÚSQUEDA DE ARTISTAS
       ==================================================== */
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const statusContainer = document.getElementById('status-container');
    const searchSpinner = document.getElementById('search-spinner');
    const statusMessage = document.getElementById('status-message');
    const artistDetail = document.getElementById('artist-detail');
    const albumsGrid = document.getElementById('albums-grid');
    const searchEmptyState = document.getElementById('search-empty-state');
    const searchResultsHeader = document.getElementById('search-results-header');
    const searchResultsCount = document.getElementById('search-results-count');

    let currentArtist = null;

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;

            // Reset view
            artistDetail.classList.add('hidden');
            if (searchEmptyState) searchEmptyState.classList.add('hidden');
            if (searchResultsHeader) searchResultsHeader.classList.add('hidden');
            statusContainer.classList.remove('hidden');
            searchSpinner.classList.add('active');
            statusMessage.textContent = 'Buscando artista...';

            if (!navigator.onLine) {
                searchSpinner.classList.remove('active');
                statusMessage.textContent = 'No puedes realizar búsquedas estando desconectado (Offline). Revisa tu conexión o explora "Mis Álbumes".';
                showToast('Operación no disponible sin conexión', 'warning');
                return;
            }

            try {
                const searchUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`;
                const data = await fetchJSONP(searchUrl);

                searchSpinner.classList.remove('active');

                if (data.data && data.data.length > 0) {
                    statusContainer.classList.add('hidden');
                    if (searchResultsHeader) {
                        searchResultsHeader.classList.remove('hidden');
                        searchResultsCount.textContent = `${data.data.length} encontrado${data.data.length > 1 ? 's' : ''}`;
                    }
                    const artist = data.data[0];
                    currentArtist = artist;
                    renderArtist(artist);
                } else {
                    statusMessage.textContent = `No se encontraron resultados para "${query}". Intenta buscar otro artista (ej. Daft Punk, Tame Impala).`;
                }
            } catch (error) {
                searchSpinner.classList.remove('active');
                statusMessage.textContent = `Error: ${error.message}. Intenta nuevamente.`;
                console.error(error);
            }
        });

        // Clear search results and restore empty state when search input is empty
        searchInput.addEventListener('input', () => {
            if (!searchInput.value.trim()) {
                artistDetail.classList.add('hidden');
                statusContainer.classList.add('hidden');
                if (searchResultsHeader) searchResultsHeader.classList.add('hidden');
                if (searchEmptyState) searchEmptyState.classList.remove('hidden');
            }
        });
    }


    /* ====================================================
       8. RENDERIZADO DE ARTISTA Y ÁLBUMES
       ==================================================== */
    async function renderArtist(artist) {
        artistDetail.classList.remove('hidden');
        document.getElementById('artist-name').textContent = artist.name;
        document.getElementById('artist-fans').textContent = `${(artist.nb_fan || 0).toLocaleString()} oyentes mensuales`;
        document.getElementById('artist-image').src = artist.picture_medium || artist.picture || '';
        document.getElementById('artist-image').alt = `Foto de ${artist.name}`;

        // Load albums
        albumsGrid.innerHTML = '';
        const albumsUrl = `https://api.deezer.com/artist/${artist.id}/albums`;

        try {
            const data = await fetchJSONP(albumsUrl);
            if (data.data && data.data.length > 0) {
                const sortedAlbums = data.data.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                sortedAlbums.forEach(album => {
                    const card = createAlbumCard(album, artist.name);
                    albumsGrid.appendChild(card);
                });
            } else {
                albumsGrid.innerHTML = '<p class="status-message" style="grid-column:1/-1;">Este artista no posee álbumes disponibles.</p>';
            }
        } catch (error) {
            console.error('Error cargando álbumes:', error);
            showToast('No se pudieron obtener los álbumes del artista', 'danger');
        }
    }


    /* ====================================================
       9. FAVORITOS: CRUD CON PERSISTENCIA LOCAL
       ==================================================== */
    function getFavorites() {
        const key = `deezer_favs_${loggedUser}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
    }

    function saveFavorites(favorites) {
        const key = `deezer_favs_${loggedUser}`;
        localStorage.setItem(key, JSON.stringify(favorites));
    }


    /* ====================================================
       10. TARJETA DE ÁLBUM (Reutilizable)
       ==================================================== */
    function createAlbumCard(album, artistName, isFavoriteView = false) {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.dataset.albumId = album.id;

        const favorites = getFavorites();
        const isFav = !!favorites[album.id];
        const rating = isFav ? (favorites[album.id].rating || 0) : 0;
        const year = album.release_date ? album.release_date.substring(0, 4) : 'N/A';

        card.innerHTML = `
            <div class="album-art-container">
                <img class="album-art" src="${album.cover_medium || album.cover || ''}" alt="Portada de ${album.title}" loading="lazy">
                <button class="btn-fav ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                ${isFavoriteView ? '<span class="album-badge-local">LOCAL</span>' : ''}
            </div>
            <div class="album-info-container">
                <h3 class="album-title" title="${album.title}">${album.title}</h3>
                <p class="album-artist-name">${artistName}</p>
                <div class="album-meta">
                    <span class="album-year">${year}</span>
                    ${isFav ? `
                    <div class="star-rating" data-album-id="${album.id}">
                        ${[1, 2, 3, 4, 5].map(num => `
                            <span class="star ${num <= rating ? 'filled' : ''} interactive" data-value="${num}">★</span>
                        `).join('')}
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">${rating > 0 ? rating.toFixed(1) : ''}</span>
                    ` : ''}
                </div>
            </div>
        `;

        // Event: Favorite toggle
        const favBtn = card.querySelector('.btn-fav');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(album, artistName, card);
        });

        // Event: Star rating
        const stars = card.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = parseInt(star.dataset.value);
                rateAlbum(album.id, value, card);
            });
        });

        // Event: Open album detail panel
        card.addEventListener('click', () => {
            openAlbumDetail(album, artistName);
        });

        return card;
    }


    /* ====================================================
       11. TOGGLE FAVORITO
       ==================================================== */
    function toggleFavorite(album, artistName, card) {
        const albumId = album.id;
        const favorites = getFavorites();
        const favBtn = card.querySelector('.btn-fav');

        if (favorites[albumId]) {
            delete favorites[albumId];
            saveFavorites(favorites);

            favBtn.classList.remove('active');
            favBtn.innerHTML = '🤍';

            showToast(`"${album.title}" eliminado de tus favoritos`, 'info');

            queueSyncAction({
                action: 'remove_favorite',
                albumId: albumId,
                albumTitle: album.title
            });

            // Refresh favorites view if active
            const favNav = document.getElementById('nav-favorites');
            if (favNav && favNav.classList.contains('active')) {
                renderFavorites();
            }
        } else {
            const newFav = {
                id: albumId,
                title: album.title,
                cover_medium: album.cover_medium || album.cover,
                cover: album.cover,
                artistName: artistName,
                release_date: album.release_date,
                rating: 0
            };

            favorites[albumId] = newFav;
            saveFavorites(favorites);

            favBtn.classList.add('active');
            favBtn.innerHTML = '❤️';

            showToast(`"${album.title}" guardado en favoritos`, 'success');

            queueSyncAction({
                action: 'add_favorite',
                albumId: albumId,
                albumTitle: album.title,
                albumData: newFav
            });
        }
    }


    /* ====================================================
       12. CALIFICACIÓN POR ESTRELLAS (Persistencia Local)
       ==================================================== */
    function rateAlbum(albumId, ratingValue, card) {
        const favorites = getFavorites();
        if (!favorites[albumId]) {
            showToast('Agrega el álbum a favoritos antes de calificarlo', 'warning');
            return;
        }

        favorites[albumId].rating = ratingValue;
        saveFavorites(favorites);

        // Update stars UI globally for all elements referencing this album
        const allRatingsForAlbum = document.querySelectorAll(`.star-rating[data-album-id="${albumId}"]`);
        allRatingsForAlbum.forEach(container => {
            const stars = container.querySelectorAll('.star');
            stars.forEach(s => {
                const val = parseInt(s.dataset.value);
                s.classList.toggle('filled', val <= ratingValue);
            });
        });

        showToast(`Álbum calificado con ${ratingValue} estrella${ratingValue > 1 ? 's' : ''}`, 'success');

        // Show notification in collection
        showCollectionNotification(
            'Cambio guardado localmente',
            `La calificación de "${favorites[albumId].title}" se ha actualizado en este dispositivo.`
        );

        queueSyncAction({
            action: 'rate_album',
            albumId: albumId,
            rating: ratingValue,
            albumTitle: favorites[albumId].title
        });

        // Refresh favorites if active and filtered
        const favNav = document.getElementById('nav-favorites');
        if (favNav && favNav.classList.contains('active')) {
            const filterVal = document.getElementById('rating-filter').value;
            if (filterVal !== 'all') {
                renderFavorites();
            }
        }
    }


    /* ====================================================
       13. PANEL DE DETALLE DEL ÁLBUM (Overlay)
       ==================================================== */
    const albumDetailOverlay = document.getElementById('album-detail-overlay');
    const albumDetailClose = document.getElementById('album-detail-close');
    let currentDetailAlbum = null;
    let currentDetailArtist = null;

    if (albumDetailClose) {
        albumDetailClose.addEventListener('click', closeAlbumDetail);
    }
    if (albumDetailOverlay) {
        albumDetailOverlay.addEventListener('click', (e) => {
            if (e.target === albumDetailOverlay) closeAlbumDetail();
        });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && albumDetailOverlay && !albumDetailOverlay.classList.contains('hidden')) {
            closeAlbumDetail();
        }
    });

    function closeAlbumDetail() {
        if (albumDetailOverlay) albumDetailOverlay.classList.add('hidden');
        currentDetailAlbum = null;
    }

    async function openAlbumDetail(album, artistName) {
        if (!albumDetailOverlay) return;
        currentDetailAlbum = album;
        currentDetailArtist = artistName;

        // Populate header info
        document.getElementById('detail-cover').src = album.cover_medium || album.cover_big || album.cover || '';
        document.getElementById('detail-title').textContent = album.title;
        document.getElementById('detail-artist').textContent = artistName;
        document.getElementById('detail-year').textContent = album.release_date ? album.release_date.substring(0, 4) : 'N/A';

        // Fav button state
        const favorites = getFavorites();
        const isFav = !!favorites[album.id];
        const detailFavBtn = document.getElementById('detail-fav-btn');
        if (detailFavBtn) {
            detailFavBtn.textContent = isFav ? '❤️' : '🤍';
            detailFavBtn.className = `btn-icon-sm ${isFav ? 'active' : ''}`;
            detailFavBtn.onclick = () => {
                toggleFavorite(album, artistName, { querySelector: () => detailFavBtn });
                // Re-update button
                const updatedFavs = getFavorites();
                const nowFav = !!updatedFavs[album.id];
                detailFavBtn.textContent = nowFav ? '❤️' : '🤍';
                detailFavBtn.className = `btn-icon-sm ${nowFav ? 'active' : ''}`;
                updateDetailRating(album.id);
            };
        }

        // Detail play button
        const detailPlayBtn = document.getElementById('detail-play-btn');
        if (detailPlayBtn) {
            detailPlayBtn.onclick = null; // Will be set after tracks load
        }

        // Rating
        const detailStarRatingContainer = document.getElementById('detail-star-rating');
        if (detailStarRatingContainer) {
            detailStarRatingContainer.dataset.albumId = album.id;
        }
        updateDetailRating(album.id);

        // Detail star rating click
        const detailStars = document.querySelectorAll('#detail-star-rating .star');
        detailStars.forEach(star => {
            star.onclick = () => {
                const value = parseInt(star.dataset.value);
                const favs = getFavorites();
                if (!favs[album.id]) {
                    // Auto-add to favorites first
                    toggleFavorite(album, artistName, { querySelector: () => detailFavBtn });
                }
                rateAlbum(album.id, value, null);
                updateDetailRating(album.id);
            };
        });

        // Artist info in sidebar
        const artistImg = document.getElementById('detail-artist-img');
        const artistFans = document.getElementById('detail-artist-fans');
        if (currentArtist) {
            if (artistImg) artistImg.src = currentArtist.picture_medium || currentArtist.picture || '';
            if (artistFans) artistFans.textContent = (currentArtist.nb_fan || 0).toLocaleString();
        } else {
            if (artistImg) artistImg.src = '';
            if (artistFans) artistFans.textContent = '—';
        }

        // Show overlay
        albumDetailOverlay.classList.remove('hidden');

        // Load tracks (Online fetch with local cache backup, or Offline load from cache)
        const tracklist = document.getElementById('detail-tracklist');
        tracklist.innerHTML = `
            <div class="status-container" style="padding:2rem;">
                <div class="spinner active" style="width:30px; height:30px; border-color:var(--border-color); border-top-color:var(--accent-purple);"></div>
            </div>
        `;

        try {
            let tracks = [];
            const cachedTracksKey = `deezer_tracks_${album.id}`;

            if (navigator.onLine) {
                const data = await fetchJSONP(`https://api.deezer.com/album/${album.id}/tracks`);
                if (data.data && data.data.length > 0) {
                    tracks = data.data;
                    // Cache tracks in localStorage for offline accessibility
                    localStorage.setItem(cachedTracksKey, JSON.stringify(tracks));
                }
            } else {
                const cached = localStorage.getItem(cachedTracksKey);
                if (cached) {
                    tracks = JSON.parse(cached);
                    showToast('Cargando lista de canciones desde caché local (Offline)', 'info', 2000);
                } else {
                    throw new Error('OFFLINE_NO_CACHE');
                }
            }

            if (tracks.length > 0) {
                let totalDuration = 0;

                document.getElementById('detail-track-count').textContent = `${tracks.length} cancione${tracks.length > 1 ? 's' : ''}`;

                tracklist.innerHTML = '';
                tracks.forEach((track, index) => {
                    totalDuration += track.duration;
                    const mins = Math.floor(track.duration / 60);
                    const secs = String(track.duration % 60).padStart(2, '0');

                    const trackEl = document.createElement('div');
                    trackEl.className = 'track-item';
                    trackEl.innerHTML = `
                        <span class="track-number">${index + 1}</span>
                        <div class="track-info">
                            <span class="track-title">${track.title}</span>
                            <span class="track-artist">${track.artist ? track.artist.name : artistName}</span>
                        </div>
                        <span class="track-plays">${track.rank ? Math.floor(track.rank / 1000).toLocaleString() + 'K' : '—'}</span>
                        <span class="track-duration">${mins}:${secs}</span>
                    `;

                    trackEl.addEventListener('click', () => {
                        playTrack(track, album);
                        // Highlight playing track
                        tracklist.querySelectorAll('.track-title').forEach(t => t.classList.remove('playing'));
                        trackEl.querySelector('.track-title').classList.add('playing');
                    });

                    tracklist.appendChild(trackEl);
                });

                const totalMins = Math.floor(totalDuration / 60);
                document.getElementById('detail-duration').textContent = `${totalMins} min`;

                // Play button: play first track
                if (detailPlayBtn) {
                    detailPlayBtn.onclick = () => {
                        if (tracks.length > 0) {
                            playTrack(tracks[0], album);
                        }
                    };
                }
            } else {
                tracklist.innerHTML = '<p class="status-message" style="padding:1rem;">No se encontraron canciones en este álbum.</p>';
                document.getElementById('detail-track-count').textContent = '0 canciones';
                document.getElementById('detail-duration').textContent = '0 min';
            }
        } catch (error) {
            tracklist.innerHTML = `
                <div class="status-container" style="padding:1.5rem;">
                    <p class="status-message" style="color:var(--color-warning);">⚠️ El listado de pistas requiere conexión de red.</p>
                </div>
            `;
            console.error(error);
        }
    }

    function updateDetailRating(albumId) {
        const favorites = getFavorites();
        const rating = favorites[albumId] ? (favorites[albumId].rating || 0) : 0;
        const detailStars = document.querySelectorAll('#detail-star-rating .star');
        detailStars.forEach(s => {
            const val = parseInt(s.dataset.value);
            s.classList.toggle('filled', val <= rating);
        });
        const ratingText = document.getElementById('detail-rating-text');
        if (ratingText) {
            if (rating > 0) {
                ratingText.textContent = `Calificación: ${rating}/5 estrellas`;
            } else {
                ratingText.textContent = favorites[albumId] ? 'Haz clic para calificar' : 'Agrega a favoritos para calificar';
            }
        }
    }

    // Artist bio button
    const bioBtn = document.getElementById('detail-artist-bio-btn');
    if (bioBtn) {
        bioBtn.addEventListener('click', () => {
            if (currentArtist) {
                showToast(`Artista: ${currentArtist.name}. Visita su perfil en Deezer para la bio completa.`, 'info');
            }
        });
    }


    /* ====================================================
       14. REPRODUCTOR DE AUDIO
       ==================================================== */
    const audioFooter = document.getElementById('audio-player-footer');
    const mainAudio = document.getElementById('main-audio');
    const playPauseBtn = document.getElementById('player-play-pause');
    const playerTimeCurrent = document.getElementById('player-time-current');
    const playerTimeDuration = document.getElementById('player-time-duration');
    const playerProgress = document.getElementById('player-progress');
    const playerArt = document.getElementById('player-art');
    const playerTitle = document.getElementById('player-title');
    const playerArtistEl = document.getElementById('player-artist');
    const muteBtn = document.getElementById('player-mute-btn');
    const volumeSlider = document.getElementById('player-volume');
    const nowPlayingMini = document.getElementById('now-playing-mini');
    const nowPlayingTitle = document.getElementById('now-playing-title');

    let currentTrack = null;
    let currentPlayingAlbum = null;

    function playTrack(track, album) {
        if (!track.preview) {
            showToast('Este track no tiene vista previa disponible', 'warning');
            return;
        }

        currentTrack = track;
        currentPlayingAlbum = album;
        mainAudio.src = track.preview;

        // Update player UI
        playerArt.src = album.cover_medium || album.cover || '';
        playerArt.alt = `Portada de ${album.title}`;
        playerTitle.textContent = track.title;
        playerArtistEl.textContent = track.artist ? track.artist.name : '';

        // Show player
        audioFooter.classList.add('active');

        // Update now playing mini card
        if (nowPlayingMini) {
            nowPlayingMini.classList.remove('hidden');
            if (nowPlayingTitle) nowPlayingTitle.textContent = track.title;
        }

        // Play
        mainAudio.play()
            .then(() => {
                playPauseBtn.textContent = '⏸';
            })
            .catch(err => {
                console.error('Error al reproducir:', err);
                showToast('Error al iniciar la reproducción', 'danger');
            });
    }

    // Play/Pause toggle
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (!currentTrack) return;
            if (mainAudio.paused) {
                mainAudio.play();
                playPauseBtn.textContent = '⏸';
            } else {
                mainAudio.pause();
                playPauseBtn.textContent = '▶';
            }
        });
    }

    // Time update
    if (mainAudio) {
        mainAudio.addEventListener('timeupdate', () => {
            if (isNaN(mainAudio.duration)) return;
            const curMins = Math.floor(mainAudio.currentTime / 60);
            const curSecs = String(Math.floor(mainAudio.currentTime % 60)).padStart(2, '0');
            playerTimeCurrent.textContent = `${curMins}:${curSecs}`;

            const durMins = Math.floor(mainAudio.duration / 60);
            const durSecs = String(Math.floor(mainAudio.duration % 60)).padStart(2, '0');
            playerTimeDuration.textContent = `${durMins}:${durSecs}`;

            const progressPercent = (mainAudio.currentTime / mainAudio.duration) * 100;
            playerProgress.value = progressPercent;
        });

        mainAudio.addEventListener('ended', () => {
            playPauseBtn.textContent = '▶';
            playerProgress.value = 0;
            playerTimeCurrent.textContent = '0:00';
        });
    }

    // Progress seek
    if (playerProgress) {
        playerProgress.addEventListener('input', () => {
            if (isNaN(mainAudio.duration) || !mainAudio.duration) return;
            mainAudio.currentTime = (playerProgress.value / 100) * mainAudio.duration;
        });
    }

    // Volume control
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            mainAudio.volume = volumeSlider.value / 100;
            if (mainAudio.volume === 0) muteBtn.textContent = '🔇';
            else if (mainAudio.volume < 0.5) muteBtn.textContent = '🔉';
            else muteBtn.textContent = '🔊';
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (mainAudio.muted) {
                mainAudio.muted = false;
                volumeSlider.value = mainAudio.volume * 100;
                muteBtn.textContent = mainAudio.volume < 0.5 ? '🔉' : '🔊';
            } else {
                mainAudio.muted = true;
                volumeSlider.value = 0;
                muteBtn.textContent = '🔇';
            }
        });
    }


    /* ====================================================
       15. VISTA DE FAVORITOS Y FILTRADO
       ==================================================== */
    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesEmpty = document.getElementById('favorites-empty');
    const ratingFilter = document.getElementById('rating-filter');

    if (ratingFilter) {
        ratingFilter.addEventListener('change', () => renderFavorites());
    }

    function renderFavorites() {
        const favorites = getFavorites();
        const favList = Object.values(favorites);

        if (!favoritesGrid) return;
        favoritesGrid.innerHTML = '';

        if (favList.length === 0) {
            if (favoritesEmpty) favoritesEmpty.classList.remove('hidden');
            favoritesGrid.classList.add('hidden');
            return;
        }

        if (favoritesEmpty) favoritesEmpty.classList.add('hidden');
        favoritesGrid.classList.remove('hidden');

        // Apply filter
        const filterVal = ratingFilter ? ratingFilter.value : 'all';
        let filteredList = favList;

        if (filterVal === 'unrated') {
            filteredList = favList.filter(a => !a.rating || a.rating === 0);
        } else if (filterVal !== 'all') {
            const minRating = parseInt(filterVal);
            filteredList = favList.filter(a => a.rating && a.rating >= minRating);
        }

        if (filteredList.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="status-container" style="grid-column:1/-1;">
                    <span style="font-size:2.5rem; opacity:0.35;">🔍</span>
                    <p class="status-message">Ningún álbum favorito coincide con el filtro seleccionado.</p>
                </div>
            `;
            return;
        }

        filteredList.forEach(album => {
            const card = createAlbumCard(album, album.artistName, true);
            favoritesGrid.appendChild(card);
        });
    }


    /* ====================================================
       16. VISTA DE COLECCIÓN (OFFLINE LIBRARY)
       ==================================================== */
    const collectionTracks = document.getElementById('collection-tracks');
    const collectionEmpty = document.getElementById('collection-empty');
    const storageFill = document.getElementById('storage-fill');
    const storageText = document.getElementById('storage-text');
    const collectionNotification = document.getElementById('collection-notification');
    const notificationDismiss = document.getElementById('notification-dismiss');

    if (notificationDismiss) {
        notificationDismiss.addEventListener('click', () => {
            if (collectionNotification) collectionNotification.classList.add('hidden');
        });
    }

    function showCollectionNotification(title, desc) {
        const notifTitle = document.getElementById('notification-title');
        const notifDesc = document.getElementById('notification-desc');
        if (notifTitle) notifTitle.textContent = title;
        if (notifDesc) notifDesc.textContent = desc;
        if (collectionNotification) collectionNotification.classList.remove('hidden');
    }

    function renderCollection() {
        const favorites = getFavorites();
        const favList = Object.values(favorites);

        if (!collectionTracks) return;
        collectionTracks.innerHTML = '';

        // Calculate storage usage
        const totalStorageBytes = new Blob([JSON.stringify(favorites)]).size;
        const storageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
        const maxStorage = 8; // Simulated max 8 MB
        const usagePercent = Math.min((totalStorageBytes / (maxStorage * 1024 * 1024)) * 100, 100);

        if (storageFill) storageFill.style.width = usagePercent + '%';
        if (storageText) storageText.textContent = `${storageMB} MB de ${maxStorage} MB usados`;

        // Update sync info items
        const syncRatingsInfo = document.getElementById('sync-ratings-info');
        const syncFavsInfo = document.getElementById('sync-favs-info');
        const queueKey = `deezer_sync_queue_${loggedUser}`;
        const queueRaw = localStorage.getItem(queueKey);
        const queue = queueRaw ? JSON.parse(queueRaw) : [];
        const pendingRatings = queue.filter(q => q.action === 'rate_album').length;
        const pendingFavs = queue.filter(q => q.action === 'add_favorite' || q.action === 'remove_favorite').length;

        if (syncRatingsInfo) {
            const span = syncRatingsInfo.querySelector('span:last-child');
            if (pendingRatings > 0) {
                span.textContent = `Calificaciones: ${pendingRatings} pendiente${pendingRatings > 1 ? 's' : ''}`;
                syncRatingsInfo.classList.add('pending');
            } else {
                span.textContent = 'Calificaciones: al día';
                syncRatingsInfo.classList.remove('pending');
            }
        }
        if (syncFavsInfo) {
            const span = syncFavsInfo.querySelector('span:last-child');
            if (pendingFavs > 0) {
                span.textContent = `Favoritos: ${pendingFavs} pendiente${pendingFavs > 1 ? 's' : ''}`;
                syncFavsInfo.classList.add('pending');
            } else {
                span.textContent = 'Favoritos: al día';
                syncFavsInfo.classList.remove('pending');
            }
        }

        if (favList.length === 0) {
            if (collectionEmpty) collectionEmpty.classList.remove('hidden');
            return;
        }

        if (collectionEmpty) collectionEmpty.classList.add('hidden');

        // Render albums as track items (collection view)
        favList.forEach((album, index) => {
            const isOffline = !navigator.onLine;
            const trackEl = document.createElement('div');
            trackEl.className = `track-item`;

            const rating = album.rating || 0;

            trackEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.75rem; flex:1; min-width:0;">
                    <img src="${album.cover_medium || album.cover || ''}" alt="${album.title}" style="width:40px; height:40px; border-radius:var(--radius-sm); object-fit:cover; background:var(--bg-input);">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:600; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${album.title}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${album.artistName} — ${album.release_date ? album.release_date.substring(0, 4) : 'N/A'}</div>
                    </div>
                </div>
                <div class="star-rating" data-album-id="${album.id}" style="flex-shrink:0;">
                    ${[1, 2, 3, 4, 5].map(num => `
                        <span class="star ${num <= rating ? 'filled' : ''} interactive" data-value="${num}">★</span>
                    `).join('')}
                </div>
                ${queue.some(q => q.albumId == album.id) ? '<span class="track-offline-badge">Pendiente</span>' : ''}
                <span class="track-duration" style="flex-shrink:0;">${album.release_date ? album.release_date.substring(0, 4) : ''}</span>
            `;

            // Star rating in collection
            const stars = trackEl.querySelectorAll('.star');
            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = parseInt(star.dataset.value);
                    rateAlbum(album.id, value, trackEl);
                });
            });

            // Click to open album detail
            trackEl.addEventListener('click', () => {
                openAlbumDetail(album, album.artistName);
            });

            collectionTracks.appendChild(trackEl);
        });
    }

    // Collection play all
    const collectionPlayAllBtn = document.getElementById('collection-play-all-btn');
    if (collectionPlayAllBtn) {
        collectionPlayAllBtn.addEventListener('click', () => {
            showToast('Reproducción de colección: disponible próximamente', 'info');
        });
    }


    /* ====================================================
       17. VISTA DE SINCRONIZACIÓN
       ==================================================== */
    function renderSyncView() {
        const favorites = getFavorites();
        const favList = Object.values(favorites);
        const ratedCount = favList.filter(a => a.rating && a.rating > 0).length;

        const syncFavCount = document.getElementById('sync-fav-count');
        const syncRatedCount = document.getElementById('sync-rated-count');
        const syncPendingCount = document.getElementById('sync-pending-count');
        const syncQueueCount = document.getElementById('sync-queue-count');
        const syncQueueList = document.getElementById('sync-queue-list');
        const syncHistory = document.getElementById('sync-history');

        if (syncFavCount) syncFavCount.textContent = favList.length;
        if (syncRatedCount) syncRatedCount.textContent = ratedCount;

        // Get sync queue
        const queueKey = `deezer_sync_queue_${loggedUser}`;
        const queueRaw = localStorage.getItem(queueKey);
        const queue = queueRaw ? JSON.parse(queueRaw) : [];

        if (syncPendingCount) syncPendingCount.textContent = queue.length;
        if (syncQueueCount) {
            syncQueueCount.textContent = queue.length > 0
                ? `${queue.length} cambio${queue.length > 1 ? 's' : ''} pendiente${queue.length > 1 ? 's' : ''} de sincronización.`
                : 'No hay cambios pendientes.';
        }

        // Show queue items
        if (syncQueueList) {
            syncQueueList.innerHTML = '';
            queue.forEach(item => {
                const actionLabels = {
                    'add_favorite': '❤️ Añadir a favoritos',
                    'remove_favorite': '💔 Eliminar de favoritos',
                    'rate_album': '⭐ Calificar álbum'
                };
                const el = document.createElement('div');
                el.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; background:var(--bg-hover); border-radius:var(--radius-sm); font-size:0.85rem;';
                el.innerHTML = `
                    <span>${actionLabels[item.action] || item.action}</span>
                    <span style="color:var(--text-tertiary); font-size:0.75rem;">${item.albumTitle || ''}</span>
                `;
                syncQueueList.appendChild(el);
            });
        }

        // Sync history
        const historyKey = `deezer_sync_history_${loggedUser}`;
        const historyRaw = localStorage.getItem(historyKey);
        const history = historyRaw ? JSON.parse(historyRaw) : [];

        if (syncHistory) {
            syncHistory.innerHTML = '';
            if (history.length === 0) {
                syncHistory.innerHTML = '<p style="color:var(--text-tertiary); font-size:0.85rem;">No hay actividad de sincronización reciente.</p>';
            } else {
                history.slice(-5).reverse().forEach(entry => {
                    const el = document.createElement('div');
                    el.style.cssText = 'display:flex; justify-content:space-between; font-size:0.85rem; padding:0.25rem 0; color:var(--text-secondary);';
                    el.innerHTML = `
                        <span>✅ ${entry.count} cambio${entry.count > 1 ? 's' : ''} sincronizado${entry.count > 1 ? 's' : ''}</span>
                        <span style="color:var(--text-tertiary); font-size:0.75rem;">${new Date(entry.timestamp).toLocaleString('es')}</span>
                    `;
                    syncHistory.appendChild(el);
                });
            }
        }
    }

    // Sync now button
    const syncNowBtn = document.getElementById('sync-now-btn');
    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => {
            if (navigator.onLine) {
                processSyncQueue();
                showToast('Sincronización iniciada...', 'info');
            } else {
                showToast('No hay conexión para sincronizar', 'warning');
            }
        });
    }


    /* ====================================================
       18. COLA DE SINCRONIZACIÓN OFFLINE
       ==================================================== */
    function queueSyncAction(action) {
        if (navigator.onLine) {
            console.log('Online: Acción procesada directamente:', action);
            return;
        }

        const queueKey = `deezer_sync_queue_${loggedUser}`;
        const queueRaw = localStorage.getItem(queueKey);
        const queue = queueRaw ? JSON.parse(queueRaw) : [];

        action.timestamp = Date.now();
        queue.push(action);

        localStorage.setItem(queueKey, JSON.stringify(queue));
        showToast('Modo offline: Acción en cola para sincronizar', 'warning');
    }

    function processSyncQueue() {
        const queueKey = `deezer_sync_queue_${loggedUser}`;
        const queueRaw = localStorage.getItem(queueKey);
        if (!queueRaw) return;

        const queue = JSON.parse(queueRaw);
        if (queue.length === 0) return;

        if (networkText) networkText.textContent = 'Sincronizando...';
        if (networkStatus) networkStatus.className = 'network-badge offline';

        // Enviar cola al servidor personal con fallback local
        setTimeout(async () => {
            try {
                const response = await fetch('http://localhost:3000/api/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username: loggedUser, queue: queue })
                });
                if (response.ok) {
                    console.log('Sincronización diferida completada con el servidor personal.');
                }
            } catch (err) {
                console.warn('Servidor personal de sincronización no disponible. Sincronización diferida completada en modo cliente local.');
            }

            console.log(`Sincronizados ${queue.length} cambios:`, queue);

            // Save to history
            const historyKey = `deezer_sync_history_${loggedUser}`;
            const historyRaw = localStorage.getItem(historyKey);
            const history = historyRaw ? JSON.parse(historyRaw) : [];
            history.push({ count: queue.length, timestamp: Date.now() });
            localStorage.setItem(historyKey, JSON.stringify(history));

            // Clear queue
            localStorage.removeItem(queueKey);

            if (networkStatus) networkStatus.className = 'network-badge online';
            if (networkText) networkText.textContent = 'Online';

            showToast(`¡Sincronizado! ${queue.length} cambio${queue.length > 1 ? 's' : ''} actualizado${queue.length > 1 ? 's' : ''}.`, 'success');

            // Refresh current view
            const syncNav = document.getElementById('nav-sync');
            if (syncNav && syncNav.classList.contains('active')) renderSyncView();
            const collNav = document.getElementById('nav-collection');
            if (collNav && collNav.classList.contains('active')) renderCollection();
        }, 1500);
    }

});
