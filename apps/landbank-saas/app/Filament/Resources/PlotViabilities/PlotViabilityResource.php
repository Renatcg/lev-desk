<?php

namespace App\Filament\Resources\PlotViabilities;

use App\Filament\Resources\PlotViabilities\Pages\CreatePlotViability;
use App\Filament\Resources\PlotViabilities\Pages\EditPlotViability;
use App\Filament\Resources\PlotViabilities\Pages\ListPlotViabilities;
use App\Filament\Resources\PlotViabilities\Schemas\PlotViabilityForm;
use App\Filament\Resources\PlotViabilities\Tables\PlotViabilitiesTable;
use App\Models\PlotViability;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PlotViabilityResource extends Resource
{
    protected static ?string $model = PlotViability::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartBar;

    protected static ?string $modelLabel = 'viabilidade';

    protected static ?string $pluralModelLabel = 'viabilidades';

    protected static ?string $navigationLabel = 'Viabilidades';

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
        return PlotViabilityForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PlotViabilitiesTable::configure($table);
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
            'index' => ListPlotViabilities::route('/'),
            'create' => CreatePlotViability::route('/create'),
            'edit' => EditPlotViability::route('/{record}/edit'),
        ];
    }
}
