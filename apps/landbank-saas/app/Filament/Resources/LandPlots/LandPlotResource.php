<?php

namespace App\Filament\Resources\LandPlots;

use App\Filament\Resources\LandPlots\Pages\CreateLandPlot;
use App\Filament\Resources\LandPlots\Pages\EditLandPlot;
use App\Filament\Resources\LandPlots\Pages\ListLandPlots;
use App\Filament\Resources\LandPlots\Schemas\LandPlotForm;
use App\Filament\Resources\LandPlots\Tables\LandPlotsTable;
use App\Models\LandPlot;
use BackedEnum;
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
            //
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
