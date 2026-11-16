<?php

namespace Tests\Feature;

use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MajorControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_update_and_delete_a_major(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $university = University::query()->create(['name' => 'North University']);
        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/majors', [
            'university_id' => $university->id,
            'name' => 'Computer Science',
            'duration_years' => 4,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('name', 'Computer Science');

        $majorId = $createResponse->json('id');
        $this->assertDatabaseHas('majors', [
            'id' => $majorId,
            'university_id' => $university->id,
            'name' => 'Computer Science',
        ]);

        $this->putJson("/api/admin/majors/{$majorId}", [
            'name' => 'Applied Computer Science',
        ])->assertOk()
            ->assertJsonPath('name', 'Applied Computer Science');

        $this->assertDatabaseHas('majors', [
            'id' => $majorId,
            'name' => 'Applied Computer Science',
        ]);

        $this->deleteJson("/api/admin/majors/{$majorId}")
            ->assertOk();

        $this->assertDatabaseMissing('majors', ['id' => $majorId]);
    }
}
