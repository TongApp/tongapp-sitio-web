// Muestra un texto legal desde la API de El Tongo: la base de datos es la fuente y esta página solo
// lo pinta. `/terminos/`, `/privacidad/` y `/propietarios/` muestran la versión vigente;
// `?version=AAAA-MM-DD`, una anterior (la que aceptó alguien antes). El tipo sale de
// <body data-kind="TERMS|PRIVACY|OWNER_TERMS">.
(function () {
  const PRODUCTION_HOSTS = ['eltongo.com', 'www.eltongo.com'];
  // En local el sitio se sirve con `python3 -m http.server` y la API corre en el puerto 8000.
  const API_URL = PRODUCTION_HOSTS.includes(location.hostname)
    ? 'https://api.eltongo.co'
    : 'http://localhost:8000';
  const VERSION_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
  const CONTACT = 'administracion@eltongo.com';

  const kind = document.body.dataset.kind;
  const version = new URLSearchParams(location.search).get('version');
  const status = document.getElementById('status');
  const versionLabel = document.getElementById('version');
  const notice = document.getElementById('notice');
  const content = document.getElementById('content');

  function showError(message) {
    status.textContent = message;
    status.hidden = false;
  }

  function formatVersion(value) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day); // fecha local: sin corrimiento por zona horaria
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function show(documentData) {
    versionLabel.textContent = 'Versión del ' + formatVersion(documentData.version);
    versionLabel.hidden = false;
    notice.hidden = documentData.is_current;
    // El texto viene de la base de datos de El Tongo, donde solo lo publica la CLI del backend.
    content.innerHTML = documentData.content;
    status.hidden = true;
  }

  async function load() {
    if (version !== null && !VERSION_FORMAT.test(version)) {
      showError('La versión debe ser una fecha AAAA-MM-DD.');
      return;
    }
    const path = version === null ? kind : kind + '/' + encodeURIComponent(version);
    let response;
    try {
      response = await fetch(API_URL + '/legal-documents/' + path);
    } catch {
      showError('No pudimos cargar el texto. Intenta de nuevo o escríbenos a ' + CONTACT + '.');
      return;
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      showError(body?.detail ?? 'No pudimos cargar el texto. Intenta de nuevo.');
      return;
    }
    show(body);
  }

  load();
})();
