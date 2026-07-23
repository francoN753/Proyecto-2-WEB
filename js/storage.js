// js/storage.js

/**
 * Módulo para gestionar la persistencia local de la colección privada
 * y la cola de sincronización offline.
 */
const AppStorage = (() => {
    const ALBUMS_KEY = 'deezer_my_albums';
    const OFFLINE_QUEUE_KEY = 'deezer_offline_queue';

    // Inicializa si no existe
    if (!localStorage.getItem(ALBUMS_KEY)) {
        localStorage.setItem(ALBUMS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(OFFLINE_QUEUE_KEY)) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
    }

    const getAlbums = () => JSON.parse(localStorage.getItem(ALBUMS_KEY));
    const saveAlbums = (albums) => localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));

    return {
        /**
         * Obtener todos los álbumes guardados
         */
        getAllAlbums: () => {
            return getAlbums();
        },

        /**
         * Comprobar si un álbum está en favoritos
         */
        isAlbumSaved: (albumId) => {
            const albums = getAlbums();
            return albums.some(a => a.id === albumId);
        },

        /**
         * Agregar un álbum a la colección
         */
        addAlbum: (albumData) => {
            const albums = getAlbums();
            if (!albums.some(a => a.id === albumData.id)) {
                // By default new albums have no rating (0)
                albums.push({ ...albumData, rating: 0, addedAt: Date.now() });
                saveAlbums(albums);
            }
        },

        /**
         * Eliminar un álbum de la colección
         */
        removeAlbum: (albumId) => {
            let albums = getAlbums();
            albums = albums.filter(a => a.id !== albumId);
            saveAlbums(albums);
        },

        /**
         * Actualizar la calificación (estrellas) de un álbum
         */
        updateRating: (albumId, rating) => {
            const albums = getAlbums();
            const index = albums.findIndex(a => a.id === albumId);
            if (index !== -1) {
                albums[index].rating = rating;
                saveAlbums(albums);

                // Si estamos offline, agregamos a la cola de sincronización
                if (!navigator.onLine) {
                    AppStorage.queueOfflineAction('RATING_UPDATE', { albumId, rating });
                }
            }
        },

        /**
         * Obtener álbumes filtrados por calificación
         */
        getAlbumsByRating: (rating) => {
            const albums = getAlbums();
            if (rating === 0) return albums; // 0 significa 'todos' en el filtro
            return albums.filter(a => a.rating === rating);
        },

        // --- Offline Sync Queue ---

        queueOfflineAction: (actionType, payload) => {
            const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY));
            queue.push({ actionType, payload, timestamp: Date.now() });
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        },

        getOfflineQueue: () => {
            return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY));
        },

        clearOfflineQueue: () => {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
        }
    };
})();
