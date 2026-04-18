const { spawn } = require('child_process');

function startTunnel() {
  console.log('--- Iniciando Conexión del Túnel (TrackJF) ---');
  // Usamos subdomain fijo para que tu URL nunca cambie, si está disponible.
  const tunnelProcess = spawn('npx.cmd', ['--yes', 'localtunnel', '--port', '5173', '--subdomain', 'trackjf-pro-demo'], { stdio: 'pipe', shell: true });

  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
  });

  tunnelProcess.stderr.on('data', (data) => {
    console.error(`Error del túnel: ${data}`);
  });

  tunnelProcess.on('close', (code) => {
    console.log(`El túnel se desconectó inesperadamente (Código ${code}). Reconectando automáticamente en 5 segundos...`);
    setTimeout(startTunnel, 5000);
  });

  tunnelProcess.on('error', (err) => {
    console.error('Error al intentar abrir el túnel:', err);
  });
}

startTunnel();
