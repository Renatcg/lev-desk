<?php

namespace App\Filament\Resources\PlotDocuments;

use App\Filament\Resources\PlotDocuments\Pages\CreatePlotDocument;
use App\Filament\Resources\PlotDocuments\Pages\EditPlotDocument;
use App\Filament\Resources\PlotDocuments\Pages\ListPlotDocuments;
use App\Filament\Resources\PlotDocuments\Schemas\PlotDocumentForm;
use App\Filament\Resources\PlotDocuments\Tables\PlotDocumentsTable;
use App\Models\PlotDocument;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PlotDocumentResource extends Resource
{
    protected static ?string $model = PlotDocument::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?string $modelLabel = 'documento';

    protected static ?string $pluralModelLabel = 'documentos';

    protected static ?string $navigationLabel = 'Documentos';

    protected static string|\UnitEnum|null $navigationGroup = 'Landbank';

    public static function canAccess(): bool
    {
        return false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return false;
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()->with('landPlot');
        $user = auth()->user();

        return $user?->isLevAdmin()
            ? $query
            : $query->whereHas('landPlot', fn ($plotQuery) => $plotQuery->where('company_id', $user?->company_id));
    }

    public static function form(Schema $schema): Schema
    {
        return PlotDocumentForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PlotDocumentsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPlotDocuments::route('/'),
            'create' => CreatePlotDocument::route('/create'),
            'edit' => EditPlotDocument::route('/{record}/edit'),
        ];
    }
}
