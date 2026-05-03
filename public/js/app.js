/* ── Estado global ─────────────────────────────────────────── */
const state = {
  usuario:        null,
  paquetes:       [],
  paqueteActual:  null,
  socket:         null,
};

/* ── Helpers HTTP ──────────────────────────────────────────── */
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

/* ── Toast ─────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4000);
}

/* ── Badges ────────────────────────────────────────────────── */
const ESTADO_LABEL = {
  pendiente:   'Pendiente',
  en_transito: 'En tránsito',
  entregado:   'Entregado',
  cancelado:   'Cancelado',
};

function estadoBadge(estado) {
  return `<span class="estado-badge estado-${estado}">${ESTADO_LABEL[estado] || estado}</span>`;
}

/* ══════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════ */
function mostrarAuth()      { document.getElementById('pantalla-auth').classList.remove('hidden'); document.getElementById('pantalla-dashboard').classList.add('hidden'); }
function mostrarDashboard() { document.getElementById('pantalla-auth').classList.add('hidden');    document.getElementById('pantalla-dashboard').classList.remove('hidden'); }

// Tabs login / registro
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`form-${tab.dataset.tab}`).classList.add('active');
  });
});

// Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const data = await api('POST', '/api/auth/login', {
      email:    document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    state.usuario = data.usuario;
    iniciarDashboard();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// Registro
document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('reg-error');
  errEl.textContent = '';
  try {
    const data = await api('POST', '/api/auth/registro', {
      nombre:   document.getElementById('reg-nombre').value,
      email:    document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      rol:      document.getElementById('reg-rol').value,
    });
    state.usuario = data.usuario;
    iniciarDashboard();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  await api('POST', '/api/auth/logout');
  state.usuario = null;
  state.socket && state.socket.disconnect();
  mostrarAuth();
});

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
async function iniciarDashboard() {
  mostrarDashboard();

  document.getElementById('usuario-nombre').textContent = state.usuario.nombre;
  document.getElementById('usuario-rol').textContent    = state.usuario.rol;

  // Mostrar / ocultar botón "Nuevo" solo para clientes y admin
  const btnNuevo = document.getElementById('btn-nuevo-paquete');
  btnNuevo.classList.toggle('hidden', state.usuario.rol === 'mensajero');

  conectarSocket();
  await cargarPaquetes();
}

/* ── Lista de paquetes ─────────────────────────────────────── */
async function cargarPaquetes() {
  try {
    state.paquetes = await api('GET', '/api/paquetes');
    renderizarLista();
  } catch (err) {
    console.error('Error al cargar paquetes:', err);
  }
}

function renderizarLista() {
  const filtro = document.getElementById('filtro-estado').value;
  const lista  = document.getElementById('lista-paquetes');
  lista.innerHTML = '';

  const paquetes = filtro
    ? state.paquetes.filter(p => p.estado === filtro)
    : state.paquetes;

  if (paquetes.length === 0) {
    lista.innerHTML = '<li class="muted" style="padding:1rem">Sin paquetes.</li>';
    return;
  }

  paquetes.forEach(pkg => {
    const li = document.createElement('li');
    if (state.paqueteActual && state.paqueteActual.id === pkg.id) li.classList.add('activo');
    li.innerHTML = `
      <div class="pkg-codigo">${pkg.codigo}</div>
      <div class="pkg-dest">${pkg.destinatario}</div>
      <div class="pkg-estado">${estadoBadge(pkg.estado)}</div>`;
    li.addEventListener('click', () => abrirDetalle(pkg));
    lista.appendChild(li);
  });
}

document.getElementById('filtro-estado').addEventListener('change', renderizarLista);

/* ── Nuevo paquete ─────────────────────────────────────────── */
document.getElementById('btn-nuevo-paquete').addEventListener('click', () => {
  ocultarDetalles();
  document.getElementById('form-paquete-container').classList.remove('hidden');
  document.getElementById('detalle-vacio').classList.add('hidden');
});

document.getElementById('btn-cancelar-pkg').addEventListener('click', () => {
  document.getElementById('form-paquete-container').classList.add('hidden');
  document.getElementById('detalle-vacio').classList.remove('hidden');
});

document.getElementById('form-paquete').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('pkg-error');
  const okEl  = document.getElementById('pkg-ok');
  errEl.textContent = '';
  okEl.textContent  = '';
  try {
    const data = await api('POST', '/api/paquetes', {
      descripcion:   document.getElementById('pkg-descripcion').value,
      destinatario:  document.getElementById('pkg-destinatario').value,
      direccion_dest: document.getElementById('pkg-direccion').value,
      mensaje:       document.getElementById('pkg-mensaje').value,
    });
    okEl.textContent = `✅ Paquete creado: ${data.codigo}`;
    document.getElementById('form-paquete').reset();
    await cargarPaquetes();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

/* ── Detalle de paquete ────────────────────────────────────── */
function ocultarDetalles() {
  document.getElementById('form-paquete-container').classList.add('hidden');
  document.getElementById('detalle-paquete').classList.add('hidden');
}

async function abrirDetalle(pkg) {
  state.paqueteActual = pkg;
  renderizarLista();
  ocultarDetalles();
  document.getElementById('detalle-vacio').classList.add('hidden');

  const el = document.getElementById('detalle-paquete');
  el.classList.remove('hidden');

  document.getElementById('detalle-info').innerHTML = `
    <div><div class="label">Código</div><div class="value">${pkg.codigo}</div></div>
    <div><div class="label">Estado</div><div class="value">${estadoBadge(pkg.estado)}</div></div>
    <div><div class="label">Destinatario</div><div class="value">${pkg.destinatario}</div></div>
    <div><div class="label">Dirección</div><div class="value">${pkg.direccion_dest}</div></div>
    ${pkg.remitente_nombre ? `<div><div class="label">Remitente</div><div class="value">${pkg.remitente_nombre}</div></div>` : ''}
    ${pkg.mensajero_nombre ? `<div><div class="label">Mensajero</div><div class="value">${pkg.mensajero_nombre}</div></div>` : ''}
    ${pkg.mensaje ? `<div style="grid-column:span 2"><div class="label">Mensaje</div><div class="value">${pkg.mensaje}</div></div>` : ''}
  `;

  // Paneles según rol
  const esMensajeroAdmin = ['mensajero', 'admin'].includes(state.usuario.rol);
  document.getElementById('panel-estado').classList.toggle('hidden', !esMensajeroAdmin);
  document.getElementById('panel-ubicacion').classList.toggle('hidden', !esMensajeroAdmin);

  if (esMensajeroAdmin) {
    document.getElementById('nuevo-estado').value = pkg.estado;
  }

  // Suscribir por socket al paquete
  state.socket && state.socket.emit('seguir:paquete', pkg.id);

  // Cargar historial seguimiento
  await cargarSeguimiento(pkg.id);
}

async function cargarSeguimiento(paqueteId) {
  try {
    const historial = await api('GET', `/api/paquetes/${paqueteId}/seguimiento`);
    const ul  = document.getElementById('historial-seguimiento');
    const sin = document.getElementById('sin-seguimiento');

    if (historial.length === 0) {
      ul.innerHTML = '';
      sin.classList.remove('hidden');
      return;
    }
    sin.classList.add('hidden');
    ul.innerHTML = historial.map(h => `
      <li>
        <div class="t-desc">${h.descripcion || 'Sin descripción'}</div>
        ${h.latitud && h.longitud ? `<div class="t-coord">📍 ${h.latitud}, ${h.longitud}</div>` : ''}
        <div class="t-time">${new Date(h.registrado_en).toLocaleString()}</div>
      </li>`).join('');
  } catch (err) {
    console.error('Error al cargar seguimiento:', err);
  }
}

/* ── Actualizar estado ─────────────────────────────────────── */
document.getElementById('btn-actualizar-estado').addEventListener('click', async () => {
  if (!state.paqueteActual) return;
  const estado = document.getElementById('nuevo-estado').value;
  try {
    await api('PATCH', `/api/paquetes/${state.paqueteActual.id}/estado`, { estado });
    showToast(`Estado actualizado a: ${ESTADO_LABEL[estado]}`);
    await cargarPaquetes();
    const pkgActualizado = state.paquetes.find(p => p.id === state.paqueteActual.id);
    if (pkgActualizado) abrirDetalle(pkgActualizado);
  } catch (err) {
    showToast('Error: ' + err.message);
  }
});

/* ── Registrar ubicación ───────────────────────────────────── */
document.getElementById('btn-registrar-ubicacion').addEventListener('click', async () => {
  if (!state.paqueteActual) return;
  const latRaw = document.getElementById('ubi-lat').value;
  const lngRaw = document.getElementById('ubi-lng').value;
  const lat  = latRaw  !== '' ? parseFloat(latRaw)  : null;
  const lng  = lngRaw  !== '' ? parseFloat(lngRaw)  : null;
  const desc = document.getElementById('ubi-desc').value;
  try {
    await api('POST', `/api/paquetes/${state.paqueteActual.id}/ubicacion`, {
      latitud: lat, longitud: lng, descripcion: desc,
    });
    document.getElementById('ubi-lat').value  = '';
    document.getElementById('ubi-lng').value  = '';
    document.getElementById('ubi-desc').value = '';
    showToast('Ubicación registrada');
    await cargarSeguimiento(state.paqueteActual.id);
  } catch (err) {
    showToast('Error: ' + err.message);
  }
});

/* ══════════════════════════════════════════════════════════════
   SOCKET.IO - Tiempo real
══════════════════════════════════════════════════════════════ */
function conectarSocket() {
  if (state.socket) state.socket.disconnect();
  state.socket = io();

  // Nuevo paquete creado por otro cliente
  state.socket.on('paquete:nuevo', async (data) => {
    showToast(`📦 Nuevo paquete recibido: ${data.codigo}`);
    await cargarPaquetes();
  });

  // Estado de paquete actualizado
  state.socket.on('paquete:estado', async (data) => {
    const pkg = state.paquetes.find(p => p.id === data.id);
    if (pkg) {
      showToast(`🔄 Paquete ${pkg.codigo} → ${ESTADO_LABEL[data.estado]}`);
      await cargarPaquetes();
      if (state.paqueteActual && state.paqueteActual.id === data.id) {
        const actualizado = state.paquetes.find(p => p.id === data.id);
        if (actualizado) abrirDetalle(actualizado);
      }
    }
  });

  // Nueva ubicación registrada
  state.socket.on('paquete:ubicacion', async (data) => {
    showToast(`📍 Ubicación actualizada para paquete #${data.paquete_id}`);
    if (state.paqueteActual && state.paqueteActual.id === data.paquete_id) {
      await cargarSeguimiento(data.paquete_id);
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   INICIO
══════════════════════════════════════════════════════════════ */
(async () => {
  try {
    const data = await api('GET', '/api/auth/me');
    state.usuario = data.usuario;
    iniciarDashboard();
  } catch {
    mostrarAuth();
  }
})();
