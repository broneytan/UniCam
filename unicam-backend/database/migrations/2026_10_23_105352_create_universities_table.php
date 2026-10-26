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
        Schema::create('universities', function (Blueprint $table) {
            $table->id();
            // University basic information
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->text('description')->nullable();

            // Location and contact information
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            // Education and fees
            $table->string('university_type')->nullable();
            $table->decimal('tuition_fee', 12, 2)->nullable();

            // Replaceable image URL for university logo or photo
            $table->string('image_url')->nullable();

            // Publication status for the student app
            $table->boolean('is_active')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('universities');
    }
};
