<?php

namespace App\Filament\Resources\LandPlots\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LandPlotForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Hidden::make('company_id')
                    ->default(fn () => auth()->user()?->company_id),
                Section::make('Terreno')
                    ->columns(3)
                    ->schema([
                        TextInput::make('name')->label('Nome')->required()->columnSpan(2),
                        Select::make('status')
                            ->label('Status')
                            ->options([
                                'prospecting' => 'Prospecção',
                                'under_review' => 'Em análise',
                                'negotiating' => 'Negociando',
                                'acquired' => 'Adquirido',
                                'archived' => 'Arquivado',
                            ])
                            ->default('prospecting')
                            ->required(),
                        TextInput::make('registry_number')->label('Matrícula / RGI'),
                        TextInput::make('owner_name')->label('Proprietário'),
                        TextInput::make('area_sqm')->label('Área (m²)')->numeric()->prefix('m²'),
                    ]),
                Section::make('Localização')
                    ->columns(4)
                    ->schema([
                        TextInput::make('zip_code')->label('CEP'),
                        TextInput::make('street')->label('Logradouro')->columnSpan(2),
                        TextInput::make('number')->label('Número'),
                        TextInput::make('district')->label('Bairro'),
                        TextInput::make('city')->label('Cidade'),
                        TextInput::make('state')->label('UF')->maxLength(2),
                        Grid::make(2)->schema([
                            TextInput::make('latitude')->numeric()->label('Latitude'),
                            TextInput::make('longitude')->numeric()->label('Longitude'),
                        ]),
                    ]),
                Section::make('IPTU e dívidas')
                    ->columns(3)
                    ->schema([
                        DatePicker::make('iptu_due_date')->label('Próximo vencimento de IPTU'),
                        TextInput::make('known_debt_amount')->label('Dívida conhecida')->numeric()->prefix('R$'),
                        Textarea::make('known_debt_notes')->label('Observações')->rows(3)->columnSpanFull(),
                    ]),
                Section::make('IA')
                    ->columns(2)
                    ->schema([
                        TextInput::make('ai_confidence')->label('Confiança da extração')->numeric()->suffix('%'),
                        Textarea::make('ai_extracted_registry')->label('Dados extraídos da certidão/RGI')->rows(5)->columnSpanFull(),
                    ])
                    ->collapsed(),
            ]);
    }
}
