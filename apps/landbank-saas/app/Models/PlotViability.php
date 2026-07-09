<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlotViability extends Model
{
    protected $fillable = [
        'land_plot_id',
        'project_name',
        'land_value',
        'vgv',
        'units_count',
        'standard',
        'launch_month',
        'sellable_area_sqm',
        'assumptions',
        'ai_extracted_viability',
        'ai_confidence',
    ];

    protected function casts(): array
    {
        return [
            'land_value' => 'decimal:2',
            'vgv' => 'decimal:2',
            'launch_month' => 'date',
            'sellable_area_sqm' => 'decimal:2',
            'ai_confidence' => 'decimal:2',
        ];
    }

    public function landPlot(): BelongsTo
    {
        return $this->belongsTo(LandPlot::class);
    }
}
