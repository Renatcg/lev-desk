@php
    use Illuminate\Support\Facades\Storage;
    use Illuminate\Support\Str;

    $record = $getRecord();
    $documents = $record?->documents()
        ->orderBy('type')
        ->orderBy('name')
        ->get() ?? collect();

    $typeLabels = [
        'rgi' => 'RGI / Matrícula',
        'topography' => 'Topografia',
        'certificate' => 'Certidões',
        'cnd' => 'CND',
        'iptu' => 'IPTU',
        'viability' => 'Viabilidade',
        'contract' => 'Contratos',
        'other' => 'Outros',
    ];
@endphp

<div
    class="lev-doc-explorer"
    x-data="{ selected: '{{ $documents->first()?->getKey() }}' }"
>
    <aside class="lev-doc-explorer__tree">
        <div class="lev-doc-explorer__folder">
            <x-filament::icon icon="heroicon-o-folder-open" class="lev-doc-explorer__folder-icon" />
            <span>Docs {{ $record?->name ?? 'do terreno' }}</span>
        </div>

        @forelse ($documents->groupBy('type') as $type => $items)
            <div class="lev-doc-explorer__group">
                <div class="lev-doc-explorer__group-title">
                    {{ $typeLabels[$type] ?? Str::headline((string) $type) }}
                    <span>{{ $items->count() }}</span>
                </div>

                @foreach ($items as $document)
                    @php
                        $path = (string) $document->path;
                        $url = filled($path) ? Storage::disk('public')->url($path) : null;
                        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                        $canPreview = $url && in_array($extension, ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif']);
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
                @endforeach
            </div>
        @empty
            <div class="lev-doc-explorer__empty">
                Nenhum documento salvo ainda.
            </div>
        @endforelse
    </aside>

    <section class="lev-doc-explorer__preview">
        @forelse ($documents as $document)
            @php
                $path = (string) $document->path;
                $url = filled($path) ? Storage::disk('public')->url($path) : null;
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
                        <p>
                            {{ $typeLabels[$document->type] ?? Str::headline((string) $document->type) }}
                            @if ($document->expires_at)
                                · Vence em {{ $document->expires_at->format('d/m/Y') }}
                            @endif
                        </p>
                    </div>

                    @if ($url)
                        <a class="lev-doc-preview__open" href="{{ $url }}" target="_blank" rel="noopener noreferrer">
                            <x-filament::icon icon="heroicon-o-arrow-top-right-on-square" class="lev-doc-preview__open-icon" />
                            <span>Abrir</span>
                        </a>
                    @endif
                </header>

                <div class="lev-doc-preview__stage">
                    @if ($canPreview && $extension === 'pdf')
                        <iframe src="{{ $url }}#toolbar=1&navpanes=0"></iframe>
                    @elseif ($canPreview)
                        <img src="{{ $url }}" alt="{{ $document->name }}">
                    @else
                        <div class="lev-doc-preview__fallback">
                            <x-filament::icon icon="heroicon-o-document" class="lev-doc-preview__fallback-icon" />
                            <p>Este tipo de arquivo não tem visualização embutida.</p>
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
