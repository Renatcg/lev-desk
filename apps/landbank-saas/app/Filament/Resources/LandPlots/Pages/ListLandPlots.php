<?php

namespace App\Filament\Resources\LandPlots\Pages;

use App\Filament\Resources\LandPlots\LandPlotResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListLandPlots extends ListRecords
{
    protected static string $resource = LandPlotResource::class;

    public function getTitle(): string
    {
        return 'Landbank';
    }

    public function getSubheading(): ?string
    {
        return 'Gerencie os terrenos cadastrados e acompanhe o pipeline de lançamentos.';
    }

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Novo terreno'),
        ];
    }
}
