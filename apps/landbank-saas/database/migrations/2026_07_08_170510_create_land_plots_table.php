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
        Schema::create('land_plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('prospecting');
            $table->string('registry_number')->nullable();
            $table->decimal('area_sqm', 14, 2)->nullable();
            $table->string('owner_name')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('street')->nullable();
            $table->string('number')->nullable();
            $table->string('district')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();
            $table->decimal('latitude', 11, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->json('perimeter')->nullable();
            $table->date('iptu_due_date')->nullable();
            $table->decimal('known_debt_amount', 14, 2)->nullable();
            $table->text('known_debt_notes')->nullable();
            $table->longText('ai_extracted_registry')->nullable();
            $table->decimal('ai_confidence', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('land_plots');
    }
};
