<x-filament-panels::page>
    <div class="lev-profile">
        <section class="lev-profile__card">
            <h2>Dados do usuário</h2>

            <form wire:submit.prevent="save" class="lev-profile__form">
                <label>
                    <span>Nome</span>
                    <input wire:model="name" type="text">
                    @error('name')
                        <small>{{ $message }}</small>
                    @enderror
                </label>

                <label>
                    <span>E-mail</span>
                    <input value="{{ auth()->user()?->email }}" type="email" disabled>
                </label>

                <label>
                    <span>Função</span>
                    <input value="{{ $this->roleLabel() }}" type="text" disabled>
                </label>

                <div class="lev-profile__actions">
                    <button type="submit">Salvar</button>
                    <button type="button" wire:click="sendPasswordReset" class="lev-profile__secondary">Trocar senha por e-mail</button>
                </div>
            </form>
        </section>
    </div>
</x-filament-panels::page>
