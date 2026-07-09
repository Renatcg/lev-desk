<?php

namespace App\Filament\Resources\PlotViabilities\Schemas;

use App\Models\LandPlot;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PlotViabilityForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Viabilidade')
                    ->columns(3)
                    ->schema([
                        Select::make('land_plot_id')
                            ->label('Terreno')
                            ->options(fn () => LandPlot::query()
                                ->when(! auth()->user()?->isLevAdmin(), fn ($query) => $query->where('company_id', auth()->user()?->company_id))
                                ->orderBy('name')
                                ->pluck('name', 'id'))
                            ->searchable()
                            ->required(),
                        TextInput::make('project_name')->label('Empreendimento')->columnSpan(2),
                        TextInput::make('land_value')->label('Valor do terreno')->numeric()->prefix('R$'),
                        TextInput::make('vgv')->label('VGV')->numeric()->prefix('R$'),
                        TextInput::make('units_count')->label('Unidades')->numeric(),
                        Select::make('standard')
                            ->label('Padrão')
                            ->options([
                                'economic' => 'Econômico',
                                'standard' => 'Médio',
                                'high' => 'Alto padrão',
                                'luxury' => 'Luxo',
                                'mixed' => 'Misto',
                            ]),
                        DatePicker::make('launch_month')->label('Mês de lançamento')->native(false)->displayFormat('m/Y'),
                        TextInput::make('sellable_area_sqm')->label('Área vendável')->numeric()->suffix('m²'),
                        Textarea::make('assumptions')->label('Premissas')->rows(4)->columnSpanFull(),
                        TextInput::make('ai_confidence')->label('Confiança da IA')->numeric()->suffix('%'),
                        Textarea::make('ai_extracted_viability')->label('Dados extraídos do PDF')->rows(5)->columnSpanFull(),
                    ]),
            ]);
    }
}
