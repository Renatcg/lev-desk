<?php

namespace App\Filament\Resources\LandPlots;

use App\Filament\Resources\LandPlots\Pages\CreateLandPlot;
use App\Filament\Resources\LandPlots\Pages\EditLandPlot;
use App\Filament\Resources\LandPlots\Pages\ListLandPlots;
use App\Filament\Resources\LandPlots\RelationManagers\DocumentsRelationManager;
use App\Filament\Resources\LandPlots\RelationManagers\ViabilityRelationManager;
use App\Filament\Resources\LandPlots\Schemas\LandPlotForm;
use App\Filament\Resources\LandPlots\Tables\LandPlotsTable;
use App\Models\LandPlot;
use BackedEnum;
use Filament\Navigation\NavigationItem;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class LandPlotResource extends Resource
{
    protected static ?string $model = LandPlot::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedMapPin;

    protected static ?string $modelLabel = 'terreno';

    protected static ?string $pluralModelLabel = 'terrenos';

    protected static ?string $navigationLabel = 'Terrenos';

    protected static string|\UnitEnum|null $navigationGroup = 'Landbank';

    public static function getNavigationItems(): array
    {
        if (! auth()->check()) {
            return parent::getNavigationItems();
        }

        $activeRoutePattern = static::getNavigationItemActiveRoutePattern();
        $request = request();
        $activeRecord = $request->route('record');

        $plots = static::getEloquentQuery()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->limit(30)
            ->get();

        return [
            NavigationItem::make(static::getNavigationLabel())
                ->group(static::getNavigationGroup())
                ->icon(static::getNavigationIcon())
                ->isActiveWhen(fn (): bool => $request->routeIs($activeRoutePattern))
                ->badge((string) $plots->count(), color: 'primary')
                ->sort(static::getNavigationSort())
                ->url(static::getNavigationUrl())
                ->childItems(
                    $plots
                        ->map(fn (LandPlot $plot): NavigationItem => NavigationItem::make($plot->name)
                            ->url(static::getUrl('edit', ['record' => $plot]))
                            ->isActiveWhen(fn (): bool => $request->routeIs(static::getRouteBaseName() . '.edit') && (string) $activeRecord === (string) $plot->getKey())
                            ->sort(10))
                        ->all()
                ),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()->with(['company', 'viability']);
        $user = auth()->user();

        return $user?->isLevAdmin() ? $query : $query->where('company_id', $user?->company_id);
    }

    public static function form(Schema $schema): Schema
    {
        return LandPlotForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return LandPlotsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            DocumentsRelationManager::class,
            ViabilityRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListLandPlots::route('/'),
            'create' => CreateLandPlot::route('/create'),
            'edit' => EditLandPlot::route('/{record}/edit'),
        ];
    }
}
