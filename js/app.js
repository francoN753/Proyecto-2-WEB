// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Session Check & Theme ---
    const token = localStorage.getItem('deezer_auth_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const username = localStorage.getItem('deezer_user') || 'Usuario';
    document.getElementById('user-display').textContent = `Hola, ${username}`;

    setTimeout(() => {
        const loader = document.getElementById('global-loading');
        if(loader) loader.style.display = 'none';
    }, 500);

    const themeToggle = document.getElementById('theme-toggle');
    const initTheme = () => {
        const savedTheme = localStorage.getItem('deezer_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const iconSvg = theme === 'dark' 
            ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('deezer_theme', newTheme);
        updateThemeIcon(newTheme);
    });
    initTheme();

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('deezer_auth_token');
        localStorage.removeItem('deezer_user');
        window.location.href = 'index.html';
    });

    // --- 2. View Navigation ---
    const navItems = document.querySelectorAll('.nav-menu .nav-item[data-view]');
    const views = document.querySelectorAll('.view-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    window.switchView = (viewId) => {
        navItems.forEach(item => item.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if(activeNav) activeNav.classList.add('active');

        views.forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');

        if (viewId === 'search') {
            searchForm.style.display = 'flex';
        } else {
            searchForm.style.display = 'none';
        }

        if (viewId === 'albums') {
            renderMyAlbums();
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            window.switchView(item.dataset.view);
        });
    });

    document.getElementById('back-to-search').addEventListener('click', () => {
        window.switchView('search');
    });

    // --- 3. Search Logic ---
    let searchTimeout;
    const searchResultsContainer = document.getElementById('search-results');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch(searchInput.value.trim());
    });

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500); // Debounce
    });

    async function performSearch(query) {
        if (!query) {
            searchResultsContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <h2>Busca tu música favorita</h2>
                    <p>Utiliza la barra superior para buscar cualquier artista.</p>
                </div>`;
            return;
        }

        searchResultsContainer.innerHTML = `<div style="text-align:center; padding: 2rem;"><div class="spinner" style="margin: 0 auto; border-top-color: var(--primary-color);"></div><p style="margin-top:1rem;">Buscando...</p></div>`;

        try {
            const res = await DeezerAPI.searchArtists(query);
            if (res.data && res.data.length > 0) {
                renderArtistResults(res.data);
            } else {
                searchResultsContainer.innerHTML = `
                    <div class="empty-state">
                        <h2 style="margin-bottom: 0.5rem;">Resultados no encontrados</h2>
                        <p>No pudimos encontrar ningún artista que coincida con "${query}".</p>
                    </div>`;
            }
        } catch (error) {
            searchResultsContainer.innerHTML = `
                <div class="empty-state" style="color: #ef4444;">
                    <h2 style="margin-bottom: 0.5rem;">Error en la búsqueda</h2>
                    <p>No se pudo contactar con Deezer o estás desconectado.</p>
                </div>`;
        }
    }

    function renderArtistResults(artists) {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">';
        artists.forEach(artist => {
            html += `
                <div class="glass-card artist-card" style="cursor:pointer; text-align:center; padding:1.5rem;" onclick="loadArtistDetails(${artist.id}, '${artist.name.replace(/'/g, "\\'")}')">
                    <img src="${artist.picture_medium}" alt="${artist.name}" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover; margin: 0 auto 1rem;">
                    <h3 style="font-weight: 600;">${artist.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">${artist.nb_fan.toLocaleString()} fans</p>
                </div>
            `;
        });
        html += '</div>';
        searchResultsContainer.innerHTML = html;
    }

    // --- 4. Artist Details & Albums ---
    window.loadArtistDetails = async (artistId, artistName) => {
        window.switchView('artist');
        const container = document.getElementById('artist-details-content');
        container.innerHTML = `<div style="text-align:center; padding: 2rem;"><div class="spinner" style="margin: 0 auto; border-top-color: var(--primary-color);"></div><p style="margin-top:1rem;">Cargando discografía de ${artistName}...</p></div>`;

        try {
            const albumsRes = await DeezerAPI.getArtistAlbums(artistId);
            renderArtistAlbums(artistName, albumsRes.data);
        } catch (error) {
            container.innerHTML = `<div class="empty-state" style="color: #ef4444;"><p>Error cargando detalles.</p></div>`;
        }
    };

    function renderArtistAlbums(artistName, albums) {
        const container = document.getElementById('artist-details-content');
        let html = `<h2 style="font-size: 2rem; margin-bottom: 2rem; font-weight: 700;">${artistName} <span style="font-size: 1rem; color: var(--text-secondary); font-weight: 400;">/ Discografía</span></h2>`;
        
        if (!albums || albums.length === 0) {
            html += `<p>No hay álbumes disponibles.</p>`;
        } else {
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">';
            albums.forEach(album => {
                const isSaved = AppStorage.isAlbumSaved(album.id);
                html += `
                    <div class="glass-card album-card" style="padding: 1rem; display: flex; flex-direction: column;">
                        <img src="${album.cover_medium}" alt="${album.title}" style="border-radius: var(--radius-md); width: 100%; aspect-ratio: 1; object-fit: cover; margin-bottom: 1rem;">
                        <h3 style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${album.title}</h3>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">${new Date(album.release_date).getFullYear() || 'Desconocido'}</p>
                        
                        <div style="margin-top: auto; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="btn-primary" style="padding: 0.5rem; flex: 1; font-size: 0.85rem;" onclick="loadAlbumTracks(${album.id}, this)">Ver Pistas</button>
                            <button class="btn-icon" style="background: ${isSaved ? 'var(--primary-color)' : 'var(--bg-input)'}; color: ${isSaved ? 'white' : 'var(--text-primary)'}; border-radius: var(--radius-md);" onclick='toggleSaveAlbum(${JSON.stringify(album).replace(/'/g, "\\'")}, this)' title="${isSaved ? 'Quitar de Mis Álbumes' : 'Guardar en Mis Álbumes'}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </button>
                        </div>
                        <div id="tracks-container-${album.id}" style="margin-top: 1rem; display:none; flex-direction:column; gap:0.5rem; font-size: 0.85rem;"></div>
                    </div>
                `;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // --- 5. Tracks & Player ---
    const audioPlayer = document.getElementById('global-player');
    let currentPlayingBtn = null;

    window.loadAlbumTracks = async (albumId, btnElement) => {
        const tracksContainer = document.getElementById(`tracks-container-${albumId}`);
        
        // Toggle visibility if already loaded
        if (tracksContainer.innerHTML !== '') {
            tracksContainer.style.display = tracksContainer.style.display === 'none' ? 'flex' : 'none';
            btnElement.textContent = tracksContainer.style.display === 'none' ? 'Ver Pistas' : 'Ocultar Pistas';
            return;
        }

        btnElement.textContent = 'Cargando...';
        try {
            const tracksRes = await DeezerAPI.getAlbumTracks(albumId);
            let html = '';
            tracksRes.data.forEach((track, index) => {
                const hasPreview = !!track.preview;
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.5rem; background: var(--bg-input); border-radius: var(--radius-sm);">
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; margin-right: 0.5rem;">${index + 1}. ${track.title}</span>
                        ${hasPreview ? `
                        <button class="btn-icon" style="padding:0.25rem; color:var(--primary-color);" onclick="playTrack('${track.preview}', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </button>
                        ` : '<span style="font-size:0.7rem; color:var(--text-secondary);">No preview</span>'}
                    </div>
                `;
            });
            tracksContainer.innerHTML = html;
            tracksContainer.style.display = 'flex';
            btnElement.textContent = 'Ocultar Pistas';
        } catch (error) {
            btnElement.textContent = 'Ver Pistas';
            alert('Error cargando pistas.');
        }
    };

    window.playTrack = (url, btnElement) => {
        if (audioPlayer.src === url && !audioPlayer.paused) {
            // Pause if clicking same playing track
            audioPlayer.pause();
            btnElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            currentPlayingBtn = null;
        } else {
            // Reset previous button icon
            if (currentPlayingBtn) {
                currentPlayingBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            }
            
            audioPlayer.src = url;
            audioPlayer.play();
            // Pause icon
            btnElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
            currentPlayingBtn = btnElement;

            audioPlayer.onended = () => {
                btnElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
                currentPlayingBtn = null;
            };
        }
    };

    // --- 6. My Albums & Ratings ---
    window.toggleSaveAlbum = (album, btnElement) => {
        const isSaved = AppStorage.isAlbumSaved(album.id);
        if (isSaved) {
            AppStorage.removeAlbum(album.id);
            btnElement.style.background = 'var(--bg-input)';
            btnElement.style.color = 'var(--text-primary)';
            btnElement.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
            btnElement.title = 'Guardar en Mis Álbumes';
        } else {
            AppStorage.addAlbum(album);
            btnElement.style.background = 'var(--primary-color)';
            btnElement.style.color = 'white';
            btnElement.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
            btnElement.title = 'Quitar de Mis Álbumes';
        }
        
        // If we are currently in My Albums view, re-render
        if (document.getElementById('view-albums').classList.contains('active')) {
            renderMyAlbums();
        }
    };

    const ratingFilter = document.getElementById('rating-filter');
    ratingFilter.addEventListener('change', () => {
        renderMyAlbums();
    });

    window.renderMyAlbums = () => {
        const container = document.getElementById('my-albums-list');
        const filterVal = parseInt(ratingFilter.value, 10);
        const albums = AppStorage.getAlbumsByRating(filterVal);

        if (albums.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No tienes álbumes guardados${filterVal > 0 ? ' con esta calificación' : ''}.</p>
                </div>`;
            return;
        }

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">';
        albums.forEach(album => {
            html += `
                <div class="glass-card album-card" style="padding: 1rem; display: flex; flex-direction: column;">
                    <img src="${album.cover_medium}" alt="${album.title}" style="border-radius: var(--radius-md); width: 100%; aspect-ratio: 1; object-fit: cover; margin-bottom: 1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${album.title}</h3>
                        </div>
                        <button class="btn-icon" style="color: #ef4444;" onclick="removeMyAlbum(${album.id})" title="Quitar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                    
                    <!-- Stars Rating Component -->
                    <div class="stars-container" style="margin-top: auto; display: flex; gap: 0.25rem; color: #fbbf24; font-size: 1.25rem; padding-top: 1rem;">
                        ${[1,2,3,4,5].map(star => `
                            <span style="cursor:pointer;" onclick="setRating(${album.id}, ${star})">
                                ${star <= album.rating ? '★' : '☆'}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    };

    window.removeMyAlbum = (albumId) => {
        AppStorage.removeAlbum(albumId);
        renderMyAlbums();
    };

    window.setRating = (albumId, rating) => {
        AppStorage.updateRating(albumId, rating);
        renderMyAlbums();
    };

    // --- 7. Service Worker & Offline Sync ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered:', reg.scope))
            .catch(err => console.error('SW Error:', err));
    }

    const offlineBanner = document.getElementById('offline-banner');

    const updateOnlineStatus = () => {
        if (navigator.onLine) {
            offlineBanner.style.display = 'none';
            // Trigger Deferred Sync
            const queue = AppStorage.getOfflineQueue();
            if (queue && queue.length > 0) {
                console.log(`Syncing ${queue.length} offline actions...`);
                // In a real app we would send this to the server.
                // For Deezer-Manager, local storage ratings are already saved,
                // but we could pretend to send them to an API.
                AppStorage.clearOfflineQueue();
                console.log('Sync complete.');
            }
        } else {
            offlineBanner.style.display = 'block';
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
});
