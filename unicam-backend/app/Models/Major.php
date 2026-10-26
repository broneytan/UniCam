<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Major extends Model
{
    // Field that can be created or update through the API

    protected $fillable = [
        'university_id',
        'name',
        'description',
        'tuition_fee',
        'duration_years',
    ];

    // Each major belongs to one university

    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    protected function casts(): array
    {
        return[
            'tuition_fee' => 'decimal:2',
            'duration_years' => 'integer',
        ];
    }
}
