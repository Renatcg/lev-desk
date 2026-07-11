<?php

namespace App\Support;

use App\Models\User;
use Filament\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Filament\Facades\Filament;
use Illuminate\Support\Facades\Password;

class FilamentPasswordResetLink
{
    public static function send(User $user): string
    {
        return Password::broker(Filament::getAuthPasswordBroker())
            ->sendResetLink(['email' => $user->email], function (User $notifiable, string $token): void {
                $notification = app(ResetPasswordNotification::class, ['token' => $token]);
                $notification->url = Filament::getResetPasswordUrl($token, $notifiable);

                $notifiable->notify($notification);
            });
    }
}
