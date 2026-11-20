<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class University extends Model
{
    // Field that can be careated or updated through the API
    protected $fillable = [
        'name',
        'short_name',
        'description',
        'location',
        'address',
        'website',
        'phone',
        'email',
        'university_type',
        'tuition_fee',
        'image_url',
        'is_active',
    ];

    // One university can have many majors

    public function majors(): HasMany
    {
        return $this->hasMany(Major::class);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (?string $value): ?string {
            if (blank($value) || filter_var($value, FILTER_VALIDATE_URL)) {
                return $value;
            }

            return Storage::disk('public')->url($value);
        });
    }

    protected function casts(): array
    {
        return [
            'tuition_fee' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
