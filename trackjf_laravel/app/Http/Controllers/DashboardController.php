<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Show the main dashboard
     */
    public function index()
    {
        $vehicles = Vehicle::all();
        return view('dashboard.index', compact('vehicles'));
    }

    /**
     * Show the live camera monitoring page
     */
    public function cameras()
    {
        // Get vehicles that have an associated MD300 IMEI
        $vehicles = Vehicle::whereNotNull('imei_md300')->get();
        
        return view('dashboard.cameras', compact('vehicles'));
    }

    /**
     * Show the Meitrack Manager configuration page
     */
    public function meitrack()
    {
        $vehicles = Vehicle::all();
        return view('dashboard.meitrack', compact('vehicles'));
    }

    /**
     * Show advanced telemetry data
     */
    public function telemetry()
    {
        return view('dashboard.telemetry');
    }
}
