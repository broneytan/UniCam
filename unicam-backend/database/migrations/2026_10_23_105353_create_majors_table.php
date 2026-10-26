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
        Schema::create('majors', function (Blueprint $table) {
            $table->id();
             // Link each major to its university
            $table->foreignId('university_id')
                ->constrained('universities')
                ->cascadeOnDelete();

            // Major information
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('tuition_fee', 12, 2)->nullable();
            $table->integer('duration_years')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('majors');
    }
};
