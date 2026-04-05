// ─── Validación RUT chileno ───────────────────────────────────────────────────
function validarRUT(rut) {
  const cleaned = rut.replace(/[.\-\s]/g, '');
  if (cleaned.length < 2) return false;
  const cuerpo = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  let suma = 0, multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvChar = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
  return dv === dvChar;
}

function formatearRUT(rut) {
  const cleaned = rut.replace(/[^0-9kK]/g, '');
  if (cleaned.length < 2) return cleaned;
  const cuerpo = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  const cuerpoFmt = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFmt}-${dv}`;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderCampo(campo) {
  const required = campo.requerido ? 'required' : '';
  const reqMark = campo.requerido ? '<span style="color:var(--red)"> *</span>' : '';

  if (campo.tipo === 'select') {
    const opts = campo.opciones.map(o => `<option value="${o}">${o}</option>`).join('');
    return `
      <div class="field-group" id="group-${campo.id}">
        <label for="${campo.id}">${campo.label}${reqMark}</label>
        <div class="select-wrapper">
          <select id="${campo.id}" name="${campo.id}" ${required}>
            <option value="" disabled selected>Selecciona una opción</option>
            ${opts}
          </select>
        </div>
        <span class="field-error" id="err-${campo.id}"></span>
      </div>`;
  }

  return `
    <div class="field-group" id="group-${campo.id}">
      <label for="${campo.id}">${campo.label}${reqMark}</label>
      <input
        type="${campo.tipo === 'rut' ? 'text' : campo.tipo}"
        id="${campo.id}"
        name="${campo.id}"
        placeholder="${campo.placeholder || ''}"
        ${required}
        ${campo.tipo === 'rut' ? 'maxlength="12" autocomplete="off"' : ''}
        ${campo.tipo === 'tel' ? 'inputmode="tel"' : ''}
      >
      <span class="field-error" id="err-${campo.id}"></span>
    </div>`;
}

// ─── Validación de campo individual ──────────────────────────────────────────
function validarCampo(campo, value) {
  if (campo.requerido && !value.trim()) return 'Este campo es obligatorio.';
  if (!value.trim()) return null; // opcional vacío → ok

  if (campo.tipo === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo válido.';
  }
  if (campo.tipo === 'rut') {
    if (!validarRUT(value)) return 'RUT inválido. Verifica el dígito verificador.';
  }
  if (campo.tipo === 'tel') {
    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(value)) return 'Teléfono inválido.';
  }
  return null;
}

// ─── Envío a HubSpot Forms API (no requiere API key) ─────────────────────────
async function enviarHubSpot(config, datos) {
  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${config.hubspot.portalId}/${config.hubspot.formGuid}`;

  const fields = Object.entries(datos).map(([name, value]) => ({ name, value }));

  const payload = {
    fields,
    context: {
      pageUri: window.location.href,
      pageName: config.titulo
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HubSpot error ${res.status}`);
  }
  return true;
}

// ─── Envío a Google Apps Script (append row en Sheet) ────────────────────────
async function enviarSheets(config, datos) {
  // no-cors: el dato llega al sheet igualmente, solo no podemos leer la respuesta
  await fetch(config.sheets.webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, formulario: config.titulo, timestamp: new Date().toISOString() })
  });
  return true;
}

// ─── Init principal ───────────────────────────────────────────────────────────
export function initForm(config) {
  const app = document.getElementById('form-app');

  app.innerHTML = `
    <header class="site-header">
      <a href="/" class="logo">
        <div class="logo-mark">UAH</div>
        Universidad Alberto Hurtado
      </a>
      <nav><a href="/">Volver al inicio</a></nav>
    </header>

    <main>
      <div class="form-sidebar">
        <span class="activity-tag">${config.tag || 'Inscripción'}</span>
        <h1>${config.titulo.replace(/([A-ZÁÉÍÓÚ][a-záéíóú]+)/, '<em>$1</em>')}</h1>
        <div class="divider"></div>
        <p>${config.subtitulo}</p>
      </div>

      <div class="form-card">
        <div class="form-card-header">
          <span>Formulario de inscripción</span>
          <div class="form-step-indicator">
            <div class="form-step-dot active"></div>
            <div class="form-step-dot"></div>
            <div class="form-step-dot"></div>
          </div>
        </div>

        <div class="form-body" id="form-body">
          <form id="main-form" novalidate>
            ${config.campos.map(renderCampo).join('')}
            <button type="submit" class="btn-submit" id="btn-submit">
              <div class="spinner"></div>
              <span class="btn-text">Inscribirme</span>
            </button>
          </form>
        </div>

        <div class="success-screen" id="success-screen">
          <div class="success-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2>¡Inscripción enviada!</h2>
          <p>Hemos recibido tu información. Te contactaremos pronto<br>al correo que nos proporcionaste.</p>
        </div>
      </div>

      <div></div><!-- columna derecha vacía -->
    </main>

    <footer class="site-footer">
      © ${new Date().getFullYear()} Universidad Alberto Hurtado · Alameda 1869, Santiago
    </footer>
  `;

  // ── RUT: formateo en tiempo real ──────────────────────────────────────────
  const rutField = document.getElementById('rut');
  if (rutField) {
    rutField.addEventListener('input', e => {
      const pos = e.target.selectionStart;
      e.target.value = formatearRUT(e.target.value);
      try { e.target.setSelectionRange(pos, pos); } catch(_) {}
    });
  }

  // ── Validación en tiempo real al salir del campo ──────────────────────────
  config.campos.forEach(campo => {
    const el = document.getElementById(campo.id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const err = validarCampo(campo, el.value);
      const group = document.getElementById(`group-${campo.id}`);
      const errEl = document.getElementById(`err-${campo.id}`);
      if (err) {
        group.classList.add('error');
        errEl.textContent = err;
      } else {
        group.classList.remove('error');
        errEl.textContent = '';
      }
    });
    // Limpiar error al empezar a escribir
    el.addEventListener('input', () => {
      if (document.getElementById(`group-${campo.id}`).classList.contains('error')) {
        const err = validarCampo(campo, el.value);
        if (!err) {
          document.getElementById(`group-${campo.id}`).classList.remove('error');
          document.getElementById(`err-${campo.id}`).textContent = '';
        }
      }
    });
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  document.getElementById('main-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar todos los campos
    let hayErrores = false;
    const datos = {};

    config.campos.forEach(campo => {
      const el = document.getElementById(campo.id);
      if (!el) return;
      const err = validarCampo(campo, el.value);
      const group = document.getElementById(`group-${campo.id}`);
      const errEl = document.getElementById(`err-${campo.id}`);

      if (err) {
        group.classList.add('error');
        errEl.textContent = err;
        hayErrores = true;
      }
      datos[campo.id] = el.value.trim();
    });

    // Agregar campo de interés para HubSpot multi-select
    if (config.interes) datos['interes'] = config.interes;

    if (hayErrores) return;

    // UI loading
    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      // Envío paralelo: HubSpot + Sheets al mismo tiempo
      await Promise.all([
        enviarHubSpot(config, datos),
        enviarSheets(config, datos)
      ]);

      // Éxito
      document.getElementById('form-body').style.display = 'none';
      document.getElementById('success-screen').classList.add('visible');

    } catch (err) {
      console.error('Error al enviar:', err);
      btn.disabled = false;
      btn.classList.remove('loading');
      alert('Hubo un problema al enviar el formulario. Por favor intenta nuevamente.');
    }
  });
}
