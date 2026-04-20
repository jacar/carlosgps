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
     * Save technical configuration for a vehicle
     */
    public function saveTechData(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:vehicles,id',
            'imei' => 'required|string',
            'sim_number' => 'nullable|string',
            'sim_carrier' => 'nullable|string'
        ]);

        $vehicle = Vehicle::find($request->id);
        $vehicle->update([
            'imei' => $request->imei,
            'sim_number' => $request->sim_number,
            'sim_carrier' => $request->sim_carrier,
        ]);

        return response()->json(['success' => true, 'message' => 'Datos actualizados correctamente']);
    }

    /**
     * Delete a vehicle from the system
     */
    public function deleteVehicle($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicle->delete();
        return response()->json(['success' => true, 'message' => 'Vehículo eliminado']);
    }

    /**
     * Show advanced telemetry data
     */
    public function telemetry()
    {
        return view('dashboard.telemetry');
    }
}
