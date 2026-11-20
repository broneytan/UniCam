<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class UniversityController extends Controller
{
    // Return active universities with their majors
    public function index(): JsonResponse
    {
        $universities = University::where('is_active', true)
            ->with('majors')
            ->latest()
            ->orderByDesc('id')
            ->paginate(10);

        return response()->json($universities);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'university_type' => ['nullable', 'string', 'max:100'],
            'tuition_fee' => ['nullable', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:255'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $image = $request->file('image');
        unset($data['image']);

        if ($image) {
            $data['image_url'] = $this->storeImage($image);
        }

        try {
            return response()->json(University::create($data), 201);
        } catch (Throwable $exception) {
            if ($image) {
                $this->deleteStoredImage($data['image_url']);
            }

            throw $exception;
        }
    }

    // Return one active university with its majors
    public function show(University $university): JsonResponse
    {
        abort_unless($university->is_active, 404);

        return response()->json(
            $university->load('majors')
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, University $university)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'short_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'university_type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'tuition_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $oldImage = $university->getRawOriginal('image_url');
        $image = $request->file('image');
        $removeImage = $request->boolean('remove_image');
        unset($data['image'], $data['remove_image']);

        if ($image) {
            $data['image_url'] = $this->storeImage($image);
        } elseif ($removeImage) {
            $data['image_url'] = null;
        }

        try {
            $university->update($data);
        } catch (Throwable $exception) {
            if ($image) {
                $this->deleteStoredImage($data['image_url']);
            }

            throw $exception;
        }

        $newImage = $university->getRawOriginal('image_url');
        if ($oldImage !== $newImage) {
            $this->deleteStoredImage($oldImage);
        }

        return response()->json($university);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(University $university)
    {
        $image = $university->getRawOriginal('image_url');
        $university->delete();
        $this->deleteStoredImage($image);

        return response()->json([
            'message' => 'University deleted successfully',
        ]);
    }

    private function storeImage(UploadedFile $image): string
    {
        $path = $image->store('universities', 'public');

        if (! $path) {
            throw new RuntimeException('The university image could not be stored.');
        }

        return $path;
    }

    private function deleteStoredImage(?string $path): void
    {
        if (blank($path) || filter_var($path, FILTER_VALIDATE_URL)) {
            return;
        }

        $storage = Storage::disk('public');

        if ($storage->exists($path) && ! $storage->delete($path)) {
            throw new RuntimeException('The university image could not be deleted from storage.');
        }
    }
}
