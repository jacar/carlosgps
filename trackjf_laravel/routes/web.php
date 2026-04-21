<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SuperAdminController;

/*
|--------------------------------------------------------------------------
| TRACKJF - Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function() { return view('auth.login'); })->name('login');

// -------------------------------------------------------------------------
// GPS PROXY — Sin autenticación para que el dashboard HTML pueda usarlo
// Soluciona el bloqueo de Mixed Content (HTTPS → HTTP)
// El servidor cPanel hace la petición a Traccar en http://localhost:8082
// -------------------------------------------------------------------------
Route::get('/gps-proxy', function (Request $request) {
    $endpoint = $request->query('endpoint', 'positions');

    $allowed = ['positions', 'devices', 'events'];
    if (!in_array($endpoint, $allowed)) {
        return response()->json(['error' => 'Endpoint no permitido'], 400);
    }

    // Intentar conectar con los servidores configurados
    $hosts = [
        'https://demo3.traccar.org',
        'http://15.235.82.117:8082'
    ];
    $response = null;

    foreach ($hosts as $host) {
        $url = $host . '/api/' . $endpoint;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_USERPWD        => 'webcincodev@gmail.com:Forastero938',
            CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);

        $body  = curl_exec($ch);
        $code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if (!$error && $code === 200) {
            $response = $body;
            break;
        }
    }

    if (!$response) {
        return response()->json([
            'error'  => 'No se pudo conectar al servidor GPS',
            'server' => '15.235.82.117:8082'
        ], 503);
    }

    return response($response, 200)
        ->header('Content-Type', 'application/json')
        ->header('Access-Control-Allow-Origin', '*');
});

// Client Panel Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/cameras', [DashboardController::class, 'cameras'])->name('cameras');
    // Panel de Gestión Meitrack
    Route::get('/meitrack', [DashboardController::class, 'meitrack'])->name('meitrack');
    Route::post('/vehicle/save-tech', [DashboardController::class, 'saveTechData'])->name('vehicle.save-tech');
    Route::post('/vehicle/delete/{id}', [DashboardController::class, 'deleteVehicle'])->name('vehicle.delete');
    Route::get('/telemetry', [DashboardController::class, 'telemetry'])->name('telemetry');
});

// Super Admin Panel Routes (SaaS Management)
Route::prefix('super')->middleware(['auth', 'role:superadmin'])->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'index'])->name('super.dashboard');
    Route::get('/clients', [SuperAdminController::class, 'clients'])->name('super.clients');
    Route::get('/inventory', [SuperAdminController::class, 'inventory'])->name('super.inventory');
    Route::get('/contracts', [SuperAdminController::class, 'contracts'])->name('super.contracts');
});
