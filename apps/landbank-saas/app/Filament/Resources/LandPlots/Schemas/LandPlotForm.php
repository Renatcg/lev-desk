<?php

namespace App\Filament\Resources\LandPlots\Schemas;

use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
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
                        TextInput::make('zip_code')
                            ->label('CEP')
                            ->live(debounce: 700)
                            ->maxLength(9)
                            ->afterStateUpdated(fn (Set $set, ?string $state) => self::fillAddressFromZipCode($set, $state))
                            ->suffixAction(
                                Action::make('openGoogleMaps')
                                    ->icon(Heroicon::MapPin)
                                    ->tooltip('Abrir no Google Maps')
                                    ->url(fn (Get $get): string => self::googleMapsSearchUrl($get), shouldOpenInNewTab: true),
                            ),
                        TextInput::make('street')
                            ->label('Logradouro')
                            ->live(debounce: 500)
                            ->columnSpan(2),
                        TextInput::make('number')
                            ->label('Número')
                            ->live(debounce: 500),
                        TextInput::make('district')
                            ->label('Bairro')
                            ->live(debounce: 500),
                        TextInput::make('city')
                            ->label('Cidade')
                            ->live(debounce: 500),
                        TextInput::make('state')
                            ->label('UF')
                            ->live(debounce: 500)
                            ->maxLength(2),
                        Grid::make(2)->schema([
                            TextInput::make('latitude')->numeric()->label('Latitude'),
                            TextInput::make('longitude')->numeric()->label('Longitude'),
                        ]),
                        Placeholder::make('google_maps_preview')
                            ->label('Google Maps')
                            ->content(fn (Get $get): HtmlString => self::googleMapsPreview($get))
                            ->columnSpanFull(),
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

        $set('street', $response->json('logradouro'));
        $set('district', $response->json('bairro'));
        $set('city', $response->json('localidade'));
        $set('state', $response->json('uf'));
    }

    protected static function googleMapsPreview(Get $get): HtmlString
    {
        $url = self::googleMapsEmbedUrl($get);

        return new HtmlString(
            '<div class="lev-map-preview"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'.e($url).'"></iframe></div>',
        );
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
