<?php

namespace App\Filament\Resources\LandPlots\Schemas;

use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\HtmlString;
use Throwable;

class LandPlotForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Hidden::make('company_id')
                    ->default(fn () => auth()->user()?->company_id),
                Tabs::make('Cadastro do terreno')
                    ->id('land-plot-form-tabs')
                    ->persistTab()
                    ->persistTabInQueryString('aba')
                    ->contained(false)
                    ->scrollable()
                    ->columnSpanFull()
                    ->extraAttributes(['class' => 'lev-landplot-tabs'])
                    ->tabs([
                        Tab::make('Terreno')
                            ->icon(Heroicon::OutlinedMapPin)
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
                        Tab::make('Endereço e mapa')
                            ->icon(Heroicon::OutlinedMap)
                            ->schema([
                                Grid::make([
                                    'default' => 1,
                                    'xl' => 2,
                                ])
                                    ->extraAttributes(['class' => 'lev-address-map-grid'])
                                    ->schema([
                                        Section::make('Endereço')
                                            ->columns([
                                                'default' => 1,
                                                'md' => 2,
                                            ])
                                            ->schema([
                                                TextInput::make('zip_code')
                                                    ->label('CEP')
                                                    ->live(onBlur: true)
                                                    ->maxLength(9)
                                                    ->extraInputAttributes(['data-landplot-field' => 'zip_code'])
                                                    ->afterStateUpdated(fn (Set $set, ?string $state) => self::fillAddressFromZipCode($set, $state))
                                                    ->suffixActions([
                                                        Action::make('fillAddress')
                                                            ->icon(Heroicon::ArrowPath)
                                                            ->tooltip('Buscar CEP')
                                                            ->action(fn (Set $set, Get $get) => self::fillAddressFromZipCode($set, $get('zip_code'))),
                                                        Action::make('openGoogleMaps')
                                                            ->icon(Heroicon::MapPin)
                                                            ->tooltip('Abrir no Google Maps')
                                                            ->url(fn (Get $get): string => self::googleMapsSearchUrl($get), shouldOpenInNewTab: true),
                                                    ]),
                                                TextInput::make('street')
                                                    ->label('Logradouro')
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'street'])
                                                    ->columnSpanFull(),
                                                TextInput::make('number')
                                                    ->label('Número')
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'number']),
                                                TextInput::make('district')
                                                    ->label('Bairro')
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'district']),
                                                TextInput::make('city')
                                                    ->label('Cidade')
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'city']),
                                                TextInput::make('state')
                                                    ->label('UF')
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'state'])
                                                    ->maxLength(2),
                                                TextInput::make('latitude')
                                                    ->numeric()
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'latitude'])
                                                    ->label('Latitude'),
                                                TextInput::make('longitude')
                                                    ->numeric()
                                                    ->live(onBlur: true)
                                                    ->extraInputAttributes(['data-landplot-field' => 'longitude'])
                                                    ->label('Longitude'),
                                            ]),
                                        Placeholder::make('google_maps_preview')
                                            ->label('Mapa')
                                            ->hiddenLabel()
                                            ->content(fn (Get $get): HtmlString => self::googleMapsPreview($get)),
                                    ]),
                            ]),
                        Tab::make('IPTU e dívidas')
                            ->icon(Heroicon::OutlinedBanknotes)
                            ->columns(3)
                            ->schema([
                                DatePicker::make('iptu_due_date')->label('Próximo vencimento de IPTU'),
                                TextInput::make('known_debt_amount')->label('Dívida conhecida')->numeric()->prefix('R$'),
                                Textarea::make('known_debt_notes')->label('Observações')->rows(6)->columnSpanFull(),
                            ]),
                        Tab::make('Documentos')
                            ->icon(Heroicon::OutlinedDocumentText)
                            ->schema([
                                Repeater::make('documents')
                                    ->label('Documentos')
                                    ->relationship()
                                    ->addActionLabel('Adicionar documento')
                                    ->itemLabel(fn (array $state): ?string => $state['name'] ?? 'Documento')
                                    ->reorderable(false)
                                    ->collapsible()
                                    ->collapsed()
                                    ->columns(3)
                                    ->schema([
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
                                        TextInput::make('name')
                                            ->label('Nome')
                                            ->required()
                                            ->maxLength(255),
                                        DatePicker::make('expires_at')
                                            ->label('Vencimento'),
                                        FileUpload::make('path')
                                            ->label('Arquivo')
                                            ->directory('plot-documents')
                                            ->downloadable()
                                            ->openable()
                                            ->required()
                                            ->columnSpanFull(),
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
                                        TextInput::make('ai_confidence')
                                            ->label('Confiança da IA')
                                            ->numeric()
                                            ->suffix('%'),
                                        Textarea::make('ai_extracted_data')
                                            ->label('Dados extraídos pela IA')
                                            ->rows(5)
                                            ->columnSpanFull(),
                                    ])
                                    ->columnSpanFull(),
                            ]),
                        Tab::make('Viabilidade')
                            ->icon(Heroicon::OutlinedPresentationChartLine)
                            ->schema([
                                Section::make()
                                    ->relationship('viability')
                                    ->columns(3)
                                    ->schema([
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
                                    ]),
                            ]),
                        Tab::make('IA')
                            ->icon(Heroicon::OutlinedSparkles)
                            ->columns(2)
                            ->schema([
                                TextInput::make('ai_confidence')->label('Confiança da extração')->numeric()->suffix('%'),
                                Textarea::make('ai_extracted_registry')->label('Dados extraídos da certidão/RGI')->rows(10)->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }

    protected static function fillAddressFromZipCode(Set $set, ?string $state): void
    {
        $zipCode = preg_replace('/\D/', '', (string) $state);

        if (strlen($zipCode) !== 8) {
            return;
        }

        try {
            $response = Http::timeout(5)
                ->acceptJson()
                ->get("https://viacep.com.br/ws/{$zipCode}/json/");
        } catch (Throwable) {
            return;
        }

        if (! $response->ok() || $response->json('erro')) {
            return;
        }

        $set('street', $response->json('logradouro'), shouldCallUpdatedHooks: true);
        $set('district', $response->json('bairro'), shouldCallUpdatedHooks: true);
        $set('city', $response->json('localidade'), shouldCallUpdatedHooks: true);
        $set('state', $response->json('uf'), shouldCallUpdatedHooks: true);
    }

    protected static function googleMapsPreview(Get $get): HtmlString
    {
        return new HtmlString(view('filament.components.land-plot-map-picker', [
            'address' => self::mapQuery($get),
            'apiKey' => config('services.google_maps.key'),
            'embedUrl' => self::googleMapsEmbedUrl($get),
            'latitude' => $get('latitude'),
            'longitude' => $get('longitude'),
        ])->render());
    }

    protected static function googleMapsEmbedUrl(Get $get): string
    {
        return 'https://www.google.com/maps?q='.urlencode(self::mapQuery($get)).'&output=embed';
    }

    protected static function googleMapsSearchUrl(Get $get): string
    {
        return 'https://www.google.com/maps/search/?api=1&query='.urlencode(self::mapQuery($get));
    }

    protected static function mapQuery(Get $get): string
    {
        $latitude = $get('latitude');
        $longitude = $get('longitude');

        if (filled($latitude) && filled($longitude)) {
            return "{$latitude},{$longitude}";
        }

        return collect([
            trim(implode(' ', array_filter([(string) $get('street'), (string) $get('number')]))),
            $get('district'),
            $get('city'),
            $get('state'),
            $get('zip_code'),
            'Brasil',
        ])
            ->filter(fn ($part): bool => filled($part))
            ->implode(', ');
    }
}
