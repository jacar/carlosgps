@extends('layouts.app')

@section('title', 'Meitrack Manager - TRACKJF')

@push('styles')
<style>
    .terminal-window {
        background: #000;
        border-radius: 8px;
        padding: 15px;
        font-family: 'Courier New', Courier, monospace;
        color: #00ff00;
        height: 300px;
        overflow-y: auto;
        border: 1px solid #333;
        box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.1);
    }
    .terminal-line { margin-bottom: 4px; font-size: 13px; }
    .terminal-prefix { color: #888; margin-right: 8px; }
    .config-card {
        background: #111;
        border: 1px solid #333;
        transition: transform 0.2s;
    }
    .config-card:hover { transform: translateY(-2px); border-color: var(--accent); }
    .mt-tab {
        padding: 10px 20px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
    }
    .mt-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(0, 201, 255, 0.05); }
</style>
@endpush

@section('content')
<div class="page-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">🛠️ Meitrack Manager Online</h2>
        <p class="text-muted">Configuración GPRS y comandos para dispositivos MD300/T399L</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-outline-light me-2">📂 Cargar .MCF</button>
        <button class="btn btn-primary">🔄 Leer Configuración</button>
    </div>
</div>

<div class="row">
    <!-- Device List Sidebar -->
    <div class="col-lg-4">
        <div class="card bg-dark border-secondary">
            <div class="card-header border-secondary">
                <h6 class="mb-0">Lista de Dispositivos</h6>
            </div>
            <div class="card-body p-0" style="max-height: 500px; overflow-y: auto;">
                <div class="list-group list-group-flush bg-dark">
                    @foreach($vehicles as $v)
                    <button onclick="selectVehicle({{ $v->id }}, '{{ $v->plate }}', '{{ $v->imei }}', '{{ $v->sim_number }}', '{{ $v->sim_carrier }}')" class="list-group-item list-group-item-action bg-dark text-white border-secondary p-3 d-flex align-items-center gap-3">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: {{ $v->status === 'moving' ? '#2ed573' : '#94a3b8' }}"></div>
                        <div>
                            <div class="fw-bold">{{ $v->plate }}</div>
                            <small class="text-muted">IMEI: {{ $v->imei }}</small>
                        </div>
                    </button>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    <!-- Configuration Main Panel -->
    <div class="col-lg-8">
        <div class="card bg-dark border-secondary">
            <div class="d-flex border-bottom border-secondary">
                <div class="mt-tab active">Información</div>
                <div class="mt-tab">Red / GPRS</div>
                <div class="mt-tab">Eventos / Sensores</div>
                <div class="mt-tab">Terminal</div>
            </div>

            <div class="card-body">
                <!-- GPRS Config Section -->
                <div id="config-gprs" class="mt-3">
                    <div class="alert alert-info border-info bg-dark small mb-4">
                        <i class="bi bi-info-circle me-2"></i> Editando configuración para: <strong id="editing-vehicle-name">Seleccione un vehículo</strong>
                    </div>

                    <div class="row">
                        <div class="col-md-7">
                            <h6 class="text-accent mb-4">Información del Equipo</h6>
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label text-muted small text-uppercase">Identificador (IMEI)</label>
                                    <input type="text" id="dev-imei" class="form-control bg-dark border-secondary text-white fw-bold" placeholder="Ej: 867806073726244">
                                    <small class="text-muted">Este número debe coincidir con el de Meitrack Manager.</small>
                                </div>
                                <div class="col-md-8 mt-4">
                                    <label class="form-label text-muted small text-uppercase">IP del Servidor (Traccar)</label>
                                    <input type="text" id="mt-ip" class="form-control bg-dark border-secondary text-white" value="142.93.189.60">
                                </div>
                                <div class="col-md-4 mt-4">
                                    <label class="form-label text-muted small text-uppercase">Puerto</label>
                                    <input type="number" id="mt-port" class="form-control bg-dark border-secondary text-white" value="5004">
                                </div>
                            </div>
                        </div>
                        <div class="col-md-5 border-start border-secondary ps-4">
                            <h6 class="text-info mb-4">Línea Móvil (SIM)</h6>
                            <div class="mb-3">
                                <label class="form-label text-muted small text-uppercase">Número de Teléfono</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-dark border-secondary">🇻🇪</span>
                                    <input type="text" class="form-control bg-dark border-secondary text-white" placeholder="0412-1234567" id="simNumber">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted small text-uppercase">Operadora</label>
                                <select id="sim-operator" class="form-select bg-dark border-secondary text-white">
                                    <option>Movistar</option>
                                    <option>Digitel</option>
                                    <option>Movilnet</option>
                                </select>
                            </div>
                            <div class="input-group mt-4">
                                <button class="btn btn-outline-success w-100" onclick="sendSmsCommand()">📲 Enviar Comando vía SMS</button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-5 d-flex justify-content-between align-items-center pt-4 border-top border-secondary">
                        <div class="text-muted small">Estado: <span class="text-success" id="sync-status">Sincronizado con base de datos</span></div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-danger" onclick="deleteVehicle()">🗑️ Eliminar Equipo</button>
                            <button class="btn btn-outline-info" onclick="location.reload()">🔄 Refrescar</button>
                            <button class="btn btn-primary px-4" onclick="saveVehicleTechData()">💾 Guardar y Sincronizar</button>
                        </div>
                    </div>
                </div>

                <!-- Terminal Section -->
                <div id="config-terminal" class="d-none mt-3">
                    <div class="terminal-window mb-3" id="mainTerminal">
                        <div class="terminal-line"><span class="terminal-prefix">[09:21:45]</span> [CON] Conexión establecida con Gateway de Eventos</div>
                    </div>
                    <div class="input-group">
                        <span class="input-group-text bg-dark border-secondary text-success font-monospace">></span>
                        <input type="text" class="form-control bg-dark border-secondary text-white font-monospace" placeholder="Escriba un comando (ej: B05, A10)..." id="terminalInput">
                        <button class="btn btn-success" onclick="executeTerminalCommand()">Enviar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Help Card -->
        <div class="card bg-dark border-secondary mt-4">
            <div class="card-body d-flex align-items-center gap-3">
                <div class="fs-4">💡</div>
                <div class="small text-muted">
                    Vincule el IMEI correctamente para que la plataforma pueda jalar los datos de Traccar Demo 3. Si el equipo marca Offline, verifique el puerto 5020.
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    let selectedVehicleId = null;

    function selectVehicle(id, name, imei, sim, operator) {
        selectedVehicleId = id;
        document.getElementById('editing-vehicle-name').textContent = name;
        document.getElementById('dev-imei').value = imei || '';
        document.getElementById('simNumber').value = sim || '';
        document.getElementById('sim-operator').value = operator || 'Movistar';
        
        // Highlight active
        document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    }

    async function saveVehicleTechData() {
        if (!selectedVehicleId) return alert('Por favor seleccione un vehículo de la lista');
        
        const imei = document.getElementById('dev-imei').value;
        const sim = document.getElementById('simNumber').value;
        const operator = document.getElementById('sim-operator').value;

        try {
            const response = await fetch('/vehicle/save-tech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    id: selectedVehicleId,
                    imei: imei,
                    sim_number: sim,
                    sim_carrier: operator
                })
            });

            const res = await response.json();
            if (res.success) {
                logToTerminal(`[DB] ÉXITO: ${res.message}`, 'success');
                alert(res.message);
            }
        } catch (e) {
            logToTerminal(`[ERR] Error al guardar en base de datos`, 'error');
        }
    }

    async function deleteVehicle() {
        if (!selectedVehicleId) return alert('Seleccione un vehículo primero');
        if (!confirm('¿Está seguro de eliminar este equipo permanentemente?')) return;

        try {
            const response = await fetch(`/vehicle/delete/${selectedVehicleId}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                }
            });
            const res = await response.json();
            if (res.success) {
                alert('Equipo eliminado correctamente');
                location.reload();
            }
        } catch (e) {
            alert('Error al eliminar');
        }
    }

    function sendCommand(cmdCode) {
        // En un escenario real, esto enviará una petición a /api/send-command
        const terminal = document.getElementById('mainTerminal');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="terminal-prefix">[${new Date().toLocaleTimeString()}]</span> [TX] Sending command: ${cmdCode}...`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        
        setTimeout(() => {
            const rx = document.createElement('div');
            rx.className = 'terminal-line';
            rx.innerHTML = `<span class="terminal-prefix">[${new Date().toLocaleTimeString()}]</span> [RX] OK: Command ${cmdCode} accepted by device.`;
            terminal.appendChild(rx);
            terminal.scrollTop = terminal.scrollHeight;
        }, 1500);
    }

    function sendSmsCommand() {
        const num = document.getElementById('simNumber').value;
        if (!num) return alert('Por favor ingrese el número de teléfono');
        
        const cmd = prompt('Ingrese el comando SMS (ej: A10,0,66.97.42.27,6100,internet.movistar.ve,,)');
        if (cmd) {
            // Opens default SMS app on mobile devices
            window.location.href = `sms:${num}?body=${cmd}`;
        }
    }

    function executeTerminalCommand() {
        const input = document.getElementById('terminalInput');
        const val = input.value.trim();
        if (val) {
            sendCommand(val);
            input.value = '';
        }
    }

    // Switch between tabs (Simplified)
    document.querySelectorAll('.mt-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.mt-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.textContent === 'Terminal') {
                document.getElementById('config-gprs').classList.add('d-none');
                document.getElementById('config-terminal').classList.remove('d-none');
            } else {
                document.getElementById('config-gprs').classList.remove('d-none');
                document.getElementById('config-terminal').classList.add('d-none');
            }
        });
    });
</script>
@endpush
