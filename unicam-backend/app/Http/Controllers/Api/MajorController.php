<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Major;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MajorController extends Controller
{
    // Return majors belonging to active universities
    public function index(): JsonResponse
    {
        $majors = Major::whereHas('university', function ($query) {
            $query->where('is_active', true);
        })
            ->with('university:id,name,short_name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(10);

        return response()->json($majors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'university_id' => ['required', 'exists:universities,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'tuition_fee' => ['nullable', 'numeric', 'min:0'],
            'duration_years' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $university = University::findOrFail($data['university_id']);

        abort_unless($university->is_active, 422, 'University is inactive.');

        $major = Major::create($data);

        return response()->json($major, 201);
    }

    // Return one major if its university is active
    public function show(Major $major): JsonResponse
    {
        abort_unless($major->university->is_active, 404);

        return response()->json(
            $major->load('university:id,name,short_name')
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Major $major)
    {
        $data = $request->validate([
            'university_id' => ['sometimes', 'required', 'exists:universities,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'tuition_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'duration_years' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:20'],
        ]);

        if (isset($data['university_id'])) {
            $university = University::findOrFail($data['university_id']);
            abort_unless($university->is_active, 422, 'University is inactive.');
        }

        $major->update($data);

        return response()->json($major);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Major $major)
    {
        $major->delete();

        return response()->json([
            'message' => 'Major deleted successfully',
        ]);
    }
}
