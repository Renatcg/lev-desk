@auth
    <div class="lev-topbar-user-name">
        {{ auth()->user()?->name }}
    </div>
@endauth
