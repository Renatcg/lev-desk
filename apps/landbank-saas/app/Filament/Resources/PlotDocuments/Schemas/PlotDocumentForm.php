<?php

namespace App\Filament\Resources\PlotDocuments\Schemas;

use App\Models\LandPlot;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PlotDocumentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Documento')
                    ->columns(2)
                    ->schema([
                        Select::make('land_plot_id')
                            ->label('Terreno')
                            ->options(fn () => LandPlot::query()
                                ->when(! auth()->user()?->isLevAdmin(), fn ($query) => $query->where('company_id', auth()->user()?->company_id))
                                ->orderBy('name')
                                ->pluck('name', 'id'))
                            ->searchable()
                            ->required(),
                        Select::make('type')
                            ->label('Tipo')
                            ->options([
                                'rgi' => 'RGI / Matrícula',
                                'topography' => 'Topografia',
                                'certificate' => 'Certidão',
                                'cnd' => 'CND',
                                'iptu' => 'Carnê de IPTU',
                                'viability' => 'PDF de viabilidade',
                                'contract' => 'Contrato',
                                'other' => 'Outro',
                            ])
                            ->required(),
                        TextInput::make('name')->label('Nome')->required()->columnSpan(2),
                        FileUpload::make('path')
                            ->label('Arquivo')
                            ->directory('plot-documents')
                            ->downloadable()
                            ->openable()
                            ->required()
                            ->columnSpan(2),
                        DatePicker::make('expires_at')->label('Vencimento'),
                        Select::make('status')
                            ->label('Status')
                            ->options([
                                'pending_review' => 'Pendente de revisão',
                                'valid' => 'Válido',
                                'expires_soon' => 'Próximo do vencimento',
                                'expired' => 'Vencido',
                            ])
                            ->default('pending_review')
                            ->required(),
                        TextInput::make('ai_confidence')->label('Confiança da IA')->numeric()->suffix('%'),
                        Textarea::make('ai_extracted_data')->label('Dados extraídos pela IA')->rows(5)->columnSpanFull(),
                    ]),
            ]);
    }
}
