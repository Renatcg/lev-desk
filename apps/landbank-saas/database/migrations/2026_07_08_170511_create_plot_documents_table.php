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
        Schema::create('plot_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('land_plot_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('name');
            $table->string('path');
            $table->date('expires_at')->nullable();
            $table->string('status')->default('pending_review');
            $table->longText('ai_extracted_data')->nullable();
            $table->decimal('ai_confidence', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_documents');
    }
};
