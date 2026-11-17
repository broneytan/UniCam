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

    public function test_major_list_is_newest_first_without_changing_database_ids(): void
    {
        $university = University::query()->create(['name' => 'North University']);
        $olderMajor = $university->majors()->create([
            'name' => 'Older Major',
            'created_at' => '2025-01-01 10:00:00',
            'updated_at' => '2025-01-01 10:00:00',
        ]);
        $newerMajor = $university->majors()->create([
            'name' => 'Newer Major',
            'created_at' => '2025-01-02 10:00:00',
            'updated_at' => '2025-01-02 10:00:00',
        ]);

        $response = $this->getJson('/api/majors')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newerMajor->id)
            ->assertJsonPath('data.1.id', $olderMajor->id);

        $this->assertSame(
            [$newerMajor->id, $olderMajor->id],
            array_column($response->json('data'), 'id')
        );
        $this->assertDatabaseHas('majors', [
            'id' => $olderMajor->id,
            'name' => 'Older Major',
        ]);
    }
}
