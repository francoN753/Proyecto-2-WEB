// js/api.js
//
// Módulo de acceso a la API de Deezer mediante JSONP.
//
// ¿Por qué JSONP y no fetch? La API de Deezer (api.deezer.com) no envía la
// cabecera "Access-Control-Allow-Origin", así que el navegador bloquea por CORS
// cualquier fetch directo. JSONP esquiva ese bloqueo porque las etiquetas
// <script> no están sujetas a la política de mismo origen: Deezer responde con
// callback({...}) y nosotros recibimos los datos. Todo ocurre en el cliente,
// sin proxies de terceros ni servidor propio.
const DeezerAPI = (() => {
    const BASE_URL = 'https://api.deezer.com';
    const TIMEOUT_MS = 10000;

    /**
     * Petición JSONP genérica a la API de Deezer.
     * @param {string} endpoint  Ej: '/search/artist'
     * @param {object} params    Parámetros de consulta (ej: { q: 'daft punk' })
     * @returns {Promise<object>} La respuesta JSON de Deezer (con su campo .data)
     */
    function request(endpoint, params = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.onLine) {
                reject(new Error('OFFLINE'));
                return;
            }

            const callbackName = 'deezerCb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
            const script = document.createElement('script');
            let finished = false;

            const cleanup = () => {
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                clearTimeout(timer);
            };

            const timer = setTimeout(() => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(new Error('Tiempo de espera agotado al consultar Deezer'));
            }, TIMEOUT_MS);

            // Deezer llamará a esta función global con los datos
            window[callbackName] = (data) => {
                if (finished) return;
                finished = true;
                cleanup();
                if (data && data.error) {
                    reject(new Error(data.error.message || 'Error devuelto por Deezer'));
                } else {
                    resolve(data);
                }
            };

            const query = new URLSearchParams({ ...params, output: 'jsonp', callback: callbackName });
            script.src = `${BASE_URL}${endpoint}?${query.toString()}`;
            script.onerror = () => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(new Error('No se pudo conectar con Deezer'));
            };
            document.body.appendChild(script);
        });
    }

    return {
        request,
        // Buscar artistas por nombre
        searchArtists: (queryText) => request('/search/artist', { q: queryText }),
        // Artistas más populares (para la sección de tendencias)
        getTrendingArtists: (limit = 12) => request('/chart/0/artists', { limit }),
        // Discografía de un artista
        getArtistAlbums: (artistId) => request(`/artist/${artistId}/albums`, { limit: 50 }),
        // Pistas de un álbum
        getAlbumTracks: (albumId) => request(`/album/${albumId}/tracks`)
    };
})();

// Exponer el módulo como global para que dashboard.js lo use en cualquier navegador
window.DeezerAPI = DeezerAPI;
