<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Support\FilamentPasswordResetLink;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data = UserResource::applyCompanyScope($data);
        $data['password'] = Str::password(32);

        UserResource::validateCompanyUser($data);

        return $data;
    }

    protected function afterCreate(): void
    {
        $status = FilamentPasswordResetLink::send($this->record);

        Notification::make()
            ->title($status === Password::RESET_LINK_SENT ? 'Convite enviado por e-mail' : 'Usuário criado, mas o convite não foi enviado')
            ->{$status === Password::RESET_LINK_SENT ? 'success' : 'danger'}()
            ->send();
    }
}
