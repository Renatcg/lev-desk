@php
    $user = auth()->user();
    $initial = strtoupper(mb_substr((string) ($user?->name ?: $user?->email ?: 'L'), 0, 1));
@endphp

@if ($user)
    <div class="lev-sidebar-footer">
        <div class="lev-sidebar-user">
            <div class="lev-sidebar-user__avatar">{{ $initial }}</div>
            <div class="lev-sidebar-user__meta">
                <div class="lev-sidebar-user__name">{{ $user->name }}</div>
                <div class="lev-sidebar-user__email">{{ $user->email }}</div>
            </div>
            <button class="lev-sidebar-user__theme" type="button" aria-label="Alternar tema">
                <x-filament::icon icon="heroicon-o-moon" class="lev-sidebar-user__theme-icon" />
            </button>
        </div>

        <form method="POST" action="{{ route('filament.admin.auth.logout') }}">
            @csrf
            <button class="lev-sidebar-logout" type="submit">
                <x-filament::icon icon="heroicon-o-arrow-left-on-rectangle" class="lev-sidebar-logout__icon" />
                <span>Sair</span>
            </button>
        </form>
    </div>
@endif
