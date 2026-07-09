<?php

namespace App\Filament\Resources\PlotDocuments\Pages;

use App\Filament\Resources\PlotDocuments\PlotDocumentResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPlotDocument extends EditRecord
{
    protected static string $resource = PlotDocumentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
