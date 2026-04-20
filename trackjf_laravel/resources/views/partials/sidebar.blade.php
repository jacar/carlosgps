<aside class="sidebar bg-black border-end border-secondary" style="width: 250px; min-height: 100vh;">
    <div class="p-4 border-bottom border-secondary">
        <h3 class="text-accent fw-bold mb-0">TRACKJF <span class="text-white">PRO</span></h3>
    </div>
    <nav class="p-2">
        <a href="{{ route('dashboard') }}" class="nav-link text-white p-3 mb-1 {{ request()->routeIs('dashboard') ? 'bg-primary' : '' }}">
            🏠 Dashboard
        </a>
        <a href="{{ route('cameras') }}" class="nav-link text-white p-3 mb-1 {{ request()->routeIs('cameras') ? 'bg-primary' : '' }}">
            📷 Cámaras en Vivo
        </a>
        <a href="{{ route('meitrack') }}" class="nav-link text-white p-3 mb-1 {{ request()->routeIs('meitrack') ? 'bg-primary' : '' }}">
            🛠️ Meitrack Manager
        </a>
        <a href="{{ route('telemetry') }}" class="nav-link text-white p-3 mb-1 {{ request()->routeIs('telemetry') ? 'bg-primary' : '' }}">
            📊 Telemetría
        </a>
        <div class="mt-4 p-3 small text-muted text-uppercase">Administración</div>
        <a href="#" class="nav-link text-white-50 p-3 mb-1">
            🚐 Vehículos
        </a>
        <a href="#" class="nav-link text-white-50 p-3 mb-1">
            👥 Clientes
        </a>
    </nav>
</aside>

<style>
    .nav-link { border-radius: 8px; display: block; text-decoration: none; transition: 0.2s; }
    .nav-link:hover { background: rgba(0, 201, 255, 0.1); color: var(--accent); }
    .text-accent { color: #00c9ff; }
</style>
