@php
    use Illuminate\Support\Facades\Storage;
    use Illuminate\Support\Str;

    $record = $getRecord();
    $documents = $record?->documents()
        ->orderBy('type')
        ->orderBy('name')
        ->get() ?? collect();
@endphp

@once
    <style>
        .lev-landplot-tabs > .fi-tabs {
            background: #eef1f5 !important;
            border: 0 !important;
            border-radius: 0.9rem !important;
            box-shadow: none !important;
            display: inline-flex !important;
            margin: 0 0 1.25rem !important;
            padding: 0.28rem !important;
            width: auto !important;
        }

        .lev-landplot-tabs > .fi-tabs .fi-tabs-item {
            border-radius: 0.65rem !important;
            color: #64717f !important;
            font-weight: 800 !important;
            min-height: 2.25rem !important;
            padding-inline: 0.9rem !important;
        }

        .lev-landplot-tabs > .fi-tabs .fi-tabs-item.fi-active,
        .lev-landplot-tabs > .fi-tabs .fi-tabs-item[aria-selected="true"] {
            background: #ffffff !important;
            box-shadow: 0 1px 2px rgb(42 54 68 / 0.08) !important;
            color: #2f3136 !important;
        }

        .lev-landplot-tabs > .fi-sc-tabs-tab.fi-active {
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin-top: 0 !important;
            padding: 0 !important;
        }

        .lev-doc-explorer {
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            display: grid !important;
            grid-template-columns: minmax(420px, 58%) minmax(440px, 42%) !important;
            min-height: clamp(620px, calc(100vh - 17rem), 920px) !important;
            overflow: visible !important;
            position: relative !important;
            width: 100% !important;
        }

        .lev-doc-explorer-shell {
            display: flex !important;
            flex-direction: column !important;
            gap: 1rem !important;
            width: 100% !important;
        }

        .lev-doc-explorer-toolbar {
            align-items: center !important;
            display: flex !important;
            justify-content: flex-end !important;
            min-height: 2.5rem !important;
        }

        .lev-doc-explorer__tree {
            background: transparent !important;
            min-width: 0 !important;
            overflow: auto !important;
            padding: 1.75rem 1.5rem 1rem 1.4rem !important;
        }

        .lev-doc-explorer__folder,
        .lev-doc-explorer__item,
        .lev-doc-preview__header,
        .lev-doc-preview__actions,
        .lev-doc-preview__action,
        .lev-doc-preview__fallback,
        .lev-doc-preview--empty {
            align-items: center !important;
            display: flex !important;
        }

        .lev-doc-explorer__folder {
            color: #2f3136 !important;
            font-size: 0.98rem !important;
            font-weight: 800 !important;
            gap: 0.38rem !important;
            margin-bottom: 0.42rem !important;
            padding-left: 0.15rem !important;
        }

        .lev-doc-explorer__folder-chevron {
            color: #2f3136 !important;
            height: 0.9rem !important;
            width: 0.9rem !important;
        }

        .lev-doc-explorer__folder-icon {
            color: #76a8cf !important;
            height: 1.05rem !important;
            width: 1.05rem !important;
        }

        .lev-doc-explorer__item {
            background: transparent !important;
            border: 0 !important;
            border-radius: 0.22rem !important;
            color: #2f3136 !important;
            cursor: pointer !important;
            font-size: 1rem !important;
            font-weight: 500 !important;
            gap: 0.5rem !important;
            margin-left: 1.4rem !important;
            min-height: 2.05rem !important;
            padding: 0.22rem 0.7rem 0.22rem 1.35rem !important;
            text-align: left !important;
            width: calc(100% - 1.4rem) !important;
        }

        .lev-doc-explorer__item:hover {
            background: #f5f8fb !important;
        }

        .lev-doc-explorer__item.is-active {
            background: #7fc2c6 !important;
        }

        .lev-doc-explorer__item-icon {
            color: #64717f !important;
            flex: 0 0 auto !important;
            height: 1rem !important;
            width: 1rem !important;
        }

        .lev-doc-explorer__item span {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        .lev-doc-explorer__empty {
            border: 1px dashed #cbd6df !important;
            border-radius: 0.5rem !important;
            color: #64717f !important;
            font-size: 0.9rem !important;
            font-weight: 700 !important;
            padding: 1rem !important;
        }

        .lev-doc-explorer__handle {
            align-items: center !important;
            background: #dfe6ec !important;
            border-radius: 999px !important;
            color: #64717f !important;
            display: flex !important;
            font-size: 1.1rem !important;
            font-weight: 900 !important;
            height: 2.35rem !important;
            justify-content: center !important;
            left: 58% !important;
            line-height: 1 !important;
            position: absolute !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 1.1rem !important;
            z-index: 2 !important;
        }

        .lev-doc-explorer__preview {
            border-left: 1px solid #d7e0e8 !important;
            min-width: 0 !important;
            padding-left: 1.65rem !important;
        }

        .lev-doc-preview {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            min-height: clamp(620px, calc(100vh - 17rem), 920px) !important;
        }

        .lev-doc-preview__header {
            justify-content: space-between !important;
            min-height: 4.9rem !important;
            padding: 1.35rem 0 1.1rem !important;
        }

        .lev-doc-preview__header h3 {
            color: #2f3136 !important;
            font-size: 1.05rem !important;
            font-weight: 800 !important;
            margin: 0 !important;
        }

        .lev-doc-preview__actions {
            gap: 1.25rem !important;
            padding-right: 0.25rem !important;
        }

        .lev-doc-preview__action {
            background: transparent !important;
            border: 0 !important;
            color: #2f3136 !important;
            height: 1.75rem !important;
            justify-content: center !important;
            padding: 0 !important;
            width: 1.75rem !important;
        }

        .lev-doc-preview__action:hover {
            color: #5f96c1 !important;
        }

        .lev-doc-preview__action-icon {
            height: 1.05rem !important;
            width: 1.05rem !important;
        }

        .lev-doc-preview__stage {
            background: #2b2d2d !important;
            flex: 1 !important;
            min-height: 0 !important;
            overflow: hidden !important;
        }

        .lev-doc-preview__stage iframe,
        .lev-doc-preview__stage img {
            border: 0 !important;
            display: block !important;
            height: 100% !important;
            object-fit: contain !important;
            width: 100% !important;
        }

        .lev-doc-preview__fallback,
        .lev-doc-preview--empty {
            color: #64717f !important;
            flex-direction: column !important;
            font-weight: 700 !important;
            gap: 0.75rem !important;
            justify-content: center !important;
            min-height: clamp(620px, calc(100vh - 17rem), 920px) !important;
            text-align: center !important;
        }

        .lev-doc-preview__fallback {
            background: #ffffff !important;
            height: 100% !important;
        }

        .lev-doc-preview__fallback-icon {
            color: #8b96a3 !important;
            height: 2rem !important;
            width: 2rem !important;
        }

        @media (max-width: 760px) {
            .lev-doc-explorer {
                grid-template-columns: 1fr !important;
                min-height: 0 !important;
            }

            .lev-doc-explorer__handle {
                display: none !important;
            }

            .lev-doc-explorer__preview {
                border-left: 0 !important;
                border-top: 1px solid #d7e0e8 !important;
                padding-left: 0 !important;
            }
        }
    </style>
@endonce

<div class="lev-doc-explorer-shell">
    <div class="lev-doc-explorer-toolbar">
        {{ $this->addDocumentAction }}
    </div>

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
                $isExternalUrl = Str::startsWith($path, ['http://', 'https://']);
            @endphp

            <button
                class="lev-doc-explorer__item"
                type="button"
                x-bind:class="{ 'is-active': selected === '{{ $document->getKey() }}' }"
                x-on:click="selected = '{{ $document->getKey() }}'"
            >
                <x-filament::icon
                    :icon="$extension === 'pdf' || $isExternalUrl ? 'heroicon-o-document-text' : 'heroicon-o-photo'"
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
                    $isExternalUrl = Str::startsWith($path, ['http://', 'https://']);
                    $fileExists = $isExternalUrl || (filled($path) && Storage::disk('public')->exists($path));
                    $url = $isExternalUrl ? $path : (filled($path) ? Storage::disk('public')->url($path) : null);
                    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    $canPreview = $fileExists && $url && in_array($extension, ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif']);
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
                            @if ($fileExists && $url)
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
                                        Este arquivo era local e não está mais disponível após o deploy. Reenvie o documento para salvá-lo no Vercel Blob.
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
                    <p>Clique em “Adicionar documento” para enviar o primeiro arquivo.</p>
                </div>
            @endforelse
        </section>
    </div>
</div>
