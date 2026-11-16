<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $name = config('unicam.admin.name') ?: 'UniCam Admin';
        $email = config('unicam.admin.email');
        $password = config('unicam.admin.password');

        if (blank($email) || blank($password)) {
            throw new RuntimeException(
                'Set UNICAM_ADMIN_EMAIL and UNICAM_ADMIN_PASSWORD before seeding the database.'
            );
        }

        $user = User::query()->firstOrNew(['email' => $email]);

        if ($user->exists) {
            if ($user->role !== 'admin') {
                throw new RuntimeException(
                    'The configured admin email already belongs to a non-admin user.'
                );
            }

            return;
        }

        $user->name = $name;
        $user->password = $password;
        $user->role = 'admin';
        $user->save();
    }
}
