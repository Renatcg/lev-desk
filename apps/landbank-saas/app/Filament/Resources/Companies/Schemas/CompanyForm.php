<?php

namespace App\Filament\Resources\Companies\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Empresa')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')->label('Nome')->required()->maxLength(255),
                        TextInput::make('document')->label('CNPJ')->maxLength(32),
                        TextInput::make('email')->label('E-mail')->email()->maxLength(255),
                        TextInput::make('phone')->label('Telefone')->maxLength(32),
                        Select::make('plan')
                            ->label('Plano')
                            ->options([
                                'free' => 'Gratuito',
                                'starter_monthly' => '3 a 5 terrenos mensal',
                                'starter_yearly' => '3 a 5 terrenos anual',
                                'enterprise' => 'Sob demanda',
                            ])
                            ->default('free')
                            ->required(),
                        Select::make('status')
                            ->label('Status')
                            ->options([
                                'active' => 'Ativa',
                                'trialing' => 'Teste',
                                'suspended' => 'Suspensa',
                                'canceled' => 'Cancelada',
                            ])
                            ->default('active')
                            ->required(),
                    ]),
            ]);
    }
}
