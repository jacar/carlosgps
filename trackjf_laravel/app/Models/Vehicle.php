<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate',
        'imei',
        'imei_md300', // Specialized for Meitrack MD300
        'brand',
        'model',
        'client_id',
        'status',
        'last_lat',
        'last_lng',
        'last_speed'
    ];

    /**
     * Relationship with Client
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Gets the real-time video stream URL based on Meitrack logic
     */
    public function getVideoStreamUrl($channel = 1)
    {
        if (empty($this->imei_md300)) return null;
        
        // This would connect to your Carlos Tracking gateway (66.97.42.27)
        return "http://66.97.42.27:6100/live/hls/{$this->imei_md300}_{$channel}.m3u8";
    }
}
