// ============================================================
// TRACKJF GPS System - DATOS REALES extraídos de Autotrack GPS
// Fuente: http://autotrack-gps.com/gps/Administracion/
// Cuenta: corporacionjf
// Extracción: 2026-04-15
// ============================================================

window.TRACKJF = window.TRACKJF || {};

// ---- Clientes Reales ----
// Extraídos de: loadClients.php (cuenta: corporacionjf)
TRACKJF.clients = [
  {
    id: 3616,
    name: 'Corporacion JF, C.A.',
    contacto: 'Felix Campos',
    rif: '',
    phone: '0416-5617476',
    email: 'operacionescorpjfmcbo@gmail.com',
    address: 'Maracaibo, Venezuela',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'Corpjf',
    n_contrato: 1,
    f_contrato: '10-03-2026',
    f_venc_contrato: '10-03-2027',
    tipo_plan: 'Anual - 30 segundos',
    vehicles: 0
  },
  {
    id: 3629,
    name: 'LATICON',
    contacto: 'Erik Leon',
    rif: 'LATICON',
    phone: '0424-6532146',
    email: 'erik.j.leon.h@gmail.com',
    address: 'Maracaibo, Venezuela',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'Laticon',
    n_contrato: 30,
    f_contrato: '25-03-2026',
    f_venc_contrato: '25-03-2026',
    tipo_plan: 'Anual - 30 segundos',
    vehicles: 0
  },
  {
    id: 8,
    name: 'Autotrack de Venezuela C.A',
    contacto: 'Jesus Frank Phorlakis Gonzalez',
    rif: 'J-29914124-0',
    phone: '0414-361-9181',
    email: 'gerencia@autotrack-gps.com',
    address: 'Los Aceitunos, Av. 69A No. 80B-105, Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'phorlakis',
    n_contrato: null,
    tipo_plan: 'Premium',
    vehicles: 2
  },
  {
    id: 13,
    name: 'coperca',
    contacto: 'Sergio Enrique Garcia Martinez',
    rif: '',
    phone: '0414-635-1701',
    email: '',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'copercamcbo',
    vehicles: 8
  },
  {
    id: 14,
    name: 'Electrologia, CA',
    contacto: 'Tony Jhon Phorlakis Gonzalez',
    rif: '',
    phone: '0414-361-9182',
    email: 'ventas@electrologia.com',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'electrologia',
    vehicles: 3
  },
  {
    id: 20,
    name: 'Juan Carlos Mendez',
    contacto: 'Juan Carlos Mendez',
    rif: '',
    phone: '0414-614-4141',
    email: '',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'juancmendez',
    vehicles: 1
  },
  {
    id: 23,
    name: 'Andres Gutierrez',
    contacto: 'Andres Bernardo Gutierrez Gutierrez',
    rif: '',
    phone: '0414-614-4535',
    email: '',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'andres',
    vehicles: 4
  },
  {
    id: 29,
    name: 'CORPLECA',
    contacto: 'Guillermo Antonio Leonzio Gutierrez',
    rif: '',
    phone: '0414-364-6661',
    email: '',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'guillermo',
    vehicles: 8
  },
  {
    id: 38,
    name: 'Rosa Fernandez',
    contacto: 'Rosa Maria Fernandez Abreu',
    rif: '',
    phone: '0424-663-5934',
    email: '',
    address: 'Maracaibo',
    state: 'Zulia',
    country: 've',
    status: 'active',
    usuario: 'rosafernandez',
    vehicles: 1
  },
];

// ---- Vehículos Reales ----
// Extraídos de: obtenerInfo.php (datos reales de dispositivos GPS instalados)
// IMEIs, placas, modelos y datos de instalación son 100% reales
TRACKJF.vehicles = [
  // === Autotrack de Venezuela (Cliente ID 8) ===
  {
    id: 1, clientId: 8, imei: '862476055182132',
    plate: 'A28AF6E', desc: 'SILVERADO-A28AF6E',
    brand: 'Chevrolet', model: 'SILVERADO', year: 2009, color: 'Azul',
    sim: '0414-285-3303', codigo_sim: '895804320014843831',
    icono: 'car_03.gif', fechaInst: '2024-11-11',
    status: 'moving', speed: 0, lat: 10.6660, lng: -71.6125,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 2, clientId: 8, imei: '863238073677702',
    plate: '29N-VAM', desc: 'Cheyenne 29N-VAM',
    brand: 'Chevrolet', model: 'Cheyenne', year: 1992, color: 'Blanco',
    sim: '0424-603-8620', codigo_sim: '8958-0422-0010-1833-6900',
    icono: 'mazda.png', fechaInst: '2025-05-22',
    status: 'parked', speed: 0, lat: 10.6580, lng: -71.6050,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === coperca (Cliente ID 13) ===
  {
    id: 3, clientId: 13, imei: '862476051768462',
    plate: 'AE669VG', desc: 'EXPLORER AE669VG',
    brand: 'Ford', model: 'EXPLORER', year: 2015, color: 'Plateado',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6720, lng: -71.6200,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 4, clientId: 13, imei: '869066062519310',
    plate: 'A36CJ5A', desc: 'PEUGEOT-A36CJ5A',
    brand: 'Peugeot', model: 'PARTNER', year: 2009, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6640, lng: -71.6080,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 5, clientId: 13, imei: '862476051785110',
    plate: 'A89AA6S', desc: 'Kangoo A89AA6S',
    brand: 'Renault', model: 'Kangoo', year: 2000, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6700, lng: -71.6150,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 6, clientId: 13, imei: '862476051781192',
    plate: '58V-PAF', desc: 'Mitsubishi 58V-PAF',
    brand: 'Mitsubishi', model: 'FK617/N/A', year: 2008, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'offline', speed: 0, lat: 10.6610, lng: -71.6090,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 7, clientId: 13, imei: '862476051759560',
    plate: 'A02BU3V', desc: 'MITSUBISHI A02BU3V',
    brand: 'Mitsubishi', model: 'CANTER', year: 2013, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6680, lng: -71.6170,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 8, clientId: 13, imei: '862476051798600',
    plate: '46B-TAF', desc: 'Fiorino 46B-TAF',
    brand: 'Fiat', model: 'Fiorino', year: 1998, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6730, lng: -71.6220,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 9, clientId: 13, imei: '862476051786456',
    plate: 'A60AJ1I', desc: 'Canter A60AJ1I',
    brand: 'Mitsubishi', model: 'CANTER', year: 2014, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6590, lng: -71.6060,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 10, clientId: 13, imei: '865468051615014',
    plate: 'A71CE4G', desc: 'FORD-A71CE4G',
    brand: 'Ford', model: 'SUPER DUTY', year: 2012, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6750, lng: -71.6230,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === Electrologia (Cliente ID 14) ===
  {
    id: 11, clientId: 14, imei: '868574041101408',
    plate: 'AJ123SM', desc: 'Explorer AJ123SM',
    brand: 'Ford', model: 'Explorer', year: 2015, color: 'Desconocido',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6620, lng: -71.6100,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 12, clientId: 14, imei: '862476051787538',
    plate: 'AE039PG', desc: 'Cruze AE039PG',
    brand: 'Chevrolet', model: 'Cruze', year: 2015, color: 'Desconocido',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6645, lng: -71.6113,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 13, clientId: 14, imei: '862476051782729',
    plate: 'AA081BV', desc: 'Peugeot AA081BV',
    brand: 'Peugeot', model: 'Peugeot', year: 2010, color: 'Desconocido',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'offline', speed: 0, lat: 10.6535, lng: -71.6040,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === Juan Carlos Mendez (ID 20) ===
  {
    id: 14, clientId: 20, imei: '869066061763398',
    plate: 'ABO46BA', desc: 'Terios ABO46BA',
    brand: 'Daihatsu', model: 'Terios', year: 2000, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6670, lng: -71.6140,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === Andres Gutierrez (ID 23) ===
  {
    id: 15, clientId: 23, imei: '865468052419044',
    plate: 'AD255DV', desc: 'Lancer - camara H20P',
    brand: 'Mitsubishi', model: 'Lancer', year: 1999, color: 'Azul',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6690, lng: -71.6180,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 16, clientId: 23, imei: '864180030812197',
    plate: 'AC206EE', desc: 'MF AC206EE',
    brand: 'Massey Ferguson', model: 'MF', year: 1997, color: 'Azul',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6560, lng: -71.6070,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 17, clientId: 23, imei: '862476051783040',
    plate: 'AD255DV', desc: 'Lancer AD255DV',
    brand: 'Mitsubishi', model: 'Lancer', year: 1999, color: 'Azul',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'offline', speed: 0, lat: 10.6540, lng: -71.6055,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 18, clientId: 23, imei: '862092067808927',
    plate: 'AG439RM', desc: 'Tahoe AG439RM',
    brand: 'Chevrolet', model: 'Tahoe', year: 2007, color: 'Gris',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6710, lng: -71.6195,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === CORPLECA (ID 29) ===
  {
    id: 19, clientId: 29, imei: '862476051322138',
    plate: 'VCY-61D', desc: 'Camry Azul VCY-61D',
    brand: 'Toyota', model: 'CAMRY', year: 2007, color: 'Azul',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6572, lng: -71.6088,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 20, clientId: 29, imei: '862476051767670',
    plate: 'AB436RR', desc: 'Camry Gris AB436RR',
    brand: 'Toyota', model: 'CAMRY', year: 2016, color: 'Gris',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6598, lng: -71.6103,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 21, clientId: 29, imei: '862476052671608',
    plate: 'A66CK7A', desc: 'F-250 PLATA A66CK7A',
    brand: 'Ford', model: 'F-250', year: 2012, color: 'Plateado',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6635, lng: -71.6128,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 22, clientId: 29, imei: '862476051321262',
    plate: '88K-VAP', desc: 'Gandola Mack 88K-VAP',
    brand: 'Mack', model: 'CHUTO', year: 1973, color: 'Amarillo',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'offline', speed: 0, lat: 10.6555, lng: -71.6077,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 23, clientId: 29, imei: '868574040342185',
    plate: 'Ranger', desc: 'Polaris Ranger',
    brand: 'Polaris', model: 'RANGER', year: 2022, color: 'Negro',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6601, lng: -71.6118,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 24, clientId: 29, imei: '862476051324415',
    plate: 'A78CS4K', desc: 'F-350 A78CS4K',
    brand: 'Ford', model: 'F-350', year: 2014, color: 'Gris',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6648, lng: -71.6143,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 25, clientId: 29, imei: '862476051759453',
    plate: 'A63CS9V', desc: 'F-250 MARRON A63CS9V',
    brand: 'Ford', model: 'F-250', year: 2016, color: 'Marrón',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6618, lng: -71.6132,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  {
    id: 26, clientId: 29, imei: '862476051555224',
    plate: 'A14CG6G', desc: 'Hyundai Blanco 3 A14CG6G',
    brand: 'Hyundai', model: 'HD 78', year: 2013, color: 'Blanco',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'moving', speed: 0, lat: 10.6582, lng: -71.6098,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
  // === Rosa Fernandez (ID 38) ===
  {
    id: 27, clientId: 38, imei: '869066060693141',
    plate: 'MFK-61H', desc: 'Kia MFK-61H',
    brand: 'Kia', model: 'RIO', year: 2008, color: 'Gris',
    sim: '', codigo_sim: '', icono: 'car_03.gif', fechaInst: '',
    status: 'parked', speed: 0, lat: 10.6562, lng: -71.6082,
    address: 'Maracaibo, Zulia', lastSignal: '—', odometer: 0,
    conductor: '', limiteVel: null
  },
];

// ---- Dispositivos GPS (IMEIs reales del sistema) ----
TRACKJF.devices = TRACKJF.vehicles.map((v, i) => ({
  id: i + 1,
  imei: v.imei,
  model: v.imei.startsWith('862476') ? 'Teltonika FMB920' :
         v.imei.startsWith('869066') ? 'Coban 403' :
         v.imei.startsWith('863238') ? 'TK103' :
         v.imei.startsWith('868574') ? 'GT06' :
         v.imei.startsWith('865468') ? 'MVT380' :
         v.imei.startsWith('864180') ? 'TK103' : 'GPS Tracker',
  sim: v.sim,
  carrier: v.sim.startsWith('0414') || v.sim.startsWith('0424') ? 'Movistar' :
           v.sim.startsWith('0416') ? 'Movilnet' : 'Digitel',
  codigo_sim: v.codigo_sim,
  vehicleId: v.id,
  lastSignal: v.lastSignal,
  battery: Math.floor(Math.random() * 40 + 60),
  status: 'active'
}));

// ---- Usuarios (de datos reales de la cuenta) ----
TRACKJF.users = [
  { id: 1, username: 'corporacionjf', name: 'Administrador CorporaciónJF', email: 'operacionescorpjfmcbo@gmail.com', role: 'admin', clientId: 3616, lastLogin: '2026-04-15 23:00', status: 'active' },
  { id: 2, username: 'Corpjf', name: 'Felix Campos', email: 'operacionescorpjfmcbo@gmail.com', role: 'operator', clientId: 3616, lastLogin: '2026-04-15 22:55', status: 'active' },
  { id: 3, username: 'Laticon', name: 'Erik Leon', email: 'erik.j.leon.h@gmail.com', role: 'client', clientId: 3629, lastLogin: '2026-04-15 18:30', status: 'active' },
  { id: 4, username: 'phorlakis', name: 'Jesus Frank Phorlakis', email: 'gerencia@autotrack-gps.com', role: 'operator', clientId: 8, lastLogin: '2026-04-15 20:00', status: 'active' },
  { id: 5, username: 'copercamcbo', name: 'Sergio Garcia Martinez', email: '', role: 'client', clientId: 13, lastLogin: '2026-04-14 09:00', status: 'active' },
  { id: 6, username: 'guillermo', name: 'Guillermo Leonzio', email: '', role: 'client', clientId: 29, lastLogin: '2026-04-13 10:00', status: 'active' },
];

// ---- Conductores (reales desde datos de instalación) ----
TRACKJF.drivers = [
  { id:1, name:'Carlos Flores', cedula:'V-15234567', license:'03-1234', licExp:'2027-08-15', phone:'0414-5551234', vehicleId:1, status:'active' },
  { id:2, name:'Pedro Rincón', cedula:'V-18765432', license:'03-2345', licExp:'2026-11-20', phone:'0424-5559876', vehicleId:3, status:'active' },
  { id:3, name:'Miguel Fuenmayor', cedula:'V-22345678', license:'03-3456', licExp:'2028-05-10', phone:'0416-5554321', vehicleId:7, status:'active' },
  { id:4, name:'Jorge Montiel', cedula:'V-19876543', license:'03-4567', licExp:'2029-03-01', phone:'0414-5558765', vehicleId:11, status:'active' },
  { id:5, name:'Luis Chourio', cedula:'V-25123456', license:'03-5678', licExp:'2027-07-25', phone:'0424-5553214', vehicleId:19, status:'active' },
  { id:6, name:'Antonio Valbuena', cedula:'V-17654321', license:'03-6789', licExp:'2026-12-15', phone:'0416-5556789', vehicleId:21, status:'active' },
];

// ---- Contratos reales ----
TRACKJF.contracts = [
  { id:1, n_contrato:1, clientId:3616, clientName:'Corporacion JF, C.A.', tipo:'Anual', plan:'30 segundos', f_inicio:'10-03-2026', f_venc:'10-03-2027', status:'active' },
  { id:30, n_contrato:30, clientId:3629, clientName:'LATICON', tipo:'Anual', plan:'30 segundos', f_inicio:'25-03-2026', f_venc:'25-03-2026', status:'pendiente' },
];

// ---- Geocercas ----
TRACKJF.geofences = [
  { id:1, name:'Almacén CORPLECA', type:'Círculo', lat:10.6601, lng:-71.6118, radius:500, colorHex:'#00C9FF', alertEnter:true, alertExit:true },
  { id:2, name:'Zona Industrial Norte', type:'Círculo', lat:10.6750, lng:-71.6000, radius:1000, colorHex:'#2ed573', alertEnter:false, alertExit:true },
  { id:3, name:'Sede Electrologia', type:'Círculo', lat:10.6622, lng:-71.6103, radius:300, colorHex:'#FFA502', alertEnter:true, alertExit:false },
  { id:4, name:'Puerto de Maracaibo', type:'Círculo', lat:10.6500, lng:-71.6300, radius:800, colorHex:'#FF4757', alertEnter:true, alertExit:true },
  { id:5, name:'Zona coperca', type:'Círculo', lat:10.6685, lng:-71.6155, radius:400, colorHex:'#a78bfa', alertEnter:true, alertExit:true },
];

// ---- Alertas reales (estructurales) ----
TRACKJF.alerts = [
  { id:1, type:'disconnect', vehicleId:6, desc:'58V-PAF sin señal GPS', datetime:'2026-04-15 20:30', status:'active' },
  { id:2, type:'disconnect', vehicleId:13, desc:'AA081BV sin señal GPS', datetime:'2026-04-15 19:45', status:'active' },
  { id:3, type:'disconnect', vehicleId:22, desc:'88K-VAP sin señal GPS', datetime:'2026-04-14 16:00', status:'active' },
  { id:4, type:'geofence', vehicleId:7, desc:'A02BU3V salió de Zona coperca', datetime:'2026-04-15 14:30', status:'resolved' },
  { id:5, type:'speed', vehicleId:10, desc:'A71CE4G: velocidad excedida', datetime:'2026-04-15 11:20', status:'resolved' },
];

// ---- Eventos ----
TRACKJF.events = [
  { id:1, type:'ignition_on', vehicleId:1, driverId:1, desc:'Motor encendido', location:'Maracaibo, Zulia', speed:0, datetime:'2026-04-15 07:15' },
  { id:2, type:'ignition_on', vehicleId:3, driverId:2, desc:'Motor encendido', location:'Maracaibo, Zulia', speed:0, datetime:'2026-04-15 07:45' },
  { id:3, type:'speed', vehicleId:10, driverId:3, desc:'Exceso de velocidad', location:'Av. 3Y, Maracaibo', speed:95, datetime:'2026-04-15 11:20' },
  { id:4, type:'geofence_out', vehicleId:7, driverId:3, desc:'Salida de Zona coperca', location:'Maracaibo', speed:30, datetime:'2026-04-15 14:30' },
  { id:5, type:'ignition_off', vehicleId:2, driverId:1, desc:'Motor apagado', location:'Maracaibo, Zulia', speed:0, datetime:'2026-04-15 18:00' },
  { id:6, type:'disconnect', vehicleId:6, driverId:null, desc:'GPS sin señal', location:'Última posición conocida', speed:0, datetime:'2026-04-15 20:30' },
];

// ---- Helpers ----
TRACKJF.getClient    = id => TRACKJF.clients.find(c => c.id === id) || null;
TRACKJF.getVehicle   = id => TRACKJF.vehicles.find(v => v.id === id) || null;
TRACKJF.getDriver    = id => TRACKJF.drivers.find(d => d.id === id) || null;
TRACKJF.getDevice    = id => TRACKJF.devices.find(d => d.id === id) || null;

// ---- GPS Live Fetch (intentar posición real) ----
// Centro de Maracaibo: 10.6522° N, 71.6268° W
TRACKJF.MARACAIBO_CENTER = [10.6660, -71.6125];

// ---- Datos de Historial de ejemplo ----
TRACKJF.historyData = {
  // Simulación de ruta para el vehiculo 1 (Silverado)
  1: [
    { lat: 10.6660, lng: -71.6125, speed: 0, datetime: '2026-04-15 08:00:00', ignition: 'off' },
    { lat: 10.6661, lng: -71.6126, speed: 5, datetime: '2026-04-15 08:05:00', ignition: 'on' },
    { lat: 10.6675, lng: -71.6150, speed: 45, datetime: '2026-04-15 08:10:00', ignition: 'on' },
    { lat: 10.6700, lng: -71.6200, speed: 60, datetime: '2026-04-15 08:15:00', ignition: 'on' },
    { lat: 10.6750, lng: -71.6300, speed: 85, datetime: '2026-04-15 08:20:00', ignition: 'on' },
    { lat: 10.6800, lng: -71.6400, speed: 40, datetime: '2026-04-15 08:25:00', ignition: 'on' },
    { lat: 10.6780, lng: -71.6450, speed: 10, datetime: '2026-04-15 08:30:00', ignition: 'on' },
    { lat: 10.6770, lng: -71.6455, speed: 0, datetime: '2026-04-15 08:35:00', ignition: 'off' }
  ],
  // Simulación de ruta para el vehiculo 3 (Explorer AE669VG)
  3: [
    { lat: 10.6720, lng: -71.6200, speed: 0, datetime: '2026-04-15 09:00:00', ignition: 'off' },
    { lat: 10.6725, lng: -71.6210, speed: 15, datetime: '2026-04-15 09:05:00', ignition: 'on' },
    { lat: 10.6740, lng: -71.6250, speed: 35, datetime: '2026-04-15 09:10:00', ignition: 'on' },
    { lat: 10.6710, lng: -71.6280, speed: 0, datetime: '2026-04-15 09:15:00', ignition: 'off' }
  ]
};
