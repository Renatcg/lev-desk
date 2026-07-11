<?php

namespace App\Filament\Resources\LandPlots\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ViabilityRelationManager extends RelationManager
{
    protected static string $relationship = 'viability';

    protected static ?string $title = 'Viabilidade';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('project_name')
                    ->label('Empreendimento')
                    ->columnSpanFull(),
                TextInput::make('land_value')
                    ->label('Valor do terreno')
                    ->numeric()
                    ->prefix('R$'),
                TextInput::make('vgv')
                    ->label('VGV')
                    ->numeric()
                    ->prefix('R$'),
                TextInput::make('units_count')
                    ->label('Unidades')
                    ->numeric(),
                Select::make('standard')
                    ->label('Padrão')
                    ->options([
                        'economic' => 'Econômico',
                        'standard' => 'Médio',
                        'high' => 'Alto padrão',
                        'luxury' => 'Luxo',
                        'mixed' => 'Misto',
                    ]),
                DatePicker::make('launch_month')
                    ->label('Mês de lançamento')
                    ->native(false)
                    ->displayFormat('m/Y'),
                TextInput::make('sellable_area_sqm')
                    ->label('Área vendável')
                    ->numeric()
                    ->suffix('m²'),
                Textarea::make('assumptions')
                    ->label('Premissas')
                    ->rows(4)
                    ->columnSpanFull(),
                TextInput::make('ai_confidence')
                    ->label('Confiança da IA')
                    ->numeric()
                    ->suffix('%'),
                Textarea::make('ai_extracted_viability')
                    ->label('Dados extraídos do PDF')
                    ->rows(5)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('project_name')
            ->columns([
                TextColumn::make('project_name')
                    ->label('Empreendimento')
                    ->placeholder('Não informado')
                    ->searchable(),
                TextColumn::make('vgv')
                    ->label('VGV')
                    ->money('BRL')
                    ->sortable(),
                TextColumn::make('land_value')
                    ->label('Terreno')
                    ->money('BRL')
                    ->sortable(),
                TextColumn::make('units_count')
                    ->label('Unidades')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('standard')
                    ->label('Padrão')
                    ->badge(),
                TextColumn::make('launch_month')
                    ->label('Lançamento')
                    ->date('m/Y')
                    ->sortable(),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
