<?php

namespace App\Filament\Resources\LandPlots\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class LandPlotsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Terreno')->searchable()->sortable(),
                TextColumn::make('company.name')
                    ->label('Empresa')
                    ->searchable()
                    ->toggleable()
                    ->visible(fn (): bool => auth()->user()?->isLevAdmin() ?? false),
                TextColumn::make('status')->label('Status')->badge(),
                TextColumn::make('city')->label('Cidade')->searchable(),
                TextColumn::make('area_sqm')->label('Área')->numeric(decimalPlaces: 2)->suffix(' m²')->sortable(),
                TextColumn::make('viability.project_name')->label('Empreendimento')->searchable()->toggleable(),
                TextColumn::make('viability.launch_month')->label('Lançamento')->date('m/Y')->sortable(),
                TextColumn::make('iptu_due_date')->label('IPTU')->date('d/m/Y')->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'prospecting' => 'Prospecção',
                        'under_review' => 'Em análise',
                        'negotiating' => 'Negociando',
                        'acquired' => 'Adquirido',
                        'archived' => 'Arquivado',
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
