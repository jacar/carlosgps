@extends('layouts.app')

@section('title', 'Cámaras en Vivo - TRACKJF')

@push('styles')
<style>
    .camera-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    .camera-feed {
        position: relative;
        background: #0a0f1e;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 16/9;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .camera-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .camera-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 15px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        pointer-events: none;
        background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%);
    }
    .camera-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(15, 76, 129, 0.8);
        backdrop-filter: blur(4px);
        color: #fff;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        pointer-events: auto;
    }
    .camera-badge.live { background: rgba(220, 38, 38, 0.8); }
    .live-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    
    .camera-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0a0f1e;
        color: rgba(255, 255, 255, 0.2);
    }
    .camera-icon { font-size: 48px; margin-bottom: 10px; }
    
    .camera-controls {
        position: absolute;
        bottom: 15px;
        right: 15px;
        display: flex;
        gap: 8px;
        pointer-events: auto;
    }
    .cam-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    .cam-btn:hover { background: var(--accent); border-color: var(--accent); }
    
    /* ADAS/DSM Detection Sidebar */
    .detection-sidebar {
        background: #0f172a;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        height: calc(100vh - 250px);
        display: flex;
        flex-direction: column;
    }
    .detection-item {
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 12px;
        transition: background 0.2s;
    }
    .detection-item:hover { background: rgba(255, 255, 255, 0.02); }
    .detection-icon { font-size: 20px; }
    .detection-time { font-size: 10px; color: #64748b; }
    .detection-label { font-size: 13px; font-weight: 600; }
    .detection-desc { font-size: 11px; color: #94a3b8; }
    
    /* Telemetry Overlay */
    .telemetry-row {
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(8px);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .tel-item { text-align: center; border-right: 1px solid rgba(255, 255, 255, 0.1); }
    .tel-item:last-child { border-right: none; }
    .tel-val { font-size: 20px; font-weight: 800; color: var(--accent); }
    .tel-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
</style>
@endpush

@section('content')
<div class="page-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">📷 Monitoreo de Cámaras MD300</h2>
        <p class="text-muted">Transmisión en vivo y telemática avanzada</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-outline-light me-2" id="camSnapshotBtn">📸 Captura Masiva</button>
        <button class="btn btn-primary" id="camAutoLinkBtn">🔗 Auto-vincular Carlos Tracking</button>
    </div>
</div>

<div class="row mb-4">
    <div class="col-md-12">
        <div class="card bg-dark border-secondary">
            <div class="card-body">
                <div class="d-flex align-items-center gap-3">
                    <label class="form-label mb-0">Seleccionar Vehículo:</label>
                    <select class="form-select bg-dark text-white border-secondary w-auto" id="vehicleSelector">
                        @foreach($vehicles as $vehicle)
                            <option value="{{ $vehicle->id }}" data-imei="{{ $vehicle->imei_md300 }}">
                                {{ $vehicle->plate }} - {{ $vehicle->model }}
                            </option>
                        @endforeach
                    </select>
                    <span class="badge bg-success" id="connectionStatus">● Servidor de Video Activo</span>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="telemetry-row row">
    <div class="col tel-item"><div class="tel-val" id="tel-speed">0</div><div class="tel-lbl">Velocidad (km/h)</div></div>
    <div class="col tel-item"><div class="tel-val" id="tel-heading">--</div><div class="tel-lbl">Rumbo</div></div>
    <div class="col tel-item"><div class="tel-val" id="tel-fuel">--</div><div class="tel-lbl">Combustible</div></div>
    <div class="col tel-item"><div class="tel-val" id="tel-volt">12.8V</div><div class="tel-lbl">Voltaje</div></div>
    <div class="col tel-item"><div class="tel-val text-success" id="tel-gps">Fix OK</div><div class="tel-lbl">Estado GPS</div></div>
</div>

<div class="row">
    <div class="col-lg-9">
        <div class="camera-grid" id="cameraGrid">
            @for($i = 1; $i <= 4; $i++)
            <div class="camera-feed" id="cam-{{ $i }}">
                <video class="camera-video d-none" id="video-{{ $i }}" autoplay muted playsinline></video>
                <div class="camera-placeholder" id="placeholder-{{ $i }}">
                    <div class="camera-icon">📷</div>
                    <div class="camera-label">Canal {{ $i }}</div>
                </div>
                <div class="camera-overlay">
                    <div class="d-flex justify-content-between">
                        <span class="camera-badge live"><span class="live-dot"></span> EN VIVO</span>
                        <span class="camera-badge" id="badge-{{ $i }}">CH {{ $i }}</span>
                    </div>
                    <div class="camera-controls">
                        <button class="cam-btn" onclick="takeSingleSnapshot({{ $i }})" title="Snapshot">📸</button>
                    </div>
                </div>
            </div>
            @endfor
        </div>
        
        <!-- Terminal / Logs -->
        <div class="card bg-dark border-secondary mt-4">
            <div class="card-header border-secondary py-2">
                <small class="text-uppercase fw-bold text-muted">Terminal de Diagnóstico MD300</small>
            </div>
            <div class="card-body p-0">
                <div id="terminal" style="height: 120px; background: #000; color: #2ed573; font-family: monospace; font-size: 12px; padding: 12px; overflow-y: auto;">
                    <div>[SYSTEM] Módulo telemático inicializado...</div>
                    <div>[SYSTEM] Esperando metadata de Carlos Tracking Gateway...</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-3">
        <div class="detection-sidebar">
            <div class="p-3 border-bottom border-secondary">
                <h6 class="mb-0">⚠️ Detecciones ADAS/DSM</h6>
            </div>
            <div id="detectionList" style="flex: 1; overflow-y: auto;">
                <div class="p-4 text-center text-muted opacity-50">
                    <div class="mb-2">💤</div>
                    <small>No se han detectado eventos críticos</small>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://unpkg.com/hls.js@1.5.18/dist/hls.min.js"></script>
<script>
    const VIDEO_SERVER = '66.97.42.27';
    const PROXY_PATH = '{{ asset("cam-proxy.php") }}';
    let activePlayers = {};

    function startStream(channel, imei) {
        logToTerminal(`Conectando Canal ${channel} (IMEI: ${imei})...`);
        const video = document.getElementById(`video-${channel}`);
        const placeholder = document.getElementById(`placeholder-${channel}`);
        const badge = document.getElementById(`badge-${channel}`);
        
        const labels = ['FRONTAL (ADAS)', 'CONDUCTOR (DSM)', 'LATERAL IZQUIERDA', 'LATERAL DERECHA'];
        badge.textContent = labels[channel-1] || `Canal ${channel}`;

        if (activePlayers[channel]) {
            activePlayers[channel].destroy();
        }

        const finalUrl = `${PROXY_PATH}?file=${imei}_${channel}.m3u8`;

        if (Hls.isSupported()) {
            const hls = new Hls({ lowLatencyMode: true });
            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.classList.remove('d-none');
                placeholder.classList.add('d-none');
                video.play();
                logToTerminal(`Canal ${channel} STREAM OK.`, 'success');
                simulateDetections(); // Start listening for simulated events
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) logToTerminal(`Error en Canal ${channel}: ${data.type}`, 'error');
            });
            activePlayers[channel] = hls;
        }
    }

    function logToTerminal(msg, type = 'info') {
        const terminal = document.getElementById('terminal');
        const entry = document.createElement('div');
        const color = type === 'error' ? '#ff4757' : (type === 'success' ? '#2ed573' : '#2ed573');
        entry.style.color = color;
        entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
        terminal.appendChild(entry);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function addDetection(icon, label, desc) {
        const list = document.getElementById('detectionList');
        if (list.querySelector('.opacity-50')) list.innerHTML = '';
        
        const item = document.createElement('div');
        item.className = 'detection-item';
        item.innerHTML = `
            <div class="detection-icon">${icon}</div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between">
                    <div class="detection-label">${label}</div>
                    <div class="detection-time">AHORA</div>
                </div>
                <div class="detection-desc">${desc}</div>
            </div>
        `;
        list.prepend(item);
        logToTerminal(`⚠️ EVENTO DETECTADO: ${label}`, 'error');
    }

    let telemetryInterval;
    let lastProcessedEventId = 0;

    function syncRealTimeData(imei) {
        if (telemetryInterval) clearInterval(telemetryInterval);
        
        telemetryInterval = setInterval(async () => {
            try {
                // 1. Sincronizar Telemetría (Posiciones)
                const posRes = await fetch(`/gps-proxy?endpoint=positions`);
                const positions = await posRes.json();
                const myPos = positions.find(p => p.attributes && p.attributes.imei === imei) || positions[0]; 
                
                if (myPos) {
                    updateTelemetryUI(myPos);
                }

                // 2. Sincronizar Eventos Reales (ADAS/DSM)
                const eventRes = await fetch(`/gps-proxy?endpoint=events`);
                const events = await eventRes.json();
                
                // Filtrar nuevos eventos para este dispositivo
                events.forEach(ev => {
                    if (ev.id > lastProcessedEventId) {
                        processRealEvent(ev);
                        lastProcessedEventId = ev.id;
                    }
                });
            } catch (e) {
                console.error("Error sync data", e);
            }
        }, 5000);
    }

    function updateTelemetryUI(pos) {
        const speedKmh = Math.round(pos.speed * 1.852);
        document.getElementById('tel-speed').textContent = speedKmh;
        document.getElementById('tel-heading').textContent = (pos.course || 0) + '°';
        document.getElementById('tel-gps').textContent = pos.valid ? 'FIX OK' : 'NO FIX';
        document.getElementById('tel-gps').className = pos.valid ? 'tel-val text-success' : 'tel-val text-danger';
        
        if (pos.attributes && pos.attributes.batteryLevel) {
            document.getElementById('tel-volt').textContent = pos.attributes.batteryLevel + '%';
        }
    }

    function processRealEvent(ev) {
        const eventMap = {
            'alarm': { icon: '⚠️', label: 'Alarma de Equipo', desc: ev.attributes.alarm || 'Evento detectado' },
            'deviceOnline': { icon: '🟢', label: 'Conexión Restablecida', desc: 'El equipo está reportando' },
            'deviceOffline': { icon: '🔴', label: 'Desconexión', desc: 'Se perdió enlace GPRS' },
            'ignitionOn': { icon: '🔑', label: 'Ignición ON', desc: 'Motor encendido' },
            'ignitionOff': { icon: '🛑', label: 'Ignición OFF', desc: 'Motor apagado' }
        };

        const config = eventMap[ev.type] || { icon: '🔔', label: 'Evento', desc: ev.type };
        addDetection(config.icon, config.label, config.desc);
    }

    document.getElementById('camAutoLinkBtn').addEventListener('click', () => {
        const selector = document.getElementById('vehicleSelector');
        const imei = selector.options[selector.selectedIndex].getAttribute('data-imei');
        
        if (!imei) {
            alert('Este vehículo no tiene IMEI configurado');
            return;
        }

        logToTerminal(`Sincronizando funciones completas para IMEI: ${imei}...`, 'success');
        syncRealTimeData(imei);

        for (let i = 1; i <= 4; i++) {
            startStream(i, imei);
        }
    });

    function takeSingleSnapshot(channel) {
        const video = document.getElementById(`video-${channel}`);
        if (video.classList.contains('d-none')) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const link = document.createElement('a');
        link.download = `camera_ch${channel}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
</script>
@endpush
