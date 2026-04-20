<header class="header bg-dark p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
    <div class="search-box">
        <input type="text" class="form-control bg-black border-secondary text-white" placeholder="Buscar vehículo o IMEI...">
    </div>
    <div class="user-profile d-flex align-items-center gap-3">
        <div class="text-end">
            <div class="fw-bold">{{ Auth::user()->name ?? 'Administrador' }}</div>
            <small class="text-muted">Gestor de Flota</small>
        </div>
        <div class="avatar bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
            {{ strtoupper(substr(Auth::user()->name ?? 'A', 0, 1)) }}
        </div>
    </div>
</header>
