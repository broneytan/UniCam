<?php

namespace Tests\Feature;

use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_admin_can_upload_replace_and_remove_a_university_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        Sanctum::actingAs($admin);

        $createResponse = $this->post('/api/admin/universities', [
            'name' => 'North University',
            'is_active' => '1',
            'image' => UploadedFile::fake()->image('north-university.png'),
        ], ['Accept' => 'application/json'])
            ->assertCreated();

        $university = University::query()->findOrFail($createResponse->json('id'));
        $firstImagePath = $university->getRawOriginal('image_url');

        Storage::disk('public')->assertExists($firstImagePath);
        $this->assertSame(
            Storage::disk('public')->url($firstImagePath),
            $createResponse->json('image_url')
        );

        $updateResponse = $this->post("/api/admin/universities/{$university->id}", [
            '_method' => 'PUT',
            'image' => UploadedFile::fake()->image('north-university-new.png'),
        ], ['Accept' => 'application/json'])
            ->assertOk();

        $university->refresh();
        $secondImagePath = $university->getRawOriginal('image_url');

        $this->assertNotSame($firstImagePath, $secondImagePath);
        Storage::disk('public')->assertMissing($firstImagePath);
        Storage::disk('public')->assertExists($secondImagePath);
        $this->assertSame(
            Storage::disk('public')->url($secondImagePath),
            $updateResponse->json('image_url')
        );

        $this->putJson("/api/admin/universities/{$university->id}", [
            'remove_image' => true,
        ])->assertOk()
            ->assertJsonPath('image_url', null);

        $this->assertNull($university->fresh()->getRawOriginal('image_url'));
        Storage::disk('public')->assertMissing($secondImagePath);
    }

    public function test_university_image_must_be_an_allowed_image_under_two_megabytes(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        Sanctum::actingAs($admin);

        $this->post('/api/admin/universities', [
            'name' => 'North University',
            'image' => UploadedFile::fake()->create('document.svg', 10, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');

        $this->post('/api/admin/universities', [
            'name' => 'North University',
            'image' => UploadedFile::fake()->image('large.png')->size(2049),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_university_list_is_newest_first_without_changing_database_ids(): void
    {
        $olderUniversity = University::query()->create([
            'name' => 'Older University',
            'created_at' => '2025-01-01 10:00:00',
            'updated_at' => '2025-01-01 10:00:00',
        ]);
        $newerUniversity = University::query()->create([
            'name' => 'Newer University',
            'created_at' => '2025-01-02 10:00:00',
            'updated_at' => '2025-01-02 10:00:00',
        ]);

        $response = $this->getJson('/api/universities')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newerUniversity->id)
            ->assertJsonPath('data.1.id', $olderUniversity->id);

        $this->assertSame(
            [$newerUniversity->id, $olderUniversity->id],
            array_column($response->json('data'), 'id')
        );
        $this->assertDatabaseHas('universities', [
            'id' => $olderUniversity->id,
            'name' => 'Older University',
        ]);
    }
}
