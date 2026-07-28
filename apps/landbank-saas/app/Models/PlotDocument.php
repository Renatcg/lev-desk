<?php

namespace App\Models;

use App\Services\VercelBlobStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Throwable;

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

    protected static function booted(): void
    {
        static::saving(function (PlotDocument $document): void {
            $blob = app(VercelBlobStorage::class);
            $path = (string) $document->path;

            if (! $blob->enabled() || blank($path) || $blob->isUrl($path)) {
                return;
            }

            $uploaded = $blob->uploadPlotDocument($document);

            $document->path = $uploaded['url'];

            Storage::disk('public')->delete($path);
        });

        static::deleting(function (PlotDocument $document): void {
            $blob = app(VercelBlobStorage::class);
            $path = (string) $document->path;

            if (! $blob->enabled() || blank($path)) {
                return;
            }

            try {
                if ($blob->isUrl($path)) {
                    $blob->delete($path);
                } else {
                    Storage::disk('public')->delete($path);
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }

    public function landPlot(): BelongsTo
    {
        return $this->belongsTo(LandPlot::class);
    }
}
