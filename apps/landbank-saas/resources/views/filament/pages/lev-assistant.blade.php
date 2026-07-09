<x-filament-panels::page>
    <div class="mx-auto flex h-[calc(100vh-11rem)] max-w-5xl flex-col rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
            <div class="font-semibold">Chat operacional</div>
            <div class="text-xs text-gray-500">As respostas usam apenas os dados permitidos para a empresa do usuário logado.</div>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            @foreach ($messages as $item)
                <div @class([
                    'max-w-[82%] rounded px-3 py-2 leading-relaxed whitespace-pre-line',
                    'ml-auto bg-amber-500 text-white' => $item['role'] === 'user',
                    'mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' => $item['role'] === 'assistant',
                ])>
                    {{ $item['content'] }}
                </div>
            @endforeach
        </div>

        <form wire:submit="send" class="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
            <input
                wire:model="message"
                class="min-h-9 flex-1 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-950"
                placeholder="Pergunte sobre terrenos, documentos, IPTU, dívidas ou lançamentos..."
            />
            <button class="rounded bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600" type="submit">
                Enviar
            </button>
        </form>
    </div>
</x-filament-panels::page>
