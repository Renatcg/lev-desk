<?php

namespace App\Filament\Resources\LandPlots\Pages;

use App\Filament\Resources\LandPlots\LandPlotResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditLandPlot extends EditRecord
{
    protected static string $resource = LandPlotResource::class;

    public function getBreadcrumbs(): array
    {
        return [];
    }

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
