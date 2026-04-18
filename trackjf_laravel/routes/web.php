<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SuperAdminController;

/*
|--------------------------------------------------------------------------
| TRACKJF - Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome'); // Landing page for sales
});

// Authentication Routes (Laravel Breeze/Fortify will handle these later)
Route::get('/login', function() { return view('auth.login'); })->name('login');

// Client Panel Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/cameras', [DashboardController::class, 'cameras'])->name('cameras');
    Route::get('/telemetry', [DashboardController::class, 'telemetry'])->name('telemetry');
});

// Super Admin Panel Routes (SaaS Management)
Route::prefix('super')->middleware(['auth', 'role:superadmin'])->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'index'])->name('super.dashboard');
    Route::get('/clients', [SuperAdminController::class, 'clients'])->name('super.clients');
    Route::get('/inventory', [SuperAdminController::class, 'inventory'])->name('super.inventory');
    Route::get('/contracts', [SuperAdminController::class, 'contracts'])->name('super.contracts');
});
