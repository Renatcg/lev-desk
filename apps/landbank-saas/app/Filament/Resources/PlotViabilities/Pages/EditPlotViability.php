<?php

namespace App\Filament\Resources\PlotViabilities\Pages;

use App\Filament\Resources\PlotViabilities\PlotViabilityResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPlotViability extends EditRecord
{
    protected static string $resource = PlotViabilityResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
