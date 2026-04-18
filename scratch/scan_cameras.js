const net = require('net');

const subnet = '192.168.159';
const ports = [554, 80, 8080, 8554, 5000];
const timeout = 200;

console.log(`Escaneando subred ${subnet}.x en los puertos ${ports.join(', ')}...`);

async function scan() {
  const found = [];
  for (let i = 1; i < 255; i++) {
    const ip = `${subnet}.${i}`;
    const promises = ports.map(port => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
          console.log(`[+] Encontrado dispositivo: ${ip}:${port}`);
          found.push({ip, port});
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => { socket.destroy(); resolve(); });
        socket.on('error', () => { socket.destroy(); resolve(); });
        socket.connect(port, ip);
      });
    });
    await Promise.all(promises);
  }
  console.log('\n--- Escaneo Finalizado ---');
  if (found.length === 0) {
    console.log('No se detectaron cámaras abiertas en los puertos estándar.');
  } else {
    console.log(`Se encontraron ${found.length} posibles dispositivos de video:`);
    found.forEach(f => console.log(`- http://${f.ip}:${f.port} o rtsp://${f.ip}:${f.port}`));
  }
}

scan();
