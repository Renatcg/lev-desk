<?php

namespace App\Providers\Filament;

use App\Filament\Pages\LevAssistant;
use App\Filament\Resources\Users\UserResource;
use App\Support\FilamentPasswordResetLink;
use Filament\Actions\Action;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\TextInput;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Notifications\Notification;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Assets\Css;
use Filament\Support\Colors\Color;
use Filament\Support\Icons\Heroicon;
use Filament\View\PanelsRenderHook;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Password;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->passwordReset()
            ->colors([
                'primary' => Color::hex('#76A8CF'),
                'gray' => Color::hex('#64717F'),
                'info' => Color::hex('#78C4C8'),
            ])
            ->brandName('lev')
            ->sidebarWidth('17.5rem')
            ->collapsedSidebarWidth('2.75rem')
            ->sidebarCollapsibleOnDesktop()
            ->sidebarFullyCollapsibleOnDesktop()
            ->assets([
                Css::make('lev-admin')->relativePublicPath('css/lev-admin.css'),
            ])
            ->userMenuItems([
                'profile' => fn (Action $action): Action => $action
                    ->label('Meu perfil')
                    ->icon(Heroicon::UserCircle)
                    ->modalHeading('Meu perfil')
                    ->modalWidth('lg')
                    ->modalSubmitActionLabel('Salvar')
                    ->fillForm(fn (): array => [
                        'name' => auth()->user()?->name,
                    ])
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(255),
                        Placeholder::make('email')
                            ->label('E-mail')
                            ->content(fn (): ?string => auth()->user()?->email),
                        Placeholder::make('role')
                            ->label('Função')
                            ->content(fn (): string => UserResource::roleLabel(auth()->user()?->role)),
                    ])
                    ->extraModalFooterActions(fn (Action $action): array => [
                        $action->makeModalSubmitAction('sendPasswordReset', arguments: ['sendPasswordReset' => true])
                            ->label('Enviar e-mail de senha')
                            ->icon(Heroicon::Envelope),
                    ])
                    ->action(function (array $data, array $arguments): void {
                        $user = auth()->user();

                        if (! $user) {
                            return;
                        }

                        if ($arguments['sendPasswordReset'] ?? false) {
                            $status = FilamentPasswordResetLink::send($user);

                            Notification::make()
                                ->title($status === Password::RESET_LINK_SENT ? 'E-mail de senha enviado' : 'Não foi possível enviar o e-mail')
                                ->{$status === Password::RESET_LINK_SENT ? 'success' : 'danger'}()
                                ->send();

                            return;
                        }

                        $user->update([
                            'name' => $data['name'],
                        ]);

                        Notification::make()
                            ->title('Perfil atualizado')
                            ->success()
                            ->send();
                    }),
            ])
            ->renderHook(
                PanelsRenderHook::GLOBAL_SEARCH_AFTER,
                fn (): string => view('filament.components.topbar-user-name')->render(),
            )
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                LevAssistant::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
