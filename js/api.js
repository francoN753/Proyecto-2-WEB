// js/api.js

/**
 * Módulo para interactuar con la API de Deezer.
 * Utiliza un proxy CORS para evitar bloqueos del navegador.
 */
const DeezerAPI = (() => {
    const BASE_URL = 'https://api.deezer.com';
    const CORS_PROXY = 'https://corsproxy.io/?';

    /**
     * Realiza una petición a la API de Deezer a través de un proxy CORS
     * @param {string} endpoint - Ejemplo: '/search/artist'
     * @param {object} params - Parámetros de consulta
     * @returns {Promise}
     */
    const fetchAPI = async (endpoint, params = {}) => {
        try {
            // Build URL
            const urlObj = new URL(BASE_URL + endpoint);
            Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
            
            // Encode the full Deezer URL and append to proxy
            const finalUrl = CORS_PROXY + encodeURIComponent(urlObj.toString());

            const response = await fetch(finalUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || "Error en la API de Deezer");
            }
            
            return data;
        } catch (error) {
            console.error("API Request Failed:", error);
            throw error;
        }
    };

    return {
        /**
         * Buscar artistas por nombre
         */
        searchArtists: async (query) => {
            if (!query) return { data: [] };
            return await fetchAPI('/search/artist', { q: query });
        },

        /**
         * Obtener detalles de un artista
         */
        getArtist: async (artistId) => {
            return await fetchAPI(`/artist/${artistId}`);
        },

        /**
         * Obtener álbumes de un artista
         */
        getArtistAlbums: async (artistId) => {
            // Limit to top 50 for simplicity
            return await fetchAPI(`/artist/${artistId}/albums`, { limit: 50 });
        },

        /**
         * Obtener pistas (tracks) de un álbum
         */
        getAlbumTracks: async (albumId) => {
            return await fetchAPI(`/album/${albumId}/tracks`);
        }
    };
})();
