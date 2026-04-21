// ============================================================
// TRACKJF GPS System - Main Application Logic
// ============================================================
(function() {
  'use strict';

  const T = window.TRACKJF;

  // ---- State ----
  let currentPage = 'dashboard';
  let map = null;
  let vehicleMarkers = [];
  let geofenceLayerGroup = null;
  let historyMap = null;
  let historyPolyline = null;
  let geofenceMap = null;
  let isSatellite = false;
  let tileLayer = null;
  let editingId = null;
  let pickedLatLng = null;

  // ---- Session ----
  const user = sessionStorage.getItem('trackjf_user') || 'admin';
  const role = sessionStorage.getItem('trackjf_role') || 'admin';
  const country = sessionStorage.getItem('trackjf_country') || 've';
  const clientId = parseInt(sessionStorage.getItem('trackjf_clientId')) || null;

  const userText = document.getElementById('userName');
  if (userText) userText.textContent = user;
  const avatar = document.getElementById('userAvatar');
  if (avatar) avatar.textContent = user.slice(0,2).toUpperCase();
  const flag = document.getElementById('countryFlag');
  if (flag) flag.textContent = country === 'co' ? '🇨🇴' : '🇻🇪';

  // ---- SaaS Data Isolation (Multi-tenant) ----
  if (clientId && role !== 'admin' && role !== 'superadmin') {
    T.vehicles = T.vehicles.filter(v => v.clientId === clientId);
    T.clients = T.clients.filter(c => c.id === clientId);
    T.contracts = (T.contracts || []).filter(c => c.clientId === clientId);
    
    // Cascading filters for related entities
    T.devices = T.devices.filter(d => T.vehicles.some(v => v.id === d.vehicleId));
    T.drivers = T.drivers.filter(d => T.vehicles.some(v => v.id === d.vehicleId));
    T.alerts = T.alerts.filter(a => T.vehicles.some(v => v.id === a.vehicleId));
    T.events = T.events.filter(e => T.vehicles.some(v => v.id === e.vehicleId));

    // Hide administrative sidebars
    const navClients = document.getElementById('nav-clients');
    const navDevices = document.getElementById('nav-devices');
    const navUsers = document.getElementById('nav-users');
    if(navClients) navClients.style.display = 'none';
    if(navDevices) navDevices.style.display = 'none';
    if(navUsers) navUsers.style.display = 'none';
  }

  // ---- Navigation ----
  window.navigate = function(page) {
    if (!page) return;
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
    
    const pg = document.getElementById('page-' + page);
    if (pg) pg.classList.add('active');
    
    document.querySelectorAll('.nav-item[data-page="' + page + '"]').forEach(n => n.classList.add('active'));
    document.querySelectorAll('.mobile-nav-item[data-page="' + page + '"]').forEach(n => n.classList.add('active'));
    const titles = {
      dashboard: 'Mapa en Vivo',
      vehicles: 'Gestión de Vehículos',
      alerts: 'Centro de Alertas',
      clients: 'Gestión de Clientes',
      devices: 'Dispositivos GPS',
      drivers: 'Conductores',
      geofences: 'Geocercas',
      reports: 'Reportes y Estadísticas',
      history: 'Historial de Rutas',
      events: 'Registro de Eventos',
      users: 'Usuarios del Sistema',
      settings: 'Configuración del Sistema',
      meitrack: 'Meitrack Manager',
      cameras: 'Cámaras en Vivo (ADAS/DSM)',
      telemetry: 'Telemetría Avanzada',
    };
    const pTitle = document.getElementById('pageTitle');
    if (pTitle) pTitle.textContent = titles[page] || page;

    // Lazy-init maps + recalc size when page was hidden (display:none breaks Leaflet hit-testing)
    setTimeout(() => {
      if (page === 'dashboard') {
        if (!map) initDashboardMap();
        else map.invalidateSize();
      }
      if (page === 'history') {
        if (!historyMap) initHistoryMap();
        else historyMap.invalidateSize();
      }
      if (page === 'geofences') {
        if (!geofenceMap) initGeofenceMap();
        else geofenceMap.invalidateSize();
      }
    }, 150);

    // Render page data
    if (page === 'vehicles') renderVehiclesTable();
    if (page === 'alerts') renderAlertsTable();
    if (page === 'clients') renderClientsTable();
    if (page === 'devices') renderDevicesTable();
    if (page === 'drivers') renderDriversTable();
    if (page === 'events') renderEventsTable();
    if (page === 'users') renderUsersTable();
    if (page === 'geofences') renderGeofenceList();
    if (page === 'reports') populateReportVehicle();
    if (page === 'history') populateHistoryVehicle();
    if (page === 'cameras') renderCamerasPage();
    if (page === 'telemetry') renderTelemetryPage();
    if (page === 'meitrack') renderMeitrackPage();
  }

  // ---- Navigation Handlers (Event Delegation) ----
  document.addEventListener('mousedown', e => {
    const navItem = e.target.closest('.nav-item[data-page]');
    if (navItem) {
      e.preventDefault();
      window.navigate(navItem.dataset.page);
      // Close sidebar on mobile
      const sidebar = document.getElementById('sidebar');
      if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
      }
      return;
    }
    
    const mobNavItem = e.target.closest('.mobile-nav-item[data-page]');
    if (mobNavItem) {
      e.preventDefault();
      window.navigate(mobNavItem.dataset.page);
    }
  });

  // Mobile menu
  const mobBtn = document.getElementById('mobileMenuBtn');
  if (mobBtn) {
    mobBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });
  }

  // Logout
  const logBtn = document.getElementById('logoutBtn');
  if (logBtn) {
    logBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = 've/login.html';
    });
  }

  // ---- Dashboard Map ----
  function initDashboardMap() {
    if (map) return;
    map = L.map('realMap', {
      center: [10.6660, -71.6125],
      zoom: 12,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true
    });

    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add vehicle markers
    renderMapMarkers();

    // Map control buttons
    const fsBtn = document.getElementById('mapFullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const container = document.getElementById('mapContainer');
        if (!document.fullscreenElement) {
          if (container) container.requestFullscreen().catch(err => {
            showToast('Error al activar pantalla completa', 'error');
          });
        } else {
          document.exitFullscreen();
        }
      });
    }

    const zoomIn = document.getElementById('mapZoomIn');
    if (zoomIn) zoomIn.addEventListener('click', () => map.zoomIn());
    const zoomOut = document.getElementById('mapZoomOut');
    if (zoomOut) zoomOut.addEventListener('click', () => map.zoomOut());
    const mapCent = document.getElementById('mapCenter');
    if (mapCent) mapCent.addEventListener('click', () => {
      if (vehicleMarkers.length) {
        const group = new L.featureGroup(vehicleMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    });
    const mapSat = document.getElementById('mapSatellite');
    if (mapSat) mapSat.addEventListener('click', () => {
      map.removeLayer(tileLayer);
      if (!isSatellite) {
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri'
        }).addTo(map);
        mapSat.textContent = '🗺';
      } else {
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        mapSat.textContent = '🛰';
      }
      isSatellite = !isSatellite;
    });

    setTimeout(() => { if (map) map.invalidateSize(); }, 0);
  }

  function getStatusColor(status) {
    return { moving: '#2ed573', parked: '#FFA502', offline: '#FF4757' }[status] || '#94a3b8';
  }

  function createVehicleIcon(v) {
    const color = getStatusColor(v.status);
    const pulse = v.status === 'moving' ? `<circle cx="18" cy="18" r="16" fill="${color}" opacity="0.4"><animate attributeName="r" values="16;24;16" dur="1.5s" repeatCount="indefinite"/></circle>` : '';
    const rotation = v.course || 0;
    
    return L.divIcon({
      html: `<div style="transform: rotate(${rotation}deg); transition: transform 0.5s ease; width: 36px; height: 36px;">
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
          ${pulse}
          <path d="M12 8 C12 6, 14 4, 18 4 C22 4, 24 6, 24 8 L24 28 C24 30, 22 32, 18 32 C14 32, 12 30, 12 28 Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <path d="M13 11 C16 10, 20 10, 23 11 L22 15 L14 15 Z" fill="#1e293b" />
          <path d="M14 26 C17 27, 19 27, 22 26 L21 23 L15 23 Z" fill="#1e293b" />
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
      className: 'vehicle-car-marker'
    });
  }

  window.sendCommand = function(vehicleId, command) {
    const v = T.vehicles.find(x => x.id === vehicleId);
    if (!v) return;
    
    let msg = '';
    if (command === 'stop') msg = `¿Está seguro que desea APAGAR EL MOTOR de ${v.plate}?`;
    else if (command === 'start') msg = `¿Está seguro que desea RESTAURAR EL MOTOR de ${v.plate}?`;
    else msg = `¿Desea enviar comando CHECK a ${v.plate}?`;

    if (confirm(msg)) {
      showToast(`Comando ${command.toUpperCase()} enviado exitosamente a ${v.plate}`, 'success');
      
      // Real mutation of state for simulation
      if (command === 'stop') {
        v.status = 'parked';
        v.speed = 0;
        showToast(`🛑 Motor inhabilitado en ${v.plate}`, 'warning');
      } else if (command === 'start') {
        v.status = 'moving';
        showToast(`✔ Motor habilitado en ${v.plate}`, 'success');
      }
      
      if (map) renderMapMarkers();
      renderVehicleListPanel();
      updateStats();
    }
  };

  function renderMapMarkers() {
    vehicleMarkers.forEach(m => map.removeLayer(m));
    vehicleMarkers = [];
    T.vehicles.forEach(v => {
      // Mostrar en el mapa SOLO los vehículos que están reportando en vivo desde Traccar
      if (!v.hasRealData) return;

      const icon = createVehicleIcon(v);
      const client = T.getClient(v.clientId);
      const driver = (T.drivers || []).find(d => d.vehicleId === v.id);
      const driverName = driver ? driver.name : 'N/A';
      
      const popupHtml = `
      <div class="advanced-popup">
        <div class="ap-header">
          <div class="ap-title">
            <span>🚐</span> <strong>${v.desc || v.plate}</strong>
          </div>
          <div class="ap-buttons">
            <button class="ap-btn ap-btn-red" onclick="window.sendCommand(${v.id}, 'stop')">Apagar</button>
            <button class="ap-btn ap-btn-green" onclick="window.sendCommand(${v.id}, 'start')">Encender</button>
            <button class="ap-btn ap-btn-blue" onclick="window.sendCommand(${v.id}, 'check')">Check</button>
            <div class="ap-driver">👤 ${driverName}</div>
          </div>
        </div>
        
        <div class="ap-body">
          <div class="ap-col">
            <div class="ap-col-title">Vehículo / GPS / SIM</div>
            <div class="ap-row"><span class="ap-label">Placa</span><span class="ap-value">${v.plate}</span></div>
            <div class="ap-row"><span class="ap-label">Dispositivo GPS</span><span class="ap-value">Fabricante<br><strong>Meitrack</strong><br>Modelo<br><strong>T399L</strong></span></div>
            <div class="ap-row"><span class="ap-label">IMEI</span><span class="ap-value">${v.imei || 'N/A'}</span></div>
            <div class="ap-row"><span class="ap-label">Tarjeta SIM</span><span class="ap-value">Número de teléfono<br><strong>${v.sim || 'N/A'}</strong></span></div>
          </div>
          
          <div class="ap-col ap-col-border">
            <div class="ap-col-title">Información GPS</div>
            <div class="ap-row-flex"><span class="ap-icon">🕒</span><div><div class="ap-label">Última conexión</div><div class="ap-value">Hace un momento</div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">📍</span><div><div class="ap-label">Última ubicación</div><div class="ap-value">Actualizada</div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">🔑</span><div><div class="ap-label">Ignición</div><div class="ap-value">${v.status === 'moving' ? 'Encendido' : 'Apagado'}</div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">📟</span><div><div class="ap-label">Velocidad</div><div class="ap-value">${v.speed} km/h</div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">🛰️</span><div><div class="ap-label">Satélites</div><div class="ap-value">11</div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">🔋</span><div><div class="ap-label">Batería GPS</div><div class="ap-value">4.13 V</div></div></div>
          </div>
          
          <div class="ap-col ap-col-border ap-col-narrow">
            <div class="ap-col-title">Información adicional</div>
            <div class="ap-row-flex"><span class="ap-icon">🔌</span><div><div class="ap-value" style="font-size:11px;font-weight:400;color:var(--text-muted)">Relay<br><strong style="font-size:12px;color:var(--text)">Lock</strong></div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">🔋</span><div><div class="ap-value" style="font-size:11px;font-weight:400;color:var(--text-muted)">Batería Auto<br><strong style="font-size:12px;color:var(--text)">12.93 V</strong></div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">📡</span><div><div class="ap-value" style="font-size:11px;font-weight:400;color:var(--text-muted)">GPS<br><strong style="font-size:12px;color:var(--text)">GNSS normal</strong></div></div></div>
            <div class="ap-row-flex"><span class="ap-icon">⏲️</span><div><div class="ap-value" style="font-size:11px;font-weight:400;color:var(--text-muted)">Odómetro<br><strong style="font-size:12px;color:var(--text)">17783900 Km</strong></div></div></div>
          </div>
        </div>
        
        <div class="ap-footer">
          📍 ${v.address}
        </div>
      </div>
      `;

      const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
      marker.bindPopup(popupHtml, { className: 'trackjf-popup', maxWidth: 650, minWidth: 300 });
      vehicleMarkers.push(marker);
    });
  }

  // ---- Vehicle List Panel ----
  function renderVehicleListPanel() {
    const container = document.getElementById('vehicleListPanel');
    if (!container) return;
    container.innerHTML = '';
    T.vehicles.forEach(v => {
      const div = document.createElement('div');
      div.className = 'vehicle-item';
      div.innerHTML = `
        <div class="vehicle-status-dot ${v.status}"></div>
        <div class="vehicle-details">
          <div class="vehicle-name">${v.plate} · ${v.desc}</div>
          <div class="vehicle-info">📍 ${v.address.length > 30 ? v.address.slice(0,30)+'…' : v.address}</div>
        </div>
        <div class="vehicle-speed">${v.speed} <span style="font-size:10px;font-weight:400;color:var(--text-muted)">km/h</span></div>
      `;
      div.addEventListener('click', () => {
        if (map) {
          map.setView([v.lat, v.lng], 15);
          vehicleMarkers.forEach((m, i) => { if (T.vehicles[i].id === v.id) m.openPopup(); });
        }
      });
      container.appendChild(div);
    });
  }

  // ---- Activity Feed ----
  function renderActivityFeed() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    const events = T.events.slice(0, 6);
    const icons = { ignition_on: '🟢', ignition_off: '🔴', speed: '⚡', geofence_in: '📍', geofence_out: '📍', panic: '🚨', disconnect: '📵' };
    const colors = { ignition_on: '#2ed573', ignition_off: '#FF4757', speed: '#FFA502', geofence_in: '#00C9FF', geofence_out: '#FFA502', panic: '#FF4757', disconnect: '#FF4757' };
    feed.innerHTML = events.map(ev => {
      const v = T.getVehicle(ev.vehicleId);
      return `
        <div class="activity-item">
          <div class="activity-dot" style="background:${colors[ev.type] || '#94a3b8'};box-shadow:0 0 6px ${colors[ev.type] || '#94a3b8'};"></div>
          <div class="activity-content">
            <div class="activity-text">${icons[ev.type] || '●'} <strong>${v ? v.plate : 'N/A'}</strong> — ${ev.desc}</div>
            <div class="activity-time">${ev.datetime}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---- Event Chart ----
  function renderEventChart() {
    const chart = document.getElementById('eventChart');
    if (!chart) return;
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const data = [12, 8, 15, 10, 18, 6, 4];
    const max = Math.max(...data);
    chart.innerHTML = days.map((d, i) => `
      <div class="chart-bar-wrapper">
        <div class="chart-bar" style="height:${(data[i]/max)*100}px;" title="${data[i]} eventos"></div>
        <div class="chart-bar-label">${d}</div>
      </div>
    `).join('');
  }

  // ---- Vehicles Table ----
  function renderVehiclesTable(filter = '') {
    const tbody = document.getElementById('vehiclesTbody');
    if (!tbody) return;
    let vehicles = T.vehicles;
    const statusFilter = document.getElementById('vehicleStatusFilter')?.value || '';
    const clientFilter = document.getElementById('vehicleClientFilter')?.value || '';
    if (filter) vehicles = vehicles.filter(v => v.plate.toLowerCase().includes(filter.toLowerCase()) || v.desc.toLowerCase().includes(filter.toLowerCase()));
    if (statusFilter) vehicles = vehicles.filter(v => v.status === statusFilter);
    if (clientFilter) vehicles = vehicles.filter(v => v.clientId == clientFilter);

    const statusLabel = { moving: ['🟢', 'En Movimiento', 'moving'], parked: ['🟡', 'Estacionado', 'parked'], offline: ['🔴', 'Sin Señal', 'offline'] };
    tbody.innerHTML = vehicles.map(v => {
      const client = T.getClient(v.clientId);
      const device = T.devices.find(d => d.vehicleId === v.id);
      const [icon, label, cls] = statusLabel[v.status] || ['⚫', 'Desconocido', ''];
      return `<tr data-id="${v.id}">
        <td><strong style="color:var(--accent)">${v.plate}</strong></td>
        <td>${v.desc}</td>
        <td>${client ? client.name : '—'}</td>
        <td style="font-size:11px;color:var(--text-muted)">${device ? device.imei.slice(-6) : 'Sin GPS'}</td>
        <td><span class="status-badge ${cls}">${icon} ${label}</span></td>
        <td><strong style="color:${cls==='moving'?'var(--success)':cls==='parked'?'var(--warning)':'var(--danger)'}">${v.speed} km/h</strong></td>
        <td style="font-size:12px;color:var(--text-muted)">${v.address.slice(0,25)}…</td>
        <td style="font-size:11px;color:var(--text-muted)">${v.lastSignal}</td>
        <td>
          <div class="action-btns">
            <button class="icon-btn" title="Ver en mapa" onclick="focusVehicle(${v.id})">🗺️</button>
            <button class="icon-btn" title="Editar" onclick="editVehicle(${v.id})">✏️</button>
            <button class="icon-btn danger" title="Eliminar" onclick="deleteVehicle(${v.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Populate client filter
    const cf = document.getElementById('vehicleClientFilter');
    if (cf && cf.options.length <= 1) {
      T.clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        cf.appendChild(opt);
      });
    }
  }

  // ---- Alerts Table ----
  function renderAlertsTable() {
    const tbody = document.getElementById('alertsTbody');
    if (!tbody) return;
    const typeFilter = document.getElementById('alertTypeFilter')?.value || '';
    let alerts = T.alerts;
    if (typeFilter) alerts = alerts.filter(a => a.type === typeFilter);
    const typeInfo = {
      panic: ['🚨', 'Pánico', 'offline'],
      speed: ['⚡', 'Velocidad', 'parked'],
      geofence: ['📐', 'Geocerca', 'moving'],
      disconnect: ['📵', 'Desconexión', 'offline'],
      battery: ['🔋', 'Batería Baja', 'parked'],
    };
    tbody.innerHTML = alerts.map(a => {
      const v = T.getVehicle(a.vehicleId);
      const [ico, label, cls] = typeInfo[a.type] || ['●', a.type, ''];
      const statusBadge = a.status === 'active' 
        ? '<span class="status-badge offline">● Activa</span>' 
        : '<span class="status-badge active">✔ Resuelta</span>';
      return `<tr>
        <td><span class="status-badge ${a.type === 'panic' ? 'offline' : a.type === 'speed' ? 'parked' : 'moving'}">${ico} ${label}</span></td>
        <td><strong>${v ? v.plate : 'N/A'}</strong><br><span style="font-size:11px;color:var(--text-muted)">${v ? v.desc : ''}</span></td>
        <td>${a.desc}</td>
        <td style="font-size:12px;color:var(--text-muted)">${a.datetime}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-btns">
            <button class="icon-btn" title="Ver en mapa">🗺️</button>
            <button class="icon-btn" title="Marcar resuelta" onclick="resolveAlert(${a.id})">✔</button>
          </div>
        </td>
      </tr>`;
    }).join('');
    const badgeAlerts = document.getElementById('badge-alerts');
    if (badgeAlerts) badgeAlerts.textContent = T.alerts.filter(a => a.status === 'active').length;
  }

  // ---- Clients Table ----
  function renderClientsTable(filter = '') {
    const tbody = document.getElementById('clientsTbody');
    if (!tbody) return;
    let clients = T.clients;
    if (filter) clients = clients.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.rif.toLowerCase().includes(filter.toLowerCase()));
    const statusFilter = document.getElementById('clientStatusFilter')?.value || '';
    if (statusFilter) clients = clients.filter(c => c.status === statusFilter);
    tbody.innerHTML = clients.map(c => `<tr data-id="${c.id}">
      <td style="color:var(--text-muted);font-size:12px">#${c.id}</td>
      <td><strong>${c.name}</strong></td>
      <td style="font-size:12px">${c.rif}</td>
      <td style="font-size:12px">${c.phone}</td>
      <td style="font-size:12px">${c.email}</td>
      <td><span style="background:rgba(0,201,255,0.15);color:var(--accent);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${c.vehicles} 🚗</span></td>
      <td><span class="status-badge ${c.status === 'active' ? 'active' : 'offline'}">${c.status === 'active' ? '● Activo' : '● Inactivo'}</span></td>
      <td>
        <div class="action-btns">
          <button class="icon-btn" title="Ver vehículos">🚗</button>
          <button class="icon-btn" title="Editar" onclick="editClient(${c.id})">✏️</button>
          <button class="icon-btn danger" title="Eliminar" onclick="deleteClient(${c.id})">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
  }

  // ---- Devices Table ----
  function renderDevicesTable() {
    const tbody = document.getElementById('devicesTbody');
    if (!tbody) return;
    tbody.innerHTML = T.devices.map(d => {
      const v = T.getVehicle(d.vehicleId);
      const battColor = d.battery > 50 ? '#2ed573' : d.battery > 20 ? '#FFA502' : '#FF4757';
      return `<tr>
        <td style="font-size:11px;color:var(--text-muted)">${d.imei}</td>
        <td><strong>${d.model}</strong></td>
        <td style="font-size:12px">${d.sim}</td>
        <td style="font-size:12px;">${d.carrier}</td>
        <td>${v ? `<strong style="color:var(--accent)">${v.plate}</strong><br><span style="font-size:11px;color:var(--text-muted)">${v.desc}</span>` : '<span style="color:var(--text-muted)">Sin asignar</span>'}</td>
        <td style="font-size:11px;color:var(--text-muted)">${d.lastSignal}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${d.battery}%;background:${battColor};border-radius:3px;"></div>
            </div>
            <span style="font-size:11px;color:${battColor};font-weight:700;">${d.battery}%</span>
          </div>
        </td>
        <td><span class="status-badge active">● Activo</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn" title="Comandos">📡</button>
            <button class="icon-btn" title="Editar">✏️</button>
            <button class="icon-btn danger" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Drivers Table ----
  function renderDriversTable() {
    const tbody = document.getElementById('driversTbody');
    if (!tbody) return;
    tbody.innerHTML = T.drivers.map(d => {
      const v = T.getVehicle(d.vehicleId);
      const licExpDate = new Date(d.licExp);
      const today = new Date();
      const daysLeft = Math.floor((licExpDate - today) / (1000*60*60*24));
      const licStatus = daysLeft < 30 ? 'parked' : 'active';
      return `<tr>
        <td><strong>${d.name}</strong></td>
        <td style="font-size:12px">${d.cedula}</td>
        <td>
          <div>${d.license}</div>
          <span class="status-badge ${licStatus}" style="font-size:10px;padding:1px 7px;">${daysLeft < 0 ? '⚠ Vencida' : daysLeft < 30 ? `⚠ Vence en ${daysLeft}d` : '✔ Vigente'}</span>
        </td>
        <td style="font-size:12px">${d.phone}</td>
        <td>${v ? `<strong style="color:var(--accent)">${v.plate}</strong><br><span style="font-size:11px;color:var(--text-muted)">${v.desc}</span>` : '<span style="color:var(--text-muted)">Sin asignar</span>'}</td>
        <td><span class="status-badge active">● Activo</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn" title="Ver historial">📊</button>
            <button class="icon-btn" title="Editar">✏️</button>
            <button class="icon-btn danger" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Events Table ----
  function renderEventsTable() {
    const tbody = document.getElementById('eventsTbody');
    if (!tbody) return;
    const icons = { ignition_on: '🟢 Motor ON', ignition_off: '🔴 Motor OFF', speed: '⚡ Velocidad', geofence_in: '📍 Entrada Geocerca', geofence_out: '📍 Salida Geocerca', panic: '🚨 Pánico', disconnect: '📵 Desconexión' };
    tbody.innerHTML = T.events.map(e => {
      const v = T.getVehicle(e.vehicleId);
      const d = T.getDriver(e.driverId);
      return `<tr>
        <td><span class="status-badge ${e.type.includes('on')||e.type.includes('in') ? 'active' : e.type.includes('speed')||e.type.includes('panic') ? 'parked' : 'offline'}" style="font-size:11px">${icons[e.type] || e.type}</span></td>
        <td><strong>${v ? v.plate : 'N/A'}</strong></td>
        <td style="font-size:12px">${d ? d.name : '—'}</td>
        <td style="font-size:12px">${e.desc}</td>
        <td style="font-size:11px;color:var(--text-muted)">${e.location}</td>
        <td><strong style="color:var(--accent)">${e.speed} km/h</strong></td>
        <td style="font-size:11px;color:var(--text-muted)">${e.datetime}</td>
      </tr>`;
    }).join('');
  }

  // ---- Users Table ----
  function renderUsersTable() {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;
    const roleLabel = { admin: '🛡 Admin', operator: '⚙ Operador', viewer: '👁 Lectura', client: '👥 Cliente' };
    tbody.innerHTML = T.users.map(u => {
      const client = T.getClient(u.clientId);
      return `<tr>
        <td><strong style="color:var(--accent)">${u.username}</strong></td>
        <td>${u.name}</td>
        <td style="font-size:12px">${u.email}</td>
        <td><span class="status-badge ${u.role==='admin'?'offline':u.role==='operator'?'moving':'active'}" style="font-size:11px">${roleLabel[u.role]||u.role}</span></td>
        <td style="font-size:12px">${client ? client.name : '—'}</td>
        <td style="font-size:11px;color:var(--text-muted)">${u.lastLogin}</td>
        <td><span class="status-badge ${u.status==='active'?'active':'offline'}">${u.status==='active'?'● Activo':'● Inactivo'}</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn" title="Editar">✏️</button>
            <button class="icon-btn danger" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Geofence List ----
  function renderGeofenceList() {
    const container = document.getElementById('geofenceList');
    if (!container) return;
    container.innerHTML = T.geofences.map(g => `
      <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;gap:12px;">
        <div style="width:14px;height:14px;border-radius:50%;background:${g.colorHex};box-shadow:0 0 8px ${g.colorHex};flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;color:#fff">${g.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${g.type} · Radio: ${g.radius}m</div>
          <div style="font-size:11px;color:var(--text-muted);">
            ${g.alertEnter ? '📍 Alerta entrada' : ''} ${g.alertExit ? '📍 Alerta salida' : ''}
          </div>
        </div>
        <div class="action-btns">
          <button class="icon-btn" title="Editar">✏️</button>
          <button class="icon-btn danger" title="Eliminar" onclick="deleteGeofence(${g.id})">🗑️</button>
        </div>
      </div>
    `).join('');

    // Draw geofences on map after rendering
    if (geofenceMap) drawGeofencesOnMap();
  }

  // ---- History Playback Logic ----
  let playbackIndex = 0;
  let playbackTimer = null;
  let playbackMarker = null;
  let playbackPoints = [];
  let playbackSpeed = 300; // ms per point

  function resetPlayback() {
    if (playbackTimer) clearInterval(playbackTimer);
    playbackTimer = null;
    playbackIndex = 0;
    if (playbackMarker && historyMap) historyMap.removeLayer(playbackMarker);
    playbackMarker = null;
  }

  function startPlayback() {
    if (!playbackPoints.length) {
      showToast('Carga un recorrido primero', 'warning');
      return;
    }
    if (playbackTimer) return;

    playbackTimer = setInterval(updatePlaybackFrame, playbackSpeed);
    showToast('Iniciando reproducción...', 'info');
  }

  function pausePlayback() {
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      showToast('Reproducción pausada', 'info');
    }
  }

  function updatePlaybackFrame() {
    if (playbackIndex >= playbackPoints.length) {
      resetPlayback();
      showToast('Final del recorrido alcanzado', 'success');
      return;
    }

    const point = playbackPoints[playbackIndex];
    const latlng = [point[0], point[1]];

    if (!playbackMarker) {
      playbackMarker = L.marker(latlng, {
        icon: L.divIcon({
          html: `<div style="background:var(--accent);width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:var(--glow);"></div>`,
          iconSize: [16, 16],
          className: ''
        })
      }).addTo(historyMap);
    } else {
      playbackMarker.setLatLng(latlng);
    }

    historyMap.panTo(latlng);
    
    // Highlight list item
    const items = document.querySelectorAll('#historyPoints > div');
    items.forEach(el => el.style.background = '');
    if (items[playbackIndex]) {
      items[playbackIndex].style.background = 'rgba(0,201,255,0.1)';
      items[playbackIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    playbackIndex++;
  }

  // ---- History Map ----
  function initHistoryMap() {
    if (historyMap) return;
    historyMap = L.map('historyMap', {
      center: [10.6660, -71.6125],
      zoom: 12,
      zoomControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(historyMap);
    setTimeout(() => { if (historyMap) historyMap.invalidateSize(); }, 0);
  }

  // ---- Geofence Map ----
  function initGeofenceMap() {
    if (geofenceMap) return;
    geofenceMap = L.map('geofenceMap', {
      center: [10.6660, -71.6125],
      zoom: 12,
      zoomControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(geofenceMap);
    geofenceLayerGroup = L.layerGroup().addTo(geofenceMap);
    drawGeofencesOnMap();

    // Click to add geofence center
    geofenceMap.on('click', e => {
      pickedLatLng = e.latlng;
      showToast(`📍 Ubicación capturada: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`, 'info');
    });
    setTimeout(() => { if (geofenceMap) geofenceMap.invalidateSize(); }, 0);
  }

  function drawGeofencesOnMap() {
    if (!geofenceLayerGroup) return;
    geofenceLayerGroup.clearLayers();
    T.geofences.forEach(g => {
      L.circle([g.lat, g.lng], {
        radius: g.radius,
        color: g.colorHex,
        fillColor: g.colorHex,
        fillOpacity: 0.1,
        weight: 2
      }).bindPopup(`<strong>${g.name}</strong><br>${g.type} · ${g.radius}m`).addTo(geofenceLayerGroup);
    });
  }



  // ---- Load History ----
  function populateHistoryVehicle() {
    const sel = document.getElementById('historyVehicle');
    if (sel && sel.options.length <= 1) {
      T.vehicles.forEach(v => {
        const o = document.createElement('option');
        o.value = v.id; o.textContent = `${v.plate} - ${v.desc}`;
        sel.appendChild(o);
      });
    }
  }

  document.getElementById('loadHistoryBtn').addEventListener('click', () => {
    const vId = parseInt(document.getElementById('historyVehicle').value);
    const v = T.getVehicle(vId);
    if (!historyMap) return;

    resetPlayback();

    // Generate mock route points
    const points = T.historyData[vId] ? T.historyData[vId].map(p => [p.lat, p.lng]) : [];
    if (points.length === 0) {
      const lat = v.lat;
      const lng = v.lng;
      for (let i = 0; i < 25; i++) {
        points.push([lat + (Math.random()-0.5)*0.03, lng + (Math.random()-0.5)*0.03]);
      }
      points.push([lat, lng]);
    }
    
    playbackPoints = points;

    if (historyPolyline) historyMap.removeLayer(historyPolyline);
    historyPolyline = L.polyline(points, { color: '#00C9FF', weight: 4, opacity: 0.8 }).addTo(historyMap);
    historyMap.fitBounds(historyPolyline.getBounds().pad(0.1));

    // Add markers for events or stops
    points.forEach((p, i) => {
       if (i === 0) {
         L.marker(p, { icon: L.divIcon({ html: '<div style="background:#2ed573;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>', iconSize:[12,12], className:'' }) }).addTo(historyMap);
       } else if (i === points.length - 1) {
         L.marker(p, { icon: createVehicleIcon(v) }).addTo(historyMap);
       } else if (Math.random() > 0.8) {
         L.marker(p, { icon: L.divIcon({ html: '🅿️', iconSize:[16,16], className:'' }) }).bindPopup('Parada detectada: 15 min').addTo(historyMap);
       }
    });

    // Render points list
    const list = document.getElementById('historyPoints');
    list.innerHTML = points.map((p, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;" onclick="setPlaybackIndex(${i})">
        <div style="width:10px;height:10px;border-radius:50%;background:${i===0?'#2ed573':i===points.length-1?'#FF4757':'#00C9FF'};"></div>
        <div style="flex:1">
          <div style="font-size:12px;color:var(--text)">${i === 0 ? 'Punto de Salida' : i === points.length-1 ? 'Ubicación Final' : 'Punto Registrado'}</div>
          <div style="font-size:10px;color:var(--text-muted)">${new Date(Date.now() - (points.length - i)*600000).toLocaleTimeString()} · ${p[0].toFixed(5)}, ${p[1].toFixed(5)}</div>
        </div>
      </div>
    `).join('');

    showToast(`✔ Historial cargado con ${points.length} puntos de rastreo`, 'success');
  });

  window.setPlaybackIndex = (i) => {
    playbackIndex = i;
    updatePlaybackFrame();
  };

  // Playback controls
  document.getElementById('playBtn').addEventListener('click', startPlayback);
  document.getElementById('pauseBtn').addEventListener('click', pausePlayback);
  document.getElementById('stopBtn').addEventListener('click', () => {
    resetPlayback();
    showToast('Reproducción reiniciada', 'info');
  });

  document.getElementById('speedSlider').addEventListener('input', e => {
    const val = parseInt(e.target.value);
    document.getElementById('speedVal').textContent = val + 'x';
    playbackSpeed = Math.max(50, 1000 / val);
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = setInterval(updatePlaybackFrame, playbackSpeed);
    }
  });

  // ---- Modal Logic ----
  function openModal(id) {
    document.getElementById(id).classList.add('show');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    editingId = null;
  }

  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal || btn.closest('.modal-overlay').id;
      if (modalId) closeModal(modalId);
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ---- CRUD: Vehicles ----
  document.getElementById('addVehicleBtn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('vehicleModalTitle').textContent = '➕ Agregar Vehículo';
    document.getElementById('vehicleForm').reset();
    populateVehicleModalSelects();
    openModal('vehicleModal');
  });

  function populateVehicleModalSelects() {
    const clientSel = document.getElementById('vf-client');
    clientSel.innerHTML = '<option value="">Seleccionar cliente...</option>';
    T.clients.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name; clientSel.appendChild(o);
    });
    const deviceSel = document.getElementById('vf-device');
    deviceSel.innerHTML = '<option value="">Sin dispositivo</option>';
    T.devices.filter(d => !T.vehicles.some(v => v.deviceId === d.id) || (editingId && T.getVehicle(editingId)?.deviceId === d.id)).forEach(d => {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = `${d.model} - ${d.imei.slice(-6)}`; deviceSel.appendChild(o);
    });
    const driverSel = document.getElementById('vf-driver');
    driverSel.innerHTML = '<option value="">Sin asignar</option>';
    T.drivers.forEach(d => {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = d.name; driverSel.appendChild(o);
    });
  }

  document.getElementById('saveVehicleBtn').addEventListener('click', () => {
    const plate = document.getElementById('vf-plate').value.trim();
    const desc = document.getElementById('vf-desc').value.trim() || plate;
    if (!plate) { showToast('La placa es requerida', 'error'); return; }
    const newV = {
      id: editingId || (Math.max(...T.vehicles.map(v=>v.id)) + 1),
      plate, desc,
      brand: document.getElementById('vf-brand').value,
      model: document.getElementById('vf-model').value,
      year: parseInt(document.getElementById('vf-year').value) || new Date().getFullYear(),
      color: document.getElementById('vf-color').value,
      clientId: parseInt(document.getElementById('vf-client').value) || null,
      deviceId: parseInt(document.getElementById('vf-device').value) || null,
      driverId: parseInt(document.getElementById('vf-driver').value) || null,
      maxSpeed: parseInt(document.getElementById('vf-maxspeed').value) || 120,
      status: 'offline', speed: 0,
      lat: 10.6660 + (Math.random()-0.5)*0.05,
      lng: -71.6125 + (Math.random()-0.5)*0.05,
      address: 'Ubicación pendiente',
      lastSignal: '—', odometer: 0
    };
    if (editingId) {
      const idx = T.vehicles.findIndex(v => v.id === editingId);
      if (idx >= 0) T.vehicles[idx] = { ...T.vehicles[idx], ...newV };
      showToast('✔ Vehículo actualizado', 'success');
    } else {
      T.vehicles.push(newV);
      showToast('✔ Vehículo agregado exitosamente', 'success');
    }
    closeModal('vehicleModal');
    renderVehiclesTable();
    updateStats();
    const bVeh = document.getElementById('badge-vehicles');
    if (bVeh) bVeh.textContent = T.vehicles.length;
  });

  window.editVehicle = id => {
    editingId = id;
    const v = T.getVehicle(id);
    document.getElementById('vehicleModalTitle').textContent = '✏️ Editar Vehículo';
    populateVehicleModalSelects();
    document.getElementById('vf-plate').value = v.plate;
    document.getElementById('vf-desc').value = v.desc;
    document.getElementById('vf-brand').value = v.brand;
    document.getElementById('vf-model').value = v.model;
    document.getElementById('vf-year').value = v.year;
    document.getElementById('vf-color').value = v.color;
    document.getElementById('vf-client').value = v.clientId || '';
    document.getElementById('vf-device').value = v.deviceId || '';
    document.getElementById('vf-driver').value = v.driverId || '';
    document.getElementById('vf-maxspeed').value = v.maxSpeed;
    openModal('vehicleModal');
  };

  window.deleteVehicle = id => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    const idx = T.vehicles.findIndex(v => v.id === id);
    if (idx >= 0) T.vehicles.splice(idx, 1);
    renderVehiclesTable();
    updateStats();
    showToast('Vehículo eliminado', 'warning');
  };

  window.focusVehicle = id => {
    navigate('dashboard');
    setTimeout(() => {
      const v = T.getVehicle(id);
      if (map && v) map.setView([v.lat, v.lng], 15);
    }, 200);
  };

  // ---- CRUD: Clients ----
  document.getElementById('addClientBtn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('clientModalTitle').textContent = '➕ Agregar Cliente';
    document.getElementById('clientForm').reset();
    openModal('clientModal');
  });

  document.getElementById('saveClientBtn').addEventListener('click', () => {
    const name = document.getElementById('cf-name').value.trim();
    if (!name) { showToast('El nombre es requerido', 'error'); return; }
    const newC = {
      id: editingId || (Math.max(...T.clients.map(c=>c.id)) + 1),
      name,
      rif: document.getElementById('cf-rif').value,
      phone: document.getElementById('cf-phone').value,
      email: document.getElementById('cf-email').value,
      address: document.getElementById('cf-address').value,
      state: document.getElementById('cf-state').value,
      country: document.getElementById('cf-country').value,
      status: 'active',
      vehicles: 0
    };
    if (editingId) {
      const idx = T.clients.findIndex(c => c.id === editingId);
      if (idx >= 0) T.clients[idx] = { ...T.clients[idx], ...newC };
      showToast('✔ Cliente actualizado', 'success');
    } else {
      T.clients.push(newC);
      showToast('✔ Cliente agregado', 'success');
    }
    closeModal('clientModal');
    renderClientsTable();
  });

  window.editClient = id => {
    editingId = id;
    const c = T.getClient(id);
    document.getElementById('clientModalTitle').textContent = '✏️ Editar Cliente';
    document.getElementById('cf-name').value = c.name;
    document.getElementById('cf-rif').value = c.rif;
    document.getElementById('cf-phone').value = c.phone;
    document.getElementById('cf-email').value = c.email;
    document.getElementById('cf-address').value = c.address;
    document.getElementById('cf-state').value = c.state;
    document.getElementById('cf-country').value = c.country;
    openModal('clientModal');
  };

  window.deleteClient = id => {
    if (!confirm('¿Eliminar este cliente?')) return;
    const idx = T.clients.findIndex(c => c.id === id);
    if (idx >= 0) T.clients.splice(idx, 1);
    renderClientsTable();
    showToast('Cliente eliminado', 'warning');
  };

  // ---- CRUD: Devices ----
  document.getElementById('addDeviceBtn').addEventListener('click', () => {
    document.getElementById('deviceForm').reset();
    openModal('deviceModal');
  });

  document.getElementById('saveDeviceBtn').addEventListener('click', () => {
    const imei = document.getElementById('df-imei').value.trim();
    if (!imei) { showToast('El IMEI es requerido', 'error'); return; }
    const newD = {
      id: editingId || (Math.max(...T.devices.map(d=>d.id)) + 1),
      imei, model: document.getElementById('df-model').value,
      sim: document.getElementById('df-sim').value,
      carrier: document.getElementById('df-carrier').value,
      vehicleId: editingId ? T.devices.find(d=>d.id===editingId).vehicleId : null,
      lastSignal: '—', battery: 100, status: 'active'
    };
    if (editingId) {
       const idx = T.devices.findIndex(d => d.id === editingId);
       if (idx >= 0) T.devices[idx] = { ...T.devices[idx], ...newD };
       showToast('✔ Dispositivo actualizado', 'success');
    } else {
       T.devices.push(newD);
       showToast('✔ Dispositivo registrado', 'success');
    }
    closeModal('deviceModal');
    renderDevicesTable();
  });

  window.editDevice = id => {
    editingId = id;
    const d = T.devices.find(x => x.id === id);
    document.getElementById('df-imei').value = d.imei;
    document.getElementById('df-model').value = d.model;
    document.getElementById('df-sim').value = d.sim;
    document.getElementById('df-carrier').value = d.carrier;
    openModal('deviceModal');
  };

  window.deleteDevice = id => {
    if (!confirm('¿Eliminar este dispositivo?')) return;
    const idx = T.devices.findIndex(d => d.id === id);
    if (idx >= 0) T.devices.splice(idx, 1);
    renderDevicesTable();
    showToast('Dispositivo eliminado', 'warning');
  };

  // ---- CRUD: Drivers ----
  document.getElementById('addDriverBtn').addEventListener('click', () => {
    document.getElementById('driverForm').reset();
    const vSel = document.getElementById('drv-vehicle');
    vSel.innerHTML = '<option value="">Sin asignar</option>';
    T.vehicles.forEach(v => {
      const o = document.createElement('option');
      o.value = v.id; o.textContent = v.plate + ' - ' + v.desc; vSel.appendChild(o);
    });
    openModal('driverModal');
  });

  document.getElementById('saveDriverBtn').addEventListener('click', () => {
    const name = document.getElementById('drv-name').value.trim();
    if (!name) { showToast('El nombre es requerido', 'error'); return; }
    const newD = {
      id: editingId || (Math.max(...T.drivers.map(d=>d.id)) + 1),
      name, cedula: document.getElementById('drv-cedula').value,
      license: document.getElementById('drv-license').value,
      licExp: document.getElementById('drv-licexp').value,
      phone: document.getElementById('drv-phone').value,
      vehicleId: parseInt(document.getElementById('drv-vehicle').value) || null,
      status: 'active'
    };
    if (editingId) {
       const idx = T.drivers.findIndex(d => d.id === editingId);
       if (idx >= 0) T.drivers[idx] = { ...T.drivers[idx], ...newD };
       showToast('✔ Conductor actualizado', 'success');
    } else {
       T.drivers.push(newD);
       showToast('✔ Conductor registrado', 'success');
    }
    closeModal('driverModal');
    renderDriversTable();
  });

  window.editDriver = id => {
    editingId = id;
    const d = T.getDriver(id);
    document.getElementById('drv-name').value = d.name;
    document.getElementById('drv-cedula').value = d.cedula;
    document.getElementById('drv-license').value = d.license;
    document.getElementById('drv-licexp').value = d.licExp;
    document.getElementById('drv-phone').value = d.phone;
    document.getElementById('drv-vehicle').value = d.vehicleId || '';
    openModal('driverModal');
  };

  window.deleteDriver = id => {
    if (!confirm('¿Eliminar este conductor?')) return;
    const idx = T.drivers.findIndex(d => d.id === id);
    if (idx >= 0) T.drivers.splice(idx, 1);
    renderDriversTable();
    showToast('Conductor eliminado', 'warning');
  };

  // ---- CRUD: Users ----
  document.getElementById('addUserBtn').addEventListener('click', () => {
    document.getElementById('userForm').reset();
    const sel = document.getElementById('uf-client');
    sel.innerHTML = '<option value="">Sin cliente específico</option>';
    T.clients.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name; sel.appendChild(o);
    });
    openModal('userModal');
  });

  document.getElementById('saveUserBtn').addEventListener('click', () => {
    const username = document.getElementById('uf-username').value.trim();
    if (!username) { showToast('Usuario requerido', 'error'); return; }
    const newU = {
      id: editingId || (Math.max(...T.users.map(u=>u.id)) + 1),
      username, name: document.getElementById('uf-name').value,
      email: document.getElementById('uf-email').value,
      role: document.getElementById('uf-role').value,
      clientId: parseInt(document.getElementById('uf-client').value) || null,
      lastLogin: '—', status: 'active'
    };
    if (editingId) {
       const idx = T.users.findIndex(u => u.id === editingId);
       if (idx >= 0) T.users[idx] = { ...T.users[idx], ...newU };
       showToast('✔ Usuario actualizado', 'success');
    } else {
       T.users.push(newU);
       showToast('✔ Usuario creado', 'success');
    }
    closeModal('userModal');
    renderUsersTable();
  });

  window.editUser = id => {
    editingId = id;
    const u = T.users.find(x => x.id === id);
    document.getElementById('uf-username').value = u.username;
    document.getElementById('uf-name').value = u.name;
    document.getElementById('uf-email').value = u.email;
    document.getElementById('uf-role').value = u.role;
    document.getElementById('uf-client').value = u.clientId || '';
    openModal('userModal');
  };

  window.deleteUser = id => {
    if (!confirm('¿Eliminar este usuario?')) return;
    const idx = T.users.findIndex(u => u.id === id);
    if (idx >= 0) T.users.splice(idx, 1);
    renderUsersTable();
    showToast('Usuario eliminado', 'warning');
  };

  // ---- Alerts actions ----
  window.resolveAlert = id => {
    const a = T.alerts.find(a => a.id === id);
    if (a) a.status = 'resolved';
    renderAlertsTable();
    showToast('✔ Alerta marcada como resuelta', 'success');
  };

  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    T.alerts.forEach(a => a.status = 'resolved');
    renderAlertsTable();
    showToast('✔ Todas las alertas resueltas', 'success');
  });

  document.getElementById('alertTypeFilter')?.addEventListener('change', renderAlertsTable);

  // ---- Geofences ----
  document.getElementById('addGeofenceBtn').addEventListener('click', () => {
    document.getElementById('geofenceForm').reset();
    openModal('geofenceModal');
    showToast('📍 Haz clic en el mapa para ubicar la geocerca', 'info');
  });

  document.getElementById('saveGeofenceBtn').addEventListener('click', () => {
    const name = document.getElementById('gf-name').value.trim();
    if (!name) { showToast('Nombre requerido', 'error'); return; }
    
    // Use picked coordinates if available, else use a random nearby point
    const lat = pickedLatLng ? pickedLatLng.lat : (10.6660 + (Math.random()-0.5)*0.05);
    const lng = pickedLatLng ? pickedLatLng.lng : (-71.6125 + (Math.random()-0.5)*0.05);

    const newG = {
      id: Math.max(...T.geofences.map(g=>g.id)) + 1,
      name, type: document.getElementById('gf-type').value,
      lat: lat,
      lng: lng,
      radius: parseInt(document.getElementById('gf-radius').value) || 500,
      colorHex: document.getElementById('gf-color').value,
      alertEnter: document.getElementById('gf-enter').value === 'Sí',
      alertExit: document.getElementById('gf-exit').value === 'Sí',
    };
    T.geofences.push(newG);
    pickedLatLng = null; // reset
    closeModal('geofenceModal');
    renderGeofenceList();
    if (geofenceMap) drawGeofencesOnMap();
    showToast('✔ Geocerca creada en la ubicación seleccionada', 'success');
  });

  window.deleteGeofence = id => {
    if (!confirm('¿Eliminar esta geocerca?')) return;
    const idx = T.geofences.findIndex(g => g.id === id);
    if (idx >= 0) T.geofences.splice(idx, 1);
    renderGeofenceList();
    if (geofenceMap) drawGeofencesOnMap();
    showToast('Geocerca eliminada', 'warning');
  };

  // ---- Reports ----
  let selectedReportType = 'route';

  document.querySelectorAll('.report-card[data-report]').forEach(card => {
    card.addEventListener('click', () => {
      selectedReportType = card.dataset.report;
      document.querySelectorAll('.report-card').forEach(c => c.style.borderColor = '');
      card.style.borderColor = 'var(--accent)';
      const reportCard = document.getElementById('reportGeneratorCard');
      document.getElementById('reportGenTitle').textContent = card.querySelector('h4').textContent;
      reportCard.style.display = 'block';
      reportCard.scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.getElementById('closeReportGen').addEventListener('click', () => {
    document.getElementById('reportGeneratorCard').style.display = 'none';
    document.getElementById('reportResultCard').style.display = 'none';
  });

  function populateReportVehicle() {
    const sel = document.getElementById('reportVehicle');
    if (sel && sel.options.length <= 1) {
      T.vehicles.forEach(v => {
        const o = document.createElement('option');
        o.value = v.id; o.textContent = `${v.plate} - ${v.desc}`;
        sel.appendChild(o);
      });
    }
  }

  document.getElementById('generateReportBtn').addEventListener('click', () => {
    const resultCard = document.getElementById('reportResultCard');
    const head = document.getElementById('reportTableHead');
    const body = document.getElementById('reportTableBody');
    const vehicleId = document.getElementById('reportVehicle').value;
    const vehicles = vehicleId === 'all' ? T.vehicles : T.vehicles.filter(v => v.id == vehicleId);
    
    let htmlHead = '';
    let htmlBody = '';

    if (selectedReportType === 'speed') {
      htmlHead = '<tr><th>Vehículo</th><th>Placa</th><th>Fecha/Hora</th><th>Velocidad Detectada</th><th>Límite Excedido</th><th>Ubicación</th></tr>';
      htmlBody = vehicles.flatMap(v => [1, 2].map(() => `<tr>
        <td>${v.desc}</td>
        <td><strong style="color:var(--accent)">${v.plate}</strong></td>
        <td>${document.getElementById('reportDateFrom').value} ${Math.floor(Math.random()*12+8)}:${Math.floor(Math.random()*60)}</td>
        <td><strong style="color:var(--danger)">${Math.floor(Math.random()*40+100)} km/h</strong></td>
        <td>+${Math.floor(Math.random()*20+10)} km/h</td>
        <td>Autopista Regional del Centro</td>
      </tr>`)).join('');
    } else if (selectedReportType === 'stop') {
      htmlHead = '<tr><th>Vehículo</th><th>Placa</th><th>Llegada</th><th>Salida</th><th>Duración</th><th>Ubicación</th></tr>';
      htmlBody = vehicles.flatMap(v => [1, 2].map(() => `<tr>
        <td>${v.desc}</td>
        <td><strong style="color:var(--accent)">${v.plate}</strong></td>
        <td>10:15 AM</td>
        <td>10:45 AM</td>
        <td><strong style="color:var(--warning)">30 min</strong></td>
        <td>Zona Industrial de Maracaibo</td>
      </tr>`)).join('');
    } else if (selectedReportType === 'geofence') {
      htmlHead = '<tr><th>Vehículo</th><th>Geocerca</th><th>Evento</th><th>Fecha/Hora</th><th>Duración en zona</th></tr>';
      htmlBody = vehicles.flatMap(v => [1].map(() => `<tr>
        <td>${v.plate}</td>
        <td>Sede Electrologia</td>
        <td><span class="status-badge active">Entrada</span></td>
        <td>08:00 AM</td>
        <td>4h 20m</td>
      </tr>`)).join('');
    } else {
      // Default / Route / Summary
      htmlHead = '<tr><th>Vehículo</th><th>Placa</th><th>Fecha</th><th>Distancia</th><th>Tiempo Mov.</th><th>Vel. Máx</th><th>Eventos</th></tr>';
      htmlBody = vehicles.map(v => `<tr>
        <td>${v.desc}</td>
        <td><strong style="color:var(--accent)">${v.plate}</strong></td>
        <td>${document.getElementById('reportDateFrom').value}</td>
        <td>${(Math.random()*200+10).toFixed(1)} km</td>
        <td>${Math.floor(Math.random()*8+1)}h ${Math.floor(Math.random()*60)}m</td>
        <td>${Math.floor(Math.random()*60+60)} km/h</td>
        <td>${Math.floor(Math.random()*10)}</td>
      </tr>`).join('');
    }

    head.innerHTML = htmlHead;
    body.innerHTML = htmlBody;
    document.getElementById('reportResultTitle').textContent = `Resultados - ${vehicles.length} vehículo(s)`;
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });
    showToast(`✔ Reporte de ${selectedReportType.toUpperCase()} generado exitosamente`, 'success');
  });

  function downloadCSV(filename, data) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  document.getElementById('exportPDFBtn').addEventListener('click', () => {
    showToast('📄 Generando reporte PDF...', 'info');
    setTimeout(() => showToast('✔ PDF descargado correctamente', 'success'), 1500);
  });
  document.getElementById('exportXLSBtn').addEventListener('click', () => {
    showToast('📊 Generando Excel...', 'info');
    const vehicleId = document.getElementById('reportVehicle').value;
    const data = vehicleId === 'all' ? T.vehicles : T.vehicles.filter(v => v.id == vehicleId);
    downloadCSV(`reporte_trackjf_${selectedReportType}.csv`, data);
  });
  document.getElementById('exportEventsBtn')?.addEventListener('click', () => {
    showToast('📥 Exportando eventos...', 'info');
    downloadCSV('eventos_trackjf.csv', T.events);
  });
  document.getElementById('exportVehiclesBtn')?.addEventListener('click', () => {
    showToast('📥 Exportando lista de flota...', 'info');
    downloadCSV('flota_trackjf.csv', T.vehicles);
  });
  document.getElementById('exportClientsBtn')?.addEventListener('click', () => {
    showToast('📥 Exportando clientes...', 'info');
    downloadCSV('clientes_trackjf.csv', T.clients);
  });

  // ---- Settings Save ----
  function saveSettings(key, formId) {
    const data = {};
    const formData = new FormData(document.getElementById(formId));
    formData.forEach((value, key) => { data[key] = value; });
    localStorage.setItem(`trackjf_settings_${key}`, JSON.stringify(data));
    showToast(`✔ Configuración de ${key} guardada`, 'success');
  }

  document.getElementById('saveCompanyBtn')?.addEventListener('click', () => saveSettings('empresa', 'companyForm'));
  document.getElementById('saveAlertsConfigBtn')?.addEventListener('click', () => saveSettings('alertas', 'alertsConfigForm'));
  document.getElementById('saveMapConfigBtn')?.addEventListener('click', () => saveSettings('mapa', 'mapConfigForm'));
  document.getElementById('changePassBtn')?.addEventListener('click', () => {
    const newP = document.getElementById('newPass')?.value;
    if (!newP || newP.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    showToast('✔ Contraseña actualizada correctamente', 'success');
    const setForm = document.getElementById('settingsForm');
    if (setForm) setForm.reset();
  });

  // ---- Refresh ----
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    simulateVehicleMovement();
    if (currentPage === 'vehicles') renderVehiclesTable();
    if (currentPage === 'alerts') renderAlertsTable();
    if (currentPage === 'events') renderEventsTable();
    showToast('🔄 Datos actualizados', 'info');
  });

  // ---- Search ----
  const globSearch = document.getElementById('globalSearch');
  if (globSearch) {
    globSearch.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      if (q && currentPage !== 'vehicles') { navigate('vehicles'); }
      renderVehiclesTable(q);
    });
  }

  document.getElementById('vehicleSearch')?.addEventListener('input', e => renderVehiclesTable(e.target.value));
  document.getElementById('vehicleStatusFilter')?.addEventListener('change', () => renderVehiclesTable());
  document.getElementById('vehicleClientFilter')?.addEventListener('change', () => renderVehiclesTable());
  document.getElementById('clientSearch')?.addEventListener('input', e => renderClientsTable(e.target.value));
  document.getElementById('clientStatusFilter')?.addEventListener('change', () => renderClientsTable());
  document.getElementById('eventSearch')?.addEventListener('input', () => renderEventsTable());
  document.getElementById('eventTypeFilter')?.addEventListener('change', () => renderEventsTable());
  document.getElementById('configAlertsBtn')?.addEventListener('click', () => navigate('settings'));

  // ---- Stats ----
  function updateStats() {
    const total = document.getElementById('stat-total');
    if (total) total.textContent = T.vehicles.length;
    const moving = document.getElementById('stat-moving');
    if (moving) moving.textContent = T.vehicles.filter(v => v.status === 'moving').length;
    const parked = document.getElementById('stat-parked');
    if (parked) parked.textContent = T.vehicles.filter(v => v.status === 'parked').length;
    const offline = document.getElementById('stat-offline');
    if (offline) offline.textContent = T.vehicles.filter(v => v.status === 'offline').length;
  }

  // ---- Simulate vehicle movement (DISABLED per user request) ----
  function simulateVehicleMovement() {
    T.vehicles.forEach(v => {
      if (v.status === 'moving') {
        v.lat += (Math.random() - 0.5) * 0.002;
        v.lng += (Math.random() - 0.5) * 0.002;
        v.speed = Math.floor(Math.random() * 80 + 30);
        v.lastSignal = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
      }
    });
    if (map) renderMapMarkers();
    renderVehicleListPanel();
    updateStats();
  }

  // ---- Toast ----
  window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
  };

  // ---- Notification badge ----
  document.getElementById('notifBtn').addEventListener('click', () => {
    showToast(`🔔 Tienes ${T.alerts.filter(a=>a.status==='active').length} alertas activas`, 'warning');
    navigate('alerts');
  });

  // ---- CAMERAS PAGE ----
  const adasEventTypes = [
    { type: 'danger', icon: '😴', title: 'Somnolencia detectada (DSM)', desc: 'Conductor con ojos cerrados >2s' },
    { type: 'danger', icon: '📱', title: 'Uso de teléfono (DSM)', desc: 'Conductor usando dispositivo móvil' },
    { type: 'warning', icon: '↔️', title: 'Cambio de carril (ADAS)', desc: 'Sin señalización de cambio' },
    { type: 'danger', icon: '⚠️', title: 'Colisión frontal (ADAS)', desc: 'Distancia crítica al vehículo frontal' },
    { type: 'info', icon: '🚦', title: 'Señal de tráfico', desc: 'Semáforo rojo detectado' },
    { type: 'warning', icon: '🌧️', title: 'Condición climática', desc: 'Lluvia detectada - activar luces' },
    { type: 'danger', icon: '😤', title: 'Distracción (DSM)', desc: 'Conductor distraído >3s' },
    { type: 'warning', icon: '🚧', title: 'Peatón detectado (ADAS)', desc: 'Peatón en zona de cruce' },
  ];

  let adasEvents = [];
  let selectedCamVehicleId = null;
  const camPlayers = new Map(); // key -> { hls?, stream? }

  const CAM_LABELS = ['📷 Frontal', '📷 Trasera', '📷 Lateral Izq.', '📷 Cabin (DSM)'];
  const CAM_ANGLES = ['↑ Frente', '↓ Atrás', '← Izquierda', '● Interior'];

  function camKey(vehicleId, camIdx) {
    return `${vehicleId || 'none'}:${camIdx}`;
  }

  function loadCamConfig(vehicleId) {
    try {
      const raw = localStorage.getItem(`trackjf_cam_cfg_${vehicleId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveCamConfig(vehicleId, cfg) {
    try {
      localStorage.setItem(`trackjf_cam_cfg_${vehicleId}`, JSON.stringify(cfg || {}));
    } catch {}
  }

  function stopCam(vehicleId, camIdx) {
    const key = camKey(vehicleId, camIdx);
    const player = camPlayers.get(key);
    if (player?.hls) {
      try { player.hls.destroy(); } catch {}
    }
    if (player?.stream) {
      try { player.stream.getTracks().forEach(t => t.stop()); } catch {}
    }
    camPlayers.delete(key);

    const video = document.querySelector(`#cam-${camIdx} video[data-vehicle="${vehicleId}"]`);
    if (video) {
      try { video.pause(); } catch {}
      try { video.srcObject = null; } catch {}
      try { video.removeAttribute('src'); } catch {}
      try { video.load(); } catch {}
      video.classList.add('hidden');
    }
    const placeholder = document.querySelector(`#cam-${camIdx} .camera-placeholder[data-vehicle="${vehicleId}"]`);
    if (placeholder) placeholder.style.display = '';
  }

  async function startWebcam(vehicleId, camIdx) {
    const grid = document.getElementById('cameraGrid');
    if (!grid) return;
    stopCam(vehicleId, camIdx);

    const video = document.querySelector(`#cam-${camIdx} video[data-vehicle="${vehicleId}"]`);
    const placeholder = document.querySelector(`#cam-${camIdx} .camera-placeholder[data-vehicle="${vehicleId}"]`);
    if (!video) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => {});
    video.classList.remove('hidden');
    if (placeholder) placeholder.style.display = 'none';

    camPlayers.set(camKey(vehicleId, camIdx), { stream });
  }

  function startUrl(vehicleId, camIdx, url) {
    stopCam(vehicleId, camIdx);
    const video = document.querySelector(`#cam-${camIdx} video[data-vehicle="${vehicleId}"]`);
    const placeholder = document.querySelector(`#cam-${camIdx} .camera-placeholder[data-vehicle="${vehicleId}"]`);
    if (!video) return;

    const isHls = /\.m3u8(\?|#|$)/i.test(url || '');
    
    // Auto-apply proxy if enabled (forces absolute production proxy URL to avoid CORS locally and Mixed Content on prod)
    let finalUrl = url;
    if (USE_VIDEO_PROXY && url.startsWith('http://')) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        // Enrutando todo siempre al proxy seguro en producción para evitar bloqueos
        finalUrl = `https://mecanicoenmedellin.com/gpscarlos/cam-proxy.php?file=${filename}`;
        console.log(`[Video] Proxying stream over HTTPS: ${url} -> ${finalUrl}`);
    }

    const HlsCtor = window.Hls;
    if (isHls && HlsCtor && typeof HlsCtor.isSupported === 'function' && HlsCtor.isSupported()) {
      const hls = new HlsCtor({ 
        lowLatencyMode: true, 
        backBufferLength: 30,
        enableWorker: true
      });
      hls.loadSource(finalUrl);
      hls.attachMedia(video);
      hls.on(HlsCtor.Events.ERROR, () => {});
      camPlayers.set(camKey(vehicleId, camIdx), { hls });
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.classList.remove('hidden');
      if (placeholder) placeholder.style.display = 'none';
      return;
    }

    // MP4 / WebM / etc (same-origin or CORS-enabled)
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.classList.remove('hidden');
    if (placeholder) placeholder.style.display = 'none';
    video.play().catch(() => {});
  }

  function renderCamerasPage() {
    // Vehicle selector buttons
    const selector = document.getElementById('camVehicleSelector');
    if (selector) {
      selector.innerHTML = T.vehicles.slice(0, 6).map((v, i) => `
        <button class="btn ${i === 0 ? 'primary' : 'ghost'}" onclick="selectCamVehicle(${v.id}, this)" style="font-size:12px;padding:7px 14px;">
          🚗 ${v.plate}
        </button>
      `).join('');
    }

    // Render 4 camera feeds
    selectedCamVehicleId = T.vehicles[0]?.id ?? null;
    renderCameraFeeds(T.vehicles[0]);
    renderAdasEvents();

    // AUTO-LOAD DEMO STREAM for the first vehicle, first camera
    setTimeout(() => {
      const demoUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      const firstVehicleId = T.vehicles[0]?.id;
      if (firstVehicleId) {
        startUrl(firstVehicleId, 0, demoUrl);
        showToast('🎥 Conectando Cámara MD300 (Demo Live)...', 'info');
      }
    }, 1000);
  }

  function renderCameraFeeds(v) {
    const grid = document.getElementById('cameraGrid');
    if (!grid) return;
    const vehicleId = v?.id ?? selectedCamVehicleId ?? 'none';
    selectedCamVehicleId = vehicleId === 'none' ? null : vehicleId;
    const cfg = vehicleId && vehicleId !== 'none' ? loadCamConfig(vehicleId) : {};

    grid.innerHTML = CAM_LABELS.map((cam, i) => {
      const savedUrl = cfg?.[i]?.url || '';
      return `
        <div class="camera-feed" id="cam-${i}">
          <video class="camera-video hidden" data-vehicle="${vehicleId}" autoplay muted playsinline></video>
          <div class="camera-placeholder" data-vehicle="${vehicleId}">
            <div class="camera-scan-line"></div>
            <div class="camera-icon">📹</div>
            <div class="camera-label">${cam} · ${v ? v.plate : 'Sin vehículo'}</div>
            <div style="font-size:10px;color:rgba(148,163,184,0.5);">${CAM_ANGLES[i]} · pega URL .m3u8 o usa webcam</div>
          </div>
          <div class="camera-overlay">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <span class="camera-badge live"><span class="live-dot"></span>EN VIVO</span>
              <span class="camera-badge">${i === 3 ? 'DSM' : 'ADAS'}</span>
            </div>
            <div class="camera-bottom">
              <div style="font-size:10px;color:rgba(148,163,184,0.7);" data-clock="1">${new Date().toLocaleTimeString('es-VE')}</div>
              <div class="camera-btn-group">
                <input class="cam-url" placeholder="URL (HLS .m3u8 / MP4)" value="${savedUrl.replace(/\"/g,'&quot;')}" data-cam-url="${i}" data-vehicle="${vehicleId}" />
                <button class="cam-btn" title="Conectar webcam" data-cam-action="webcam" data-cam="${i}" data-vehicle="${vehicleId}">🎥</button>
                <button class="cam-btn" title="Conectar URL" data-cam-action="url" data-cam="${i}" data-vehicle="${vehicleId}">▶</button>
                <button class="cam-btn" title="Detener" data-cam-action="stop" data-cam="${i}" data-vehicle="${vehicleId}">⏹</button>
                <button class="cam-btn" title="Pantalla completa" data-cam-action="full" data-cam="${i}" data-vehicle="${vehicleId}">⛶</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind actions (event delegation)
    grid.onclick = async (e) => {
      const btn = e.target?.closest?.('[data-cam-action]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const action = btn.getAttribute('data-cam-action');
      const camIdx = parseInt(btn.getAttribute('data-cam') || '0', 10);
      const vid = btn.getAttribute('data-vehicle');
      if (!vid || vid === 'none') return showToast('Selecciona un vehículo para cámaras', 'warning');
      const vehicleIdNum = parseInt(vid, 10);

      if (action === 'full') return expandCam(camIdx);
      if (action === 'stop') {
        stopCam(vehicleIdNum, camIdx);
        return;
      }
      if (action === 'webcam') {
        try {
          await startWebcam(vehicleIdNum, camIdx);
          showToast('🎥 Webcam conectada (demo)', 'success');
        } catch (err) {
          showToast('No se pudo acceder a la cámara del navegador', 'error');
        }
        return;
      }
      if (action === 'url') {
        const input = grid.querySelector(`input[data-cam-url="${camIdx}"][data-vehicle="${vehicleIdNum}"]`);
        const url = (input?.value || '').trim();
        if (!url) return showToast('Pega una URL de video (.m3u8 o .mp4)', 'warning');
        startUrl(vehicleIdNum, camIdx, url);
        const nextCfg = loadCamConfig(vehicleIdNum);
        nextCfg[camIdx] = { ...(nextCfg[camIdx] || {}), url };
        saveCamConfig(vehicleIdNum, nextCfg);
        showToast('▶ Stream conectado', 'success');
      }
    };
  }

  window.selectCamVehicle = (id, btn) => {
    document.querySelectorAll('#camVehicleSelector button').forEach(b => b.className = 'btn ghost');
    btn.className = 'btn primary';
    btn.style.fontSize = '12px'; btn.style.padding = '7px 14px';
    selectedCamVehicleId = id;
    renderCameraFeeds(T.getVehicle(id));
  };

  window.expandCam = (idx) => {
    const grid = document.getElementById('cameraGrid');
    const tile = document.getElementById(`cam-${idx}`);
    if (!grid || !tile) return showToast(`📷 Pantalla completa: Cámara ${idx + 1}`, 'info');
    const isFull = tile.classList.contains('full');
    grid.querySelectorAll('.camera-feed').forEach(el => el.classList.remove('full'));
    if (!isFull) tile.classList.add('full');
  };

  function renderAdasEvents() {
    // Generate some initial events
    if (adasEvents.length === 0 && T.vehicles.length > 0) {
      adasEvents = adasEventTypes.slice(0, 5).map((e, i) => {
        const v = T.vehicles[Math.floor(Math.random() * T.vehicles.length)];
        return {
          ...e,
          vehicle: v ? v.plate : '—',
          time: new Date(Date.now() - i * 120000).toLocaleTimeString('es-VE')
        };
      });
    }
    const list = document.getElementById('adasEventList');
    if (!list) return;
    list.innerHTML = adasEvents.map(e => `
      <div class="adas-event">
        <div class="adas-icon ${e.type}"><span>${e.icon}</span></div>
        <div class="adas-text">
          <div class="adas-title">${e.title}</div>
          <div class="adas-meta">🚗 ${e.vehicle} · ${e.desc}</div>
        </div>
        <div class="adas-time">${e.time}</div>
      </div>
    `).join('');
  }

  document.getElementById('clearAdasBtn')?.addEventListener('click', () => {
    adasEvents = [];
    renderAdasEvents();
    showToast('Eventos ADAS limpiados', 'info');
  });

  document.getElementById('cam2x2Btn')?.addEventListener('click', () => {
    document.getElementById('cameraGrid').style.gridTemplateColumns = '1fr 1fr';
    showToast('Vista 2×2 activada', 'info');
  });

  document.getElementById('cam1x1Btn')?.addEventListener('click', () => {
    document.getElementById('cameraGrid').style.gridTemplateColumns = '1fr';
    showToast('Vista de pantalla completa activada', 'info');
  });

  document.getElementById('camSnapshotBtn')?.addEventListener('click', () => {
    const videos = document.querySelectorAll('.camera-video:not(.hidden)');
    if (videos.length === 0) return showToast('No hay cámaras activas para capturar', 'warning');
    
    videos.forEach((video, i) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `snapshot_cam_${i+1}_${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error capturando snapshot:', err);
      }
    });
    showToast('📸 Capturas procesadas correctamente', 'success');
  });

  const VIDEO_SERVER_IP = '66.97.42.27';
  const VIDEO_SERVER_PORT = '6100';
  const USE_VIDEO_PROXY = true; // Forzamos proxy para evitar bloqueos HTTPS/CORS

  document.getElementById('camAutoLinkBtn')?.addEventListener('click', () => {
    if (!selectedCamVehicleId) return showToast('Selecciona un vehículo primero', 'warning');
    const vehicle = T.getVehicle(selectedCamVehicleId);
    const device = T.devices.find(d => d.id === vehicle?.deviceId);
    
    if (!device) return showToast('El vehículo no tiene un dispositivo MD300 asociado', 'error');

    showToast('🔗 Vinculando canales del servidor de video...', 'info');
    
    const nextCfg = loadCamConfig(selectedCamVehicleId);
    [0, 1, 2, 3].forEach(i => {
      // Carlos Tracking / CMSV6 standard HLS format: http://IP:PORT/live/hls/IMEI_CHANNEL.m3u8
      const channel = i + 1;
      const url = `http://${VIDEO_SERVER_IP}:${VIDEO_SERVER_PORT}/live/hls/${device.imei}_${channel}.m3u8`;
      nextCfg[i] = { url };
      
      // If first camera, start it immediately
      if (i === 0) startUrl(selectedCamVehicleId, i, url);
    });
    
    saveCamConfig(selectedCamVehicleId, nextCfg);
    renderCameraFeeds(vehicle);
    
    if (typeof logToMtConsole === 'function') {
      logToMtConsole(`[VIDEO] Canales vinculados para IMEI ${device.imei} en ${VIDEO_SERVER_IP}`, 'success');
    }
  });

  const LOCAL_CAMERA_IP = '192.168.159.10';

  document.getElementById('camLocalMd300Btn')?.addEventListener('click', () => {
    if (!selectedCamVehicleId) return showToast('Selecciona un vehículo primero', 'warning');
    
    showToast('📡 Conectando a MD300 en red local (Wi-Fi)...', 'info');
    
    const nextCfg = loadCamConfig(selectedCamVehicleId);
    [0, 1, 2, 3].forEach(i => {
      // For local MD300, it usually serves MJPEG or HLS locally on the web port
      const url = `http://${LOCAL_CAMERA_IP}/live/stream${i+1}.m3u8`;
      nextCfg[i] = { url };
      
      // Attempt to load
      if (i === 0) startUrl(selectedCamVehicleId, i, url);
    });
    
    saveCamConfig(selectedCamVehicleId, nextCfg);
    renderCameraFeeds(T.getVehicle(selectedCamVehicleId));
    
    showToast('Cámara local vinculada. Si no ves imagen, verifica el login del DVR en una pestaña aparte.', 'warning');
  });

  // Simulate ADAS events randomly
  setInterval(() => {
    if (currentPage !== 'cameras' || T.vehicles.length === 0) return;
    const randomEvent = adasEventTypes[Math.floor(Math.random() * adasEventTypes.length)];
    const v = T.vehicles[Math.floor(Math.random() * T.vehicles.length)];
    if (!v) return;
    adasEvents.unshift({
      ...randomEvent,
      vehicle: v.plate,
      time: new Date().toLocaleTimeString('es-VE')
    });
    if (adasEvents.length > 20) adasEvents.pop();
    renderAdasEvents();
    if (randomEvent.type === 'danger') {
      showToast(`🚨 ADAS: ${randomEvent.title} en ${v.plate}`, 'error');
    }
  }, 8000);

  // ---- TELEMETRY PAGE ----
  function renderTelemetryPage() {
    const sel = document.getElementById('telemetryVehicleSel');
    if (sel && sel.options.length === 0) {
      T.vehicles.forEach(v => {
        const o = document.createElement('option');
        o.value = v.id; o.textContent = `${v.plate} - ${v.desc}`;
        sel.appendChild(o);
      });
    }
    updateTelemetryDisplay(T.vehicles[0]);

    sel?.addEventListener('change', () => {
      const v = T.getVehicle(parseInt(sel.value));
      if (v) updateTelemetryDisplay(v);
    });
  }

  function updateTelemetryDisplay(v) {
    if (!v) return;
    const speed = v.speed;
    const pct = Math.min(speed / 200 * 100, 100);
    const gaugeEl = document.getElementById('speedGauge');
    if (gaugeEl) gaugeEl.style.setProperty('--pct', pct.toFixed(1) + '%');
    const gsVal = document.getElementById('gaugeSpeedVal');
    if (gsVal) gsVal.textContent = speed;
    const gsCur = document.getElementById('gaugeSpeedCurrent');
    if (gsCur) gsCur.textContent = speed;
    const telSpeed = document.getElementById('tel-speed');
    if (telSpeed) telSpeed.textContent = speed;
    const telLat = document.getElementById('tel-lat');
    if (telLat) telLat.textContent = v.lat.toFixed(5) + '°';
    const telLng = document.getElementById('tel-lng');
    if (telLng) telLng.textContent = v.lng.toFixed(5) + '°';
    const telOdo = document.getElementById('tel-odometer');
    if (telOdo) telOdo.textContent = v.odometer.toLocaleString('es-VE');
    const d = T.devices.find(d => d.vehicleId === v.id);
    const telBat = document.getElementById('tel-battery');
    if (telBat && d) telBat.textContent = d.battery > 50 ? '12.4' : d.battery > 20 ? '11.8' : '10.5';
    const telSig = document.getElementById('tel-signal');
    if (telSig) telSig.textContent = v.status === 'offline' ? 'Sin señal' : '4G';
  }

  document.getElementById('exportTelemetryBtn')?.addEventListener('click', () => showToast('📥 Exportando telemetría…', 'info'));

  // ---- Init ----
  function init() {
    updateStats();
    renderVehicleListPanel();
    renderActivityFeed();
    renderEventChart();
    initDashboardMap();
    requestAnimationFrame(() => { if (map) map.invalidateSize(); });
    setTimeout(() => { if (map) map.invalidateSize(); }, 250);
  }

  init();

  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
    if (historyMap) historyMap.invalidateSize();
    if (geofenceMap) geofenceMap.invalidateSize();
  });

  // Auto-refresh every 20s - Sincronización Real Traccar
  setInterval(async () => {
    if (window.T_API && !window.T_API.useSimulatedFallback) {
      await window.T_API.syncGlobalData();
    } else {
      simulateVehicleMovement();
    }
    
    // Random chance to generate a real-time event (demo only)
    if ((!window.T_API || window.T_API.useSimulatedFallback) && Math.random() > 0.7 && T.vehicles.length > 0) {
      const v = T.vehicles[Math.floor(Math.random() * T.vehicles.length)];
      if (!v) return;
      
      const eventTypes = [
        { type: 'ignition_on', text: '🟢 Motor Encendido' },
        { type: 'speed', text: '⚡ Exceso de Velocidad' },
        { type: 'geofence_in', text: '📍 Entrada a Geocerca' }
      ];
      const ev = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      showToast(`${ev.text}: ${v.plate}`, ev.type === 'speed' ? 'warning' : 'info');
      
      T.events.unshift({
        id: Date.now(),
        type: ev.type,
        vehicleId: v.id,
        desc: ev.text.split(' ')[1],
        location: v.address,
        speed: v.speed,
        datetime: new Date().toLocaleString()
      });
      if (T.events.length > 50) T.events.pop();
      renderActivityFeed();
      if (currentPage === 'events') renderEventsTable();
    }
  }, 20000);

  window.refreshUIMap = function() {
    renderVehicleList();
    renderMarkers();
    renderStats();
    if (currentPage === 'telemetry') renderTelemetryPage();
  };

  // ---- Meitrack Manager ----
  let meitrackActiveDeviceId = null;

  function renderMeitrackPage() {
    const list = document.getElementById('meitrackDeviceList');
    if (!list) return;

    const meitrackDevices = T.devices.filter(d => 
      (d.model && d.model.toLowerCase().includes('meitrack')) || 
      d.model === 'MVT380' || 
      d.model === 'T399L' ||
      (d.imei && d.imei.startsWith('865468'))
    );

    list.innerHTML = `
      <div class="mt-device-item" onclick="document.getElementById('meitrackEmptyState').style.display='none'; document.getElementById('meitrackMainPanel').style.display='flex'; document.getElementById('mtActiveDeviceName').innerText='MD300 Principal';">
        <div class="mt-device-icon">📡</div>
        <div class="mt-device-info">
          <div class="mt-device-name">MD300 Principal</div>
          <div class="mt-device-imei">Haga clic para editar IMEI</div>
        </div>
        <div class="status-dot active"></div>
      </div>
    ` + meitrackDevices.map(d => {
      const v = T.getVehicle(d.vehicleId);
      return `
        <div class="mt-device-item ${meitrackActiveDeviceId === d.id ? 'active' : ''}" onclick="window.selectMeitrackDevice(${d.id})">
          <div class="mt-device-icon">📡</div>
          <div class="mt-device-info">
            <div class="mt-device-name">${v ? v.plate : d.model}</div>
            <div class="mt-device-imei">IMEI: ${d.imei}</div>
          </div>
          <div class="status-dot ${d.status === 'active' ? 'active' : 'offline'}"></div>
        </div>
      `;
    }).join('');

    if (meitrackActiveDeviceId) {
        // Highlighting handled by CSS class update in selectMeitrackDevice
    }
  }

  window.selectMeitrackDevice = function(id) {
    meitrackActiveDeviceId = id;
    const device = T.devices.find(d => d.id === id);
    if (!device) return;
    const vehicle = T.getVehicle(device.vehicleId);
    
    const es = document.getElementById('meitrackEmptyState');
    const mp = document.getElementById('meitrackMainPanel');
    if (es) es.style.display = 'none';
    if (mp) mp.style.display = 'flex';
    
    const adn = document.getElementById('mtActiveDeviceName');
    const adi = document.getElementById('mtActiveDeviceIMEI');
    const cfgImei = document.getElementById('mtCfgImei');
    
    if (adn) adn.textContent = vehicle ? `${vehicle.plate} - ${vehicle.desc}` : device.model;
    if (adi) adi.textContent = `IMEI: ${device.imei}`;
    if (cfgImei) cfgImei.value = device.imei;
    
    document.querySelectorAll('.mt-device-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mt-device-item').forEach(item => {
        if (item.innerHTML.includes(device.imei)) item.classList.add('active');
    });

    logToMtConsole(`[SYSTEM] Conectado a dispositivo ${device.imei} con protocolo Meitrack V1.x`, 'info');
  };

  function logToMtConsole(msg, type = 'log') {
    const consoleEl = document.getElementById('mtConsole');
    if (!consoleEl) return;
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span style="color:var(--text-muted)">[${time}]</span> <span style="color:${type==='error'?'#ff4757':type==='info'?'#00c9ff':'#2ed573'}">${msg}</span>`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  window.sendQuickCommand = function(cmd) {
    const input = document.getElementById('mtCommandInput');
    if (input) input.value = cmd;
    mtExecuteCommand();
  };

  function mtExecuteCommand() {
    const input = document.getElementById('mtCommandInput');
    if (!input) return;
    const cmd = input.value.trim();
    if (!cmd || !meitrackActiveDeviceId) {
      if (!meitrackActiveDeviceId) showToast('Seleccione un dispositivo primero', 'warning');
      return;
    }

    const device = T.devices.find(d => d.id === meitrackActiveDeviceId);
    logToMtConsole(`> TX: $$A11,${device.imei},0000,${cmd}*CC`, 'log');
    input.value = '';

    setTimeout(() => {
      const responses = {
        'B05': `$$B05,${device.imei},10.6660,-71.6125,${new Date().toISOString()},A,12,0*FF`,
        'C01,1': `$$C01,${device.imei},OK*01`,
        'C01,0': `$$C01,${device.imei},OK*00`,
        'A10': `$$A10,${device.imei},30,1,104.248.122.34,5004*AA`
      };
      const resp = responses[cmd] || `$$${cmd.split(',')[0]},${device.imei},ACK*00`;
      logToMtConsole(`< RX: ${resp}`, 'success');
      if (cmd === 'C01,1') showToast('Motor inhabilitado vía Meitrack Protocol', 'warning');
      if (cmd === 'C01,0') showToast('Motor rehabilitado vía Meitrack Protocol', 'success');
    }, 800);
  }
  
  window.simulatePanicAlert = function() {
    if (!meitrackActiveDeviceId) return showToast('Seleccione un dispositivo primero', 'warning');
    
    const device = T.devices.find(d => d.id === meitrackActiveDeviceId);
    const vehicle = T.getVehicle(device.vehicleId);
    
    logToMtConsole(`[ALERT] !PÁNICO DETECTADO! - Señal física recibida en Input 1`, 'error');
    logToMtConsole(`< EVENT: $$A11,${device.imei},0000,SOS*BB`, 'error');
    
    showToast(`⚠️ BOTÓN DE PÁNICO ACTIVADO: ${vehicle ? vehicle.plate : device.imei}`, 'error');
    
    // Send to Cameras ADAS list
    if (typeof adasEvents !== 'undefined') {
      adasEvents.unshift({
        type: 'danger',
        icon: '🚨',
        title: 'SOS: Pánico en Cabina',
        desc: 'Botón de emergencia pulsado por el conductor',
        vehicle: vehicle ? vehicle.plate : '—',
        time: new Date().toLocaleTimeString('es-VE')
      });
      if (typeof renderAdasEvents === 'function') renderAdasEvents();
    }
  };

  // --- MCF File Handling ---
  const fileInput = document.getElementById('mtConfigFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      showToast(`Cargando archivo: ${file.name}`, 'info');
      const reader = new FileReader();
      reader.onload = function(err) {
        try {
          const data = JSON.parse(err.target.result);
          applyMcfConfig(data);
        } catch(ex) {
          showToast('Error al procesar el archivo .MCF', 'error');
          console.error(ex);
        }
      };
      reader.readAsText(file);
    });
  }

  function applyMcfConfig(config) {
    if (!meitrackActiveDeviceId) {
      showToast('Seleccione un dispositivo para aplicar la configuración', 'warning');
      return;
    }

    logToMtConsole(`[MCF] Analizando archivo de configuración...`, 'info');
    
    // Key parameters extraction
    const findVal = (name) => config.find(x => x.Name === name)?.Value;
    
    const serverIp = findVal('comboBox_IPDomain1');
    const serverPort = findVal('textBox_IPDomainPort1');
    const apn = findVal('textBox_PPPoESettings_APN');
    const interval = findVal('numericUpDown_GPRSInterval');

    if (serverIp) document.getElementById('mtCfgIp').value = serverIp;
    if (serverPort) document.getElementById('mtCfgPort').value = serverPort;
    if (interval) document.getElementById('mtCfgInterval').value = interval;

    logToMtConsole(`[MCF] Parámetros extraídos:`, 'info');
    if (serverIp) logToMtConsole(` - Servidor: ${serverIp}:${serverPort}`, 'log');
    if (apn) logToMtConsole(` - APN Movistar: ${apn}`, 'log');
    if (interval) logToMtConsole(` - Intervalo: ${interval}s`, 'log');

    showToast('Archivo .MCF procesado. Haga clic en Guardar para aplicar.', 'success');
  }

  // Event Listeners for Meitrack Page
  document.addEventListener('click', e => {
      const target = e.target;
      if (target.id === 'mtSendBtn') mtExecuteCommand();
      if (target.id === 'mtSaveConfigBtn') {
          if (!meitrackActiveDeviceId) return showToast('Seleccione un dispositivo', 'warning');
          const interval = document.getElementById('mtCfgInterval')?.value;
          const ip = document.getElementById('mtCfgIp')?.value;
          const port = document.getElementById('mtCfgPort')?.value;
          
          logToMtConsole(`[CONFIG] Enviando comandos de configuración...`, 'info');
          logToMtConsole(`> TX: $$A10,${interval},1,${ip},${port}...`, 'log');
          
          setTimeout(() => {
              logToMtConsole(`[CONFIG] RX: $$A10,OK*00`, 'success');
              showToast('Configuración sincronizada con éxito', 'success');
          }, 1500);
      }
      if (target.id === 'meitrackSyncBtn') {
          showToast('Actualizando estado de dispositivos...', 'info');
          renderMeitrackPage();
      }
  });

  document.addEventListener('keypress', e => {
      if (e.target.id === 'mtCommandInput' && e.key === 'Enter') mtExecuteCommand();
  });

  // ---- Real-time Data Sync Engine (Traccar) ----
  const api = new TrackjfAPI();

  async function syncGlobalData() {
    try {
      if (document.hidden) return; // Ahorrar recursos si la pestaña no está activa
      
      const devices = await api.fetchDevices();
      const positions = await api.fetchPositions();

      if (devices && positions) {
        T.vehicles.forEach(v => {
          const traccarDev = devices.find(d => d.uniqueId === v.imei || d.attributes.imei === v.imei);
          if (traccarDev) {
            const pos = positions.find(p => p.deviceId === traccarDev.id);
            if (pos) {
              v.lat = pos.latitude;
              v.lng = pos.longitude;
              v.speed = Math.floor(pos.speed * 1.852);
              v.status = pos.speed > 0 ? 'moving' : 'parked';
              v.lastSignal = new Date(pos.deviceTime).toLocaleTimeString();
            }
          }
        });

        // Refrescar solo si estamos viendo el mapa o la lista
        if (currentPage === 'dashboard') {
          if (window.renderMapMarkers) renderMapMarkers();
          if (window.renderVehicleListPanel) renderVehicleListPanel();
          if (window.hasOwnProperty('updateStats')) updateStats();

          // AUTO-SEGUIMIENTO: Si hay un vehículo seleccionado, centrar mapa
          const selectedId = window.selectedTrackingVehicleId || (T.vehicles.length > 0 ? T.vehicles[0].id : null);
          const vSelected = T.vehicles.find(v => v.id === selectedId);
          if (vSelected && map) {
              map.setView([vSelected.lat, vSelected.lng], map.getZoom());
          }
        }
      }
    } catch (e) {
      console.warn('[SYNC] Fallo en sincronización:', e);
    }
  }

  // Sincronizar cada 10 segundos automáticamente
  setInterval(syncGlobalData, 10000);
  
  // Primera carga inmediata
  syncGlobalData();

})();
