<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         // Change these values before running the seeder.
        $email = 'qynn6c@unicam.local';
        $password = 'admin@123';

        // Create a new admin only if this email does not exist.
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'UniCam Admin',
                'password' => Hash::make($password),
                'role' => 'admin',
            ]
        );
        // Do not overwrite an existing user's password or role.
    }
}
