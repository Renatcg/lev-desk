<?php

namespace App\Filament\Resources\LandPlots\RelationManagers;

use Filament\Actions\AssociateAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\DissociateAction;
use Filament\Actions\DissociateBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class DocumentsRelationManager extends RelationManager
{
    protected static string $relationship = 'documents';

    protected static ?string $title = 'Documentos';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
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
                FileUpload::make('path')
                    ->label('Arquivo')
                    ->directory('plot-documents')
                    ->downloadable()
                    ->openable()
                    ->required()
                    ->columnSpanFull(),
                DatePicker::make('expires_at')
                    ->label('Vencimento'),
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
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                TextColumn::make('name')
                    ->label('Documento')
                    ->searchable(),
                TextColumn::make('type')
                    ->label('Tipo')
                    ->badge(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge(),
                TextColumn::make('expires_at')
                    ->label('Vencimento')
                    ->date('d/m/Y')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Enviado em')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('type')
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
                    ]),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
