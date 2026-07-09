<?php

namespace App\Filament\Resources\PlotDocuments\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PlotDocumentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Documento')->searchable(),
                TextColumn::make('landPlot.name')->label('Terreno')->searchable()->sortable(),
                TextColumn::make('type')->label('Tipo')->badge(),
                TextColumn::make('status')->label('Status')->badge(),
                TextColumn::make('expires_at')->label('Vencimento')->date('d/m/Y')->sortable(),
                TextColumn::make('created_at')->label('Enviado em')->date('d/m/Y')->sortable(),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->label('Tipo')
                    ->options([
                        'rgi' => 'RGI / Matrícula',
                        'topography' => 'Topografia',
                        'certificate' => 'Certidão',
                        'cnd' => 'CND',
                        'iptu' => 'Carnê de IPTU',
                        'viability' => 'PDF de viabilidade',
                        'other' => 'Outro',
                    ]),
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
