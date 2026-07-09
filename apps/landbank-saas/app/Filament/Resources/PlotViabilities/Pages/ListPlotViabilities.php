<?php

namespace App\Filament\Resources\PlotViabilities\Pages;

use App\Filament\Resources\PlotViabilities\PlotViabilityResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPlotViabilities extends ListRecords
{
    protected static string $resource = PlotViabilityResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
