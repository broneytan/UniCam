<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MajorController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\UniversityController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API: students can browse active universities and majors
Route::get('/universities', [UniversityController::class, 'index']);
Route::get('/universities/{university}', [UniversityController::class, 'show']);
Route::get('/majors', [MajorController::class, 'index']);
Route::get('/majors/{major}', [MajorController::class, 'show']);
// Admin authentication
Route::post('/admin/login', [AuthController::class, 'login']);

// Protected routes require a valid Sanctum token and admin role
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('universities', UniversityController::class)
        ->except(['index', 'show']);

    Route::apiResource('majors', MajorController::class)
        ->except(['index', 'show']);

    Route::apiResource('students', StudentController::class)
        ->only(['index', 'show', 'destroy']);
});
