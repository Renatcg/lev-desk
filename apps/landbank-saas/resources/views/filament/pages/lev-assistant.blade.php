<x-filament-panels::page>
    <div class="lev-chat">
        <div class="lev-chat__header">
            <h2>Chat operacional</h2>
            <p>As respostas usam apenas os dados permitidos para a empresa do usuário logado.</p>
        </div>

        <div class="lev-chat__messages">
            @foreach ($messages as $item)
                <div @class([
                    'lev-chat__bubble',
                    'lev-chat__bubble--user' => $item['role'] === 'user',
                    'lev-chat__bubble--assistant' => $item['role'] === 'assistant',
                ])>
                    {{ $item['content'] }}
                </div>
            @endforeach
        </div>

        <form wire:submit.prevent="send" class="lev-chat__form">
            <input wire:model="message" placeholder="Pergunte sobre terrenos, documentos, IPTU, dívidas ou lançamentos...">
            <button type="submit">
                Enviar
            </button>
        </form>
    </div>
</x-filament-panels::page>
