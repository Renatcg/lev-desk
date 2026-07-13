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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PlotDocumentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Documento')
                    ->columns(2)
                    ->schema(self::documentFields()),
            ]);
    }

    public static function documentFields(bool $includeLandPlot = true): array
    {
        return [
            Select::make('land_plot_id')
                ->label('Terreno')
                ->options(fn () => LandPlot::query()
                    ->when(! auth()->user()?->isLevAdmin(), fn ($query) => $query->where('company_id', auth()->user()?->company_id))
                    ->orderBy('name')
                    ->pluck('name', 'id'))
                ->searchable()
                ->required()
                ->hidden(! $includeLandPlot),
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
                ->disk('public')
                ->directory('plot-documents')
                ->downloadable()
                ->fetchFileInformation(false)
                ->getDownloadableFileUrlUsing(fn (string $file): string => self::fileUrl($file))
                ->getOpenableFileUrlUsing(fn (string $file): string => self::fileUrl($file))
                ->getUploadedFileUsing(fn (string $file): array => self::uploadedFileInfo($file))
                ->openable()
                ->preserveFilenames()
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
        ];
    }

    /**
     * @return array{name: string, size: int, type: string, url: string}
     */
    protected static function uploadedFileInfo(string $file): array
    {
        return [
            'name' => basename((string) parse_url($file, PHP_URL_PATH)) ?: basename($file),
            'size' => 0,
            'type' => self::mimeType($file),
            'url' => self::fileUrl($file),
        ];
    }

    protected static function fileUrl(string $file): string
    {
        return Str::startsWith($file, ['http://', 'https://'])
            ? $file
            : Storage::disk('public')->url($file);
    }

    protected static function mimeType(string $file): string
    {
        return match (strtolower(pathinfo((string) parse_url($file, PHP_URL_PATH), PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };
    }
}
