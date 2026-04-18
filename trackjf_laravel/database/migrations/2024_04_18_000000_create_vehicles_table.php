<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate')->unique();
            $table->string('imei')->unique();
            $table->string('imei_md300')->nullable();
            $table->string('model')->nullable();
            $table->foreignId('client_id')->constrained();
            $table->string('status')->default('parked');
            $table->decimal('last_lat', 10, 8)->nullable();
            $table->decimal('last_lng', 11, 8)->nullable();
            $table->integer('last_speed')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
