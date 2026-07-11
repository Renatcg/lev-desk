<?php

namespace App\Filament\Resources\Users;

use App\Filament\Resources\Users\Pages\CreateUser;
use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Filament\Resources\Users\Schemas\UserForm;
use App\Filament\Resources\Users\Tables\UsersTable;
use App\Models\Company;
use App\Models\User;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUsers;

    protected static ?string $modelLabel = 'usuário';

    protected static ?string $pluralModelLabel = 'usuários';

    protected static ?string $navigationLabel = 'Usuários';

    protected static ?int $navigationSort = 30;

    public static function canAccess(): bool
    {
        return auth()->user()?->canManageCompanyUsers() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    public static function canEdit(Model $record): bool
    {
        $user = auth()->user();

        if (! $user?->canManageCompanyUsers()) {
            return false;
        }

        if ($user->isLevAdmin()) {
            return true;
        }

        return $record->company_id === $user->company_id && $record->getKey() !== $user->getKey();
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()->with('company');
        $user = auth()->user();

        return $user?->isLevAdmin() ? $query : $query->where('company_id', $user?->company_id);
    }

    public static function form(Schema $schema): Schema
    {
        return UserForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return UsersTable::configure($table);
    }

    public static function roleOptions(): array
    {
        if (! auth()->user()?->isLevAdmin()) {
            return [
                'company_editor' => 'Operação',
                'company_viewer' => 'Leitura',
            ];
        }

        return [
            'lev_admin' => 'Admin Lev',
            'company_admin' => 'Admin da empresa',
            'company_editor' => 'Operação',
            'company_viewer' => 'Leitura',
        ];
    }

    public static function roleLabel(?string $role): string
    {
        return [
            'lev_admin' => 'Admin Lev',
            'company_admin' => 'Admin da empresa',
            'company_editor' => 'Operação',
            'company_viewer' => 'Leitura',
        ][$role] ?? 'Usuário';
    }

    public static function validateCompanyUser(array $data, ?User $record = null): void
    {
        $authUser = auth()->user();
        $role = $data['role'] ?? $record?->role ?? 'company_viewer';

        if (! $authUser?->isLevAdmin() && ! array_key_exists($role, static::roleOptions())) {
            throw ValidationException::withMessages([
                'role' => 'Este perfil não pode cadastrar esta função.',
            ]);
        }

        if ($role === 'lev_admin') {
            return;
        }

        $companyId = $authUser?->isLevAdmin()
            ? ($data['company_id'] ?? $record?->company_id)
            : $authUser?->company_id;

        if (! $companyId) {
            throw ValidationException::withMessages([
                'company_id' => 'Informe a empresa do usuário.',
            ]);
        }

        $company = Company::query()->find($companyId);
        $companyDomain = $company?->emailDomain();
        $userDomain = static::emailDomain($data['email'] ?? $record?->email);

        if (! $companyDomain || $userDomain !== $companyDomain) {
            throw ValidationException::withMessages([
                'email' => 'O e-mail precisa usar o mesmo domínio cadastrado na empresa.',
            ]);
        }

        if (
            $role === 'company_admin' &&
            User::query()
                ->where('company_id', $companyId)
                ->where('role', 'company_admin')
                ->when($record, fn (Builder $query): Builder => $query->whereKeyNot($record->getKey()))
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'role' => 'Cada empresa pode ter apenas um admin.',
            ]);
        }
    }

    public static function applyCompanyScope(array $data): array
    {
        $user = auth()->user();

        if (! $user?->isLevAdmin()) {
            $data['company_id'] = $user?->company_id;
        }

        return $data;
    }

    protected static function emailDomain(?string $email): ?string
    {
        $email = strtolower((string) $email);

        if (! str_contains($email, '@')) {
            return null;
        }

        return substr(strrchr($email, '@'), 1) ?: null;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListUsers::route('/'),
            'create' => CreateUser::route('/create'),
            'edit' => EditUser::route('/{record}/edit'),
        ];
    }
}
