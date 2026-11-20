<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $orphanedMajors = DB::table('majors')
            ->leftJoin('universities', 'majors.university_id', '=', 'universities.id')
            ->whereNull('universities.id')
            ->count();

        if ($orphanedMajors > 0) {
            throw new RuntimeException(
                "Cannot add the university foreign key: {$orphanedMajors} major(s) reference a missing university."
            );
        }

        DB::statement('ALTER TABLE universities ENGINE=InnoDB');
        DB::statement('ALTER TABLE majors ENGINE=InnoDB');

        $foreignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'majors')
            ->where('COLUMN_NAME', 'university_id')
            ->where('REFERENCED_TABLE_NAME', 'universities')
            ->where('REFERENCED_COLUMN_NAME', 'id')
            ->first();

        if ($foreignKey) {
            $deleteRule = DB::table('information_schema.REFERENTIAL_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', 'majors')
                ->where('CONSTRAINT_NAME', $foreignKey->CONSTRAINT_NAME)
                ->value('DELETE_RULE');

            if ($deleteRule !== 'CASCADE') {
                throw new RuntimeException(
                    "The existing {$foreignKey->CONSTRAINT_NAME} constraint does not cascade on delete."
                );
            }
        } else {
            $indexExists = DB::table('information_schema.STATISTICS')
                ->where('TABLE_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', 'majors')
                ->where('INDEX_NAME', 'majors_university_id_foreign')
                ->exists();

            if ($indexExists) {
                DB::statement('ALTER TABLE majors DROP INDEX majors_university_id_foreign');
            }

            DB::statement(
                'ALTER TABLE majors ADD CONSTRAINT majors_university_id_foreign
                FOREIGN KEY (university_id) REFERENCES universities (id) ON DELETE CASCADE'
            );
        }
    }

    public function down(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $foreignKeyExists = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'majors')
            ->where('CONSTRAINT_NAME', 'majors_university_id_foreign')
            ->exists();

        if ($foreignKeyExists) {
            DB::statement('ALTER TABLE majors DROP FOREIGN KEY majors_university_id_foreign');
        }

        DB::statement('ALTER TABLE majors ENGINE=MyISAM');
        DB::statement('ALTER TABLE universities ENGINE=MyISAM');
    }
};
