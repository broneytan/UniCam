<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_log_in_and_receive_a_token(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@unicam.test',
            'password' => 'test-password',
        ]);
        $admin->forceFill(['role' => 'admin'])->save();

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@unicam.test',
            'password' => 'test-password',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJsonPath('user.id', $admin->id)
            ->assertJsonPath('user.role', 'admin');

        $this->assertNotEmpty($response->json('token'));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $admin->id,
            'name' => 'unicam-admin',
        ]);
    }

    public function test_student_login_is_rejected_with_422(): void
    {
        User::factory()->create([
            'email' => 'student@unicam.test',
            'password' => 'test-password',
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'student@unicam.test',
            'password' => 'test-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
