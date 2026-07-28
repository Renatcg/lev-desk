<?php

namespace App\Filament\Resources\LandPlots\Pages;

use App\Filament\Resources\LandPlots\LandPlotResource;
use Filament\Resources\Pages\CreateRecord;

class CreateLandPlot extends CreateRecord
{
    protected static string $resource = LandPlotResource::class;

    public function getBreadcrumbs(): array
    {
        return [];
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $user = auth()->user();

        if (! $user?->isLevAdmin()) {
            $data['company_id'] = $user?->company_id;
        }

        return $data;
    }
}
