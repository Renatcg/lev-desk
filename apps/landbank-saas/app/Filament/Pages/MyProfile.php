<?php

namespace App\Filament\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Support\FilamentPasswordResetLink;
use BackedEnum;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Password;

class MyProfile extends Page
{
    protected string $view = 'filament.pages.my-profile';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserCircle;

    protected static ?string $navigationLabel = 'Meu perfil';

    protected static string|\UnitEnum|null $navigationGroup = 'Conta';

    public ?string $name = null;

    public function mount(): void
    {
        $this->name = auth()->user()?->name;
    }

    public function save(): void
    {
        $data = $this->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        auth()->user()?->update($data);

        Notification::make()
            ->title('Perfil atualizado')
            ->success()
            ->send();
    }

    public function sendPasswordReset(): void
    {
        $user = auth()->user();

        if (! $user) {
            return;
        }

        $status = FilamentPasswordResetLink::send($user);

        Notification::make()
            ->title($status === Password::RESET_LINK_SENT ? 'E-mail de senha enviado' : 'Não foi possível enviar o e-mail')
            ->{$status === Password::RESET_LINK_SENT ? 'success' : 'danger'}()
            ->send();
    }

    public function roleLabel(): string
    {
        return UserResource::roleLabel(auth()->user()?->role);
    }
}
