<?php

namespace App\Filament\Resources\PlotViabilities\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PlotViabilitiesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('landPlot.name')->label('Terreno')->searchable()->sortable(),
                TextColumn::make('project_name')->label('Empreendimento')->searchable(),
                TextColumn::make('vgv')->label('VGV')->money('BRL')->sortable(),
                TextColumn::make('land_value')->label('Terreno')->money('BRL')->sortable(),
                TextColumn::make('units_count')->label('Unidades')->numeric()->sortable(),
                TextColumn::make('standard')->label('Padrão')->badge(),
                TextColumn::make('launch_month')->label('Lançamento')->date('m/Y')->sortable(),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
