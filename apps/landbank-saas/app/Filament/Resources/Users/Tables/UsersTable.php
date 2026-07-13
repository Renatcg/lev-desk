<?php

namespace App\Filament\Resources\Users\Tables;

use App\Filament\Resources\Users\UserResource;
use App\Support\FilamentPasswordResetLink;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\Layout\View;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Password;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                View::make('filament.tables.user-card'),
                TextColumn::make('name')->label('Nome')->searchable()->sortable()->hidden(),
                TextColumn::make('email')->label('E-mail')->searchable()->sortable()->hidden(),
                TextColumn::make('company.name')
                    ->label('Empresa')
                    ->searchable()
                    ->hidden()
                    ->visible(fn (): bool => auth()->user()?->isLevAdmin() ?? false),
                TextColumn::make('role')
                    ->label('Função')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => UserResource::roleLabel($state))
                    ->hidden(),
                TextColumn::make('created_at')->label('Criado em')->dateTime('d/m/Y H:i')->sortable()->hidden(),
            ])
            ->contentGrid([
                'md' => 2,
                'xl' => 3,
                '2xl' => 4,
            ])
            ->recordUrl(fn ($record): ?string => UserResource::canEdit($record)
                ? route('filament.admin.resources.users.edit', ['record' => $record])
                : null)
            ->recordActions([
                EditAction::make()
                    ->visible(fn ($record): bool => UserResource::canEdit($record)),
                Action::make('resetPassword')
                    ->label('Enviar senha')
                    ->icon('heroicon-m-envelope')
                    ->requiresConfirmation()
                    ->action(function ($record): void {
                        $status = FilamentPasswordResetLink::send($record);

                        Notification::make()
                            ->title($status === Password::RESET_LINK_SENT ? 'E-mail enviado' : 'Não foi possível enviar o e-mail')
                            ->{$status === Password::RESET_LINK_SENT ? 'success' : 'danger'}()
                            ->send();
                    }),
            ]);
    }
}
