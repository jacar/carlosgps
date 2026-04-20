/**
 * TRACKJF - Real-time API Connector (Traccar/MD300)
 * Handles communication with the main GPS and Video servers.
 */

const API_CONFIG = {
    baseUrl: '/gpscarlos/traccar-proxy.php?endpoint=',
    refreshInterval: 15000,
};

class TrackjfAPI {
    constructor() {
        // Credenciales Reales del Servidor Traccar
        this.credentials = btoa('admin:admin'); 
        this.isConnecting = false;
        this.useSimulatedFallback = false;
        
        // Detectar si estamos en HTTPS para advertir sobre Contenido Mixto
        this.isSecure = window.location.protocol === 'https:';
        if (this.isSecure && API_CONFIG.baseUrl.startsWith('http:')) {
            console.warn('[API] Mixed Content Detected: Dashboard is HTTPS but API is HTTP. Map locations may not load.');
        }
    }

    setCredentials(user, pass) {
        this.credentials = btoa(`${user}:${pass}`);
    }

    async fetchDevices() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}devices`);
            if (!response.ok) throw new Error('Servidor GPS no disponible');
            return await response.json();
        } catch (error) {
            console.error('[API] Error al obtener dispositivos:', error);
            return null;
        }
    }

    async fetchPositions() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}positions`);
            if (!response.ok) throw new Error('No se pudieron obtener posiciones');
            return await response.json();
        } catch (error) {
            console.error('[API] Error al obtener posiciones:', error);
            return null;
        }
    }

    /**
     * Updates the global TRACKJF object with real data
     */
    async syncGlobalData() {
        if (!window.TRACKJF) return;

        const [positions, devices] = await Promise.all([
            this.fetchPositions(),
            this.fetchDevices()
        ]);

        if (!positions || !devices) {
            this.useSimulatedFallback = true;
            return;
        }

        this.useSimulatedFallback = false;

        // Crear mapa IMEI → posición usando el identificador único del dispositivo
        const deviceMap = {};
        devices.forEach(d => { deviceMap[d.id] = d.uniqueId; });

        positions.forEach(pos => {
            const imei = deviceMap[pos.deviceId] || '';
            const vehicle = window.TRACKJF.vehicles.find(
                v => v.imei === imei
            );
            if (vehicle) {
                vehicle.lat    = pos.latitude;
                vehicle.lng    = pos.longitude;
                vehicle.speed  = Math.round(pos.speed * 1.852); // nudos → km/h
                vehicle.status = pos.attributes?.ignition ? 'moving' : 'parked';
                if (vehicle.speed < 5 && !pos.attributes?.ignition) vehicle.status = 'parked';
                vehicle.address    = pos.address || vehicle.address;
                vehicle.lastSignal = new Date(pos.deviceTime).toLocaleString('es-VE');
            }
        });

        if (typeof window.refreshUIMap === 'function') window.refreshUIMap();
    }
}

window.T_API = new TrackjfAPI();
