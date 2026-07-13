<?php

namespace App\Filament\Resources\LandPlots\Pages;

use App\Filament\Resources\LandPlots\LandPlotResource;
use App\Filament\Resources\PlotDocuments\Schemas\PlotDocumentForm;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Icons\Heroicon;

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

    public function addDocumentAction(): Action
    {
        return Action::make('addDocument')
            ->label('Adicionar documento')
            ->icon(Heroicon::OutlinedDocumentPlus)
            ->color('primary')
            ->modalHeading('Adicionar documento')
            ->modalSubmitActionLabel('Salvar documento')
            ->form(PlotDocumentForm::documentFields(includeLandPlot: false))
            ->action(function (array $data): void {
                $this->record->documents()->create($data);
                $this->record->unsetRelation('documents');
            });
    }
}
