<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_search_students_by_name_or_email(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        Sanctum::actingAs($admin);

        User::factory()->create([
            'name' => 'Ada Student',
            'email' => 'ada@university.test',
        ]);
        User::factory()->create([
            'name' => 'Grace',
            'email' => 'hopper@university.test',
        ]);

        $allStudents = $this->getJson('/api/admin/students')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->assertArrayNotHasKey('password', $allStudents->json('data.0'));
        $this->assertArrayNotHasKey('remember_token', $allStudents->json('data.0'));

        $this->getJson('/api/admin/students?search=Ada')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ada Student');

        $this->getJson('/api/admin/students?search=hopper%40university.test')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Grace');
    }

    public function test_admin_can_paginate_students(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        User::factory()->count(11)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/students?page=2')
            ->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_view_a_student_profile_but_not_an_admin_profile(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $student = User::factory()->create(['email' => 'student@university.test']);
        Sanctum::actingAs($admin);

        $this->getJson("/api/admin/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('id', $student->id)
            ->assertJsonPath('email', 'student@university.test')
            ->assertJsonMissingPath('password');

        $this->getJson("/api/admin/students/{$admin->id}")
            ->assertNotFound();
    }

    public function test_admin_can_delete_a_student_and_revoke_their_tokens(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $student = User::factory()->create();
        $token = $student->createToken('student-app')->accessToken;
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Student deleted successfully.');

        $this->assertDatabaseMissing('users', ['id' => $student->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->id]);
    }

    public function test_student_cannot_access_student_management_endpoints(): void
    {
        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $this->getJson('/api/admin/students')
            ->assertForbidden();

        $this->deleteJson('/api/admin/students/1')
            ->assertForbidden();
    }

    public function test_student_list_requires_authentication(): void
    {
        $this->getJson('/api/admin/students')
            ->assertUnauthorized();
    }
}
