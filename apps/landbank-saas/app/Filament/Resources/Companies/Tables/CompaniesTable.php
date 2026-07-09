<?php

namespace App\Filament\Resources\Companies\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CompaniesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Empresa')->searchable()->sortable(),
                TextColumn::make('document')->label('CNPJ')->searchable(),
                TextColumn::make('plan')->label('Plano')->badge(),
                TextColumn::make('status')->label('Status')->badge(),
                TextColumn::make('land_plots_count')->counts('landPlots')->label('Terrenos'),
                TextColumn::make('created_at')->label('Criada em')->date('d/m/Y')->sortable(),
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
