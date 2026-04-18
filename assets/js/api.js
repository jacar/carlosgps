/**
 * TRACKJF - Real-time API Connector (Traccar/MD300)
 * Handles communication with the main GPS and Video servers.
 */

const API_CONFIG = {
    baseUrl: 'http://66.97.42.27:8082/api',
    refreshInterval: 15000, // 15 seconds
};

class TrackjfAPI {
    constructor() {
        this.credentials = btoa('admin:admin'); // Default, user should override
        this.isConnecting = false;
        this.useSimulatedFallback = false;
    }

    setCredentials(user, pass) {
        this.credentials = btoa(`${user}:${pass}`);
    }

    async fetchDevices() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/devices`, {
                headers: { 'Authorization': `Basic ${this.credentials}` }
            });
            if (!response.ok) throw new Error('Authentication failed or server unreachable');
            return await response.json();
        } catch (error) {
            console.error('[API] Error fetching devices:', error);
            return null;
        }
    }

    async fetchPositions() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/positions`, {
                headers: { 'Authorization': `Basic ${this.credentials}` }
            });
            if (!response.ok) throw new Error('Failed to fetch positions');
            return await response.json();
        } catch (error) {
            console.error('[API] Error fetching positions:', error);
            return null;
        }
    }

    /**
     * Updates the global TRACKJF object with real data
     */
    async syncGlobalData() {
        if (!window.TRACKJF) return;

        const positions = await this.fetchPositions();
        if (!positions) return;

        positions.forEach(pos => {
            const vehicle = window.TRACKJF.vehicles.find(v => v.imei === pos.deviceId.toString() || v.imei === pos.attributes.uniqueId);
            if (vehicle) {
                vehicle.lat = pos.latitude;
                vehicle.lng = pos.longitude;
                vehicle.speed = Math.floor(pos.speed * 1.852); // Convert knots to km/h
                vehicle.status = pos.attributes.ignition ? 'moving' : 'parked';
                if (vehicle.speed < 5 && !pos.attributes.ignition) vehicle.status = 'parked';
                vehicle.address = pos.address || vehicle.address;
                vehicle.lastSignal = new Date(pos.deviceTime).toLocaleString();
            }
        });

        // Trigger UI update if function exists
        if (typeof window.refreshUIMap === 'function') window.refreshUIMap();
    }
}

window.T_API = new TrackjfAPI();
