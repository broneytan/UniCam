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
        $missingColumns = array_values(array_filter(
            ['created_at', 'updated_at'],
            fn (string $column): bool => ! Schema::hasColumn('universities', $column),
        ));

        if ($missingColumns === []) {
            return;
        }

        Schema::table('universities', function (Blueprint $table) use ($missingColumns) {
            foreach ($missingColumns as $column) {
                $table->timestamp($column)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Existing databases may have owned these columns before this migration.
    }
};
