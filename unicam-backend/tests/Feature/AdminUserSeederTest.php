<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class AdminUserSeederTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_database_seeder_creates_admin_from_configuration(): void
    {
        $this->configureAdmin();

        $this->seed(DatabaseSeeder::class);

        $admin = User::query()->where('email', 'admin@unicam.test')->firstOrFail();

        $this->assertSame('admin', $admin->role);
        $this->assertTrue(Hash::check('a-long-test-password', $admin->password));
    }

    public function test_admin_seeder_preserves_existing_admin_credentials(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@unicam.test',
            'password' => 'original-test-password',
        ]);
        $admin->forceFill(['role' => 'admin'])->save();
        $this->configureAdmin();
        config()->set('unicam.admin.password', 'replacement-test-password');

        $this->seed(AdminUserSeeder::class);

        $admin->refresh();
        $this->assertTrue(Hash::check('original-test-password', $admin->password));
        $this->assertFalse(Hash::check('replacement-test-password', $admin->password));
    }

    public function test_admin_seeder_requires_an_email_and_password(): void
    {
        config()->set('unicam.admin.email', null);
        config()->set('unicam.admin.password', null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Set UNICAM_ADMIN_EMAIL and UNICAM_ADMIN_PASSWORD before seeding the database.'
        );

        $this->seed(AdminUserSeeder::class);
    }

    public function test_admin_seeder_does_not_promote_an_existing_student(): void
    {
        User::factory()->create(['email' => 'admin@unicam.test']);
        $this->configureAdmin();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'The configured admin email already belongs to a non-admin user.'
        );

        $this->seed(AdminUserSeeder::class);
    }

    private function configureAdmin(): void
    {
        config()->set('unicam.admin.name', 'UniCam Test Admin');
        config()->set('unicam.admin.email', 'admin@unicam.test');
        config()->set('unicam.admin.password', 'a-long-test-password');
    }
}
