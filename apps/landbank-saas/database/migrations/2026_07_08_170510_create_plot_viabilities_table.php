<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plot_viabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('land_plot_id')->constrained()->cascadeOnDelete();
            $table->string('project_name')->nullable();
            $table->decimal('land_value', 14, 2)->nullable();
            $table->decimal('vgv', 14, 2)->nullable();
            $table->unsignedInteger('units_count')->nullable();
            $table->string('standard')->nullable();
            $table->date('launch_month')->nullable();
            $table->decimal('sellable_area_sqm', 14, 2)->nullable();
            $table->text('assumptions')->nullable();
            $table->longText('ai_extracted_viability')->nullable();
            $table->decimal('ai_confidence', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_viabilities');
    }
};
