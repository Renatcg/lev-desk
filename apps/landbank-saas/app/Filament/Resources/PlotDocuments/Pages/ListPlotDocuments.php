<?php

namespace App\Filament\Resources\PlotDocuments\Pages;

use App\Filament\Resources\PlotDocuments\PlotDocumentResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPlotDocuments extends ListRecords
{
    protected static string $resource = PlotDocumentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
