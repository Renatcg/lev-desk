<?php

namespace App\Filament\Resources\LandPlots\Tables;

use Filament\Actions\EditAction;
use Filament\Tables\Columns\Layout\View;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class LandPlotsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                View::make('filament.tables.land-plot-card'),
                TextColumn::make('name')->label('Terreno')->searchable()->sortable()->hidden(),
                TextColumn::make('company.name')
                    ->label('Empresa')
                    ->searchable()
                    ->toggleable()
                    ->hidden()
                    ->visible(fn (): bool => auth()->user()?->isLevAdmin() ?? false),
                TextColumn::make('status')->label('Status')->badge()->hidden(),
                TextColumn::make('city')->label('Cidade')->searchable()->hidden(),
                TextColumn::make('area_sqm')->label('Área')->numeric(decimalPlaces: 2)->suffix(' m²')->sortable()->hidden(),
                TextColumn::make('viability.project_name')->label('Empreendimento')->searchable()->toggleable()->hidden(),
                TextColumn::make('viability.launch_month')->label('Lançamento')->date('m/Y')->sortable()->hidden(),
                TextColumn::make('iptu_due_date')->label('IPTU')->date('d/m/Y')->sortable()->hidden(),
            ])
            ->contentGrid([
                'md' => 2,
                'xl' => 3,
                '2xl' => 4,
            ])
            ->recordUrl(fn ($record): string => route('filament.admin.resources.land-plots.edit', ['record' => $record]))
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
            ]);
    }
}
