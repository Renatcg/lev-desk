@php
    use Illuminate\Support\Facades\Storage;

    $record = $getRecord();
    $documents = $record?->documents()
        ->orderBy('type')
        ->orderBy('name')
        ->get() ?? collect();
@endphp

<div
    class="lev-doc-explorer"
    x-data="{ selected: '{{ $documents->first()?->getKey() }}' }"
>
    <aside class="lev-doc-explorer__tree">
        <div class="lev-doc-explorer__folder">
            <x-filament::icon icon="heroicon-o-chevron-down" class="lev-doc-explorer__folder-chevron" />
            <x-filament::icon icon="heroicon-o-folder-open" class="lev-doc-explorer__folder-icon" />
            <span>Docs {{ $record?->name ?? 'do terreno' }}</span>
        </div>

        @forelse ($documents as $document)
            @php
                $path = (string) $document->path;
                $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            @endphp

            <button
                class="lev-doc-explorer__item"
                type="button"
                x-bind:class="{ 'is-active': selected === '{{ $document->getKey() }}' }"
                x-on:click="selected = '{{ $document->getKey() }}'"
            >
                <x-filament::icon
                    :icon="$extension === 'pdf' ? 'heroicon-o-document-text' : 'heroicon-o-photo'"
                    class="lev-doc-explorer__item-icon"
                />
                <span>{{ $document->name }}</span>
            </button>
        @empty
            <div class="lev-doc-explorer__empty">
                Nenhum documento salvo ainda.
            </div>
        @endforelse
    </aside>

    <div class="lev-doc-explorer__handle" aria-hidden="true">›</div>

    <section class="lev-doc-explorer__preview">
        @if ($documents->isNotEmpty())
            <div
                class="lev-doc-preview lev-doc-preview--empty"
                x-cloak
                x-show="! selected"
            >
                <x-filament::icon icon="heroicon-o-document-magnifying-glass" class="lev-doc-preview__fallback-icon" />
                <p>Selecione um documento para visualizar.</p>
            </div>
        @endif

        @forelse ($documents as $document)
            @php
                $path = (string) $document->path;
                $fileExists = filled($path) && Storage::disk('public')->exists($path);
                $url = $fileExists ? Storage::disk('public')->url($path) : null;
                $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                $canPreview = $url && in_array($extension, ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif']);
            @endphp

            <article
                class="lev-doc-preview"
                x-cloak
                x-show="selected === '{{ $document->getKey() }}'"
            >
                <header class="lev-doc-preview__header">
                    <div>
                        <h3>{{ $document->name }}</h3>
                    </div>

                    <div class="lev-doc-preview__actions">
                        @if ($url)
                            <a class="lev-doc-preview__action" href="{{ $url }}" download title="Baixar">
                                <x-filament::icon icon="heroicon-o-arrow-down-tray" class="lev-doc-preview__action-icon" />
                            </a>

                            <a class="lev-doc-preview__action" href="{{ $url }}" target="_blank" rel="noopener noreferrer" title="Abrir em tela cheia">
                                <x-filament::icon icon="heroicon-o-arrows-pointing-out" class="lev-doc-preview__action-icon" />
                            </a>
                        @endif

                        <button class="lev-doc-preview__action" type="button" x-on:click="selected = ''" title="Fechar visualização">
                            <x-filament::icon icon="heroicon-o-x-mark" class="lev-doc-preview__action-icon" />
                        </button>
                    </div>
                </header>

                <div class="lev-doc-preview__stage">
                    @if ($canPreview && $extension === 'pdf')
                        <iframe src="{{ $url }}#toolbar=1&navpanes=0"></iframe>
                    @elseif ($canPreview)
                        <img src="{{ $url }}" alt="{{ $document->name }}">
                    @else
                        <div class="lev-doc-preview__fallback">
                            <x-filament::icon icon="heroicon-o-document" class="lev-doc-preview__fallback-icon" />
                            <p>
                                @if (! $fileExists)
                                    Arquivo não encontrado no storage.
                                @else
                                    Este tipo de arquivo não tem visualização embutida.
                                @endif
                            </p>
                        </div>
                    @endif
                </div>
            </article>
        @empty
            <div class="lev-doc-preview lev-doc-preview--empty">
                <x-filament::icon icon="heroicon-o-document-plus" class="lev-doc-preview__fallback-icon" />
                <p>Adicione um documento abaixo para visualizar aqui.</p>
            </div>
        @endforelse
    </section>
</div>
