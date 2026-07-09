<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlotDocument extends Model
{
    protected $fillable = [
        'land_plot_id',
        'type',
        'name',
        'path',
        'expires_at',
        'status',
        'ai_extracted_data',
        'ai_confidence',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'date',
            'ai_confidence' => 'decimal:2',
        ];
    }

    public function landPlot(): BelongsTo
    {
        return $this->belongsTo(LandPlot::class);
    }
}
