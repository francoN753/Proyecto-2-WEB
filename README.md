# Deezer Manager 🎵

¡Bienvenido a **Deezer Manager**! Una aplicación web de reproducción y gestión musical de vanguardia. 
Este proyecto es una Single Page Application (SPA) construida con tecnologías web puras (HTML5, CSS3, JavaScript Vainilla) que ofrece una experiencia moderna, fluida y con un diseño 100% responsivo, replicando la sensación de las aplicaciones musicales líderes de la industria.

## Características Principales ✨

- **Diseño Premium y Responsivo:** Paleta de colores en Dark Mode nativo (con toques de acento morado), animaciones suaves, layouts avanzados con CSS Grid/Flexbox y una interfaz que se adapta perfectamente desde resoluciones de escritorio hasta pantallas de teléfonos móviles (como iPhone).
- **Integración con Deezer API:** Consume datos reales de la plataforma de Deezer (usando JSONP para saltar restricciones de CORS) para mostrar perfiles de artistas, álbumes y canciones en tendencia.
- **Reproductor Integrado:** Un reproductor fijo en la parte inferior de la pantalla con botones interactivos, barra de progreso y control de volumen.
- **Enrutamiento Interno (SPA):** Navegación ultrarrápida sin recargas de página mediante un sistema de vistas en JavaScript vainilla.
- **Soporte Offline (PWA):** Incorpora un potente Service Worker que cachea los assets de la página. Si pierdes la conexión, la aplicación te mostrará un banner offline inteligente y te permitirá seguir utilizando la interfaz.
- **Calificación por Estrellas:** Componente interactivo diseñado para que el usuario pueda interactuar visualmente con los álbumes.

## Tecnologías Utilizadas 🛠️

- **HTML5 & CSS3:** Semántica moderna, variables CSS, micro-animaciones (keyframes) y selectores avanzados. No se requirieron frameworks CSS pesados.
- **JavaScript Vainilla (ES6+):** Fetching, gestión del DOM, manipulación de History API y LocalStorage para la autenticación y persistencia de favoritos.
- **Service Workers:** Para la gestión dinámica del caché y permitir uso offline.

---

## Uso de Inteligencia Artificial en el Desarrollo 🤖🚀

Este proyecto fue desarrollado y estructurado gracias al uso de Inteligencia Artificial avanzada, integramos las siguientes tecnologías de IA en nuestro flujo de trabajo:

- **Claude Code con Antigravity:** Utilizamos el entorno avanzado de Antigravity IDE, lo que permitió a la IA tener un contexto total del espacio de trabajo.
- **Modelos de Lenguaje de Última Generación:** El desarrollo se llevó a cabo utilizando **Claude Opus (4.8)** y **Gemini Pro 3.1**, combinando sus capacidades de razonamiento profundo.
- **Plan Mode:** La arquitectura y refactorizaciones complejas (como el CSS Grid o el Service Worker) fueron cuidadosamente elaboradas utilizando el *Plan Mode* del agente, permitiendo una colaboración iterativa y sin errores entre el usuario y la IA.
- **Íconos e Interfaz:** La interfaz fue enriquecida visualmente utilizando un repositorio externo de iconos vectoriales ultraligeros de GitHub (ReIcon), integrado directamente por la IA para embellecer los botones.
- **Pruebas Automatizadas QA (Agentes MCP):** Las funcionalidades del proyecto (autenticación, ruteo SPA, conexión al API y el reproductor de audio) fueron rigurosamente validadas. Para ello, instanciamos un **agente especializado con extensión de Chrome mediante MCP (Model Context Protocol)**, el cual abrió un navegador real de forma autónoma e interactuó con el proyecto en vivo simulando a un usuario humano para reportar el estado de cada componente.

---

## Cómo empezar 🚀

1. Clona este repositorio.
2. Abre la carpeta del proyecto en tu terminal.
3. Inicia un servidor local. Puedes usar `npx serve -p 3000`, `Live Server` o Python (`python -m http.server 3000`).
4. Ingresa a `http://localhost:3000/`.
5. ¡Disfruta de la experiencia Deezer Manager!
