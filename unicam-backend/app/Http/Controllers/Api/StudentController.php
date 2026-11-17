<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
        $search = trim($validated['search'] ?? '');

        $students = User::query()
            ->where('role', 'student')
            ->select(['id', 'name', 'email', 'email_verified_at', 'created_at'])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return response()->json($students);
    }

    public function show(User $student): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        return response()->json($student->only([
            'id',
            'name',
            'email',
            'email_verified_at',
            'created_at',
        ]));
    }

    public function destroy(User $student): JsonResponse
    {
        abort_unless($student->role === 'student', 404);

        $student->tokens()->delete();
        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }
}
