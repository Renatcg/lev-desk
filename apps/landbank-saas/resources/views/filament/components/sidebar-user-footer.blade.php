@php
    $user = filament()->auth()->user();
    $name = $user ? filament()->getUserName($user) : 'Usuário';
    $email = $user?->email;
    $initial = mb_strtoupper(mb_substr($name ?: $email ?: 'U', 0, 1));
@endphp

@if ($user)
    <div class="lev-sidebar-user-footer" x-show="$store.sidebar.isOpen">
        <div class="lev-sidebar-user-footer__profile">
            <div class="lev-sidebar-user-footer__avatar">{{ $initial }}</div>

            <div class="lev-sidebar-user-footer__identity">
                <p>{{ $name }}</p>
                <span>{{ $email }}</span>
            </div>
        </div>

        <form action="{{ filament()->getLogoutUrl() }}" method="post">
            @csrf

            <button class="lev-sidebar-user-footer__logout" type="submit">
                <x-filament::icon icon="heroicon-o-arrow-left-end-on-rectangle" class="lev-sidebar-user-footer__logout-icon" />
                <span>Sair</span>
            </button>
        </form>
    </div>
@endif
