<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LandPlot extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'status',
        'registry_number',
        'area_sqm',
        'owner_name',
        'zip_code',
        'street',
        'number',
        'district',
        'city',
        'state',
        'latitude',
        'longitude',
        'perimeter',
        'iptu_due_date',
        'known_debt_amount',
        'known_debt_notes',
        'ai_extracted_registry',
        'ai_confidence',
    ];

    protected function casts(): array
    {
        return [
            'area_sqm' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'perimeter' => 'array',
            'iptu_due_date' => 'date',
            'known_debt_amount' => 'decimal:2',
            'ai_confidence' => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PlotDocument::class);
    }

    public function viability(): HasOne
    {
        return $this->hasOne(PlotViability::class);
    }
}
