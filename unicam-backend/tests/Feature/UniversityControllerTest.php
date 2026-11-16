<?php

namespace Tests\Feature;

use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UniversityControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_list_update_and_delete_a_university(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/universities', [
            'name' => 'North University',
            'is_active' => true,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('name', 'North University')
            ->assertJsonStructure(['created_at', 'updated_at']);

        $universityId = $createResponse->json('id');
        $university = University::query()->findOrFail($universityId);

        $this->assertNotNull($university->created_at);
        $this->assertNotNull($university->updated_at);
        $this->assertDatabaseHas('universities', [
            'id' => $universityId,
            'name' => 'North University',
        ]);

        $this->getJson('/api/universities')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $universityId,
                'name' => 'North University',
            ]);

        $this->putJson("/api/admin/universities/{$universityId}", [
            'name' => 'North University Updated',
        ])->assertOk()
            ->assertJsonPath('name', 'North University Updated');

        $this->assertDatabaseHas('universities', [
            'id' => $universityId,
            'name' => 'North University Updated',
        ]);

        $this->deleteJson("/api/admin/universities/{$universityId}")
            ->assertOk();

        $this->assertDatabaseMissing('universities', ['id' => $universityId]);
    }

    public function test_university_write_requires_authentication(): void
    {
        $this->postJson('/api/admin/universities', [
            'name' => 'North University',
        ])->assertUnauthorized();
    }

    public function test_student_receives_403_when_creating_a_university(): void
    {
        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $this->postJson('/api/admin/universities', [
            'name' => 'North University',
        ])->assertForbidden();
    }
}
