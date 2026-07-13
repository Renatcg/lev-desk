@php
    $record = $getRecord();
    $statusLabels = [
        'prospecting' => 'Prospecção',
        'under_review' => 'Em análise',
        'negotiating' => 'Negociando',
        'acquired' => 'Adquirido',
        'archived' => 'Arquivado',
    ];

    $address = collect([
        trim(collect([$record->street, $record->number])->filter()->implode(', ')),
        $record->district,
        $record->city,
    ])->filter()->implode(' - ');
@endphp

<div class="lev-record-card lev-landbank-card">
    <div class="lev-record-card__top">
        <div class="lev-record-card__handle" aria-hidden="true">⋮⋮</div>
        <div class="lev-record-card__title">
            <h3>{{ $record->name }}</h3>
            <p>{{ $record->company?->name ?? 'Terreno' }}</p>
        </div>
        <span class="lev-record-card__badge">{{ $statusLabels[$record->status] ?? $record->status }}</span>
    </div>

    <div class="lev-record-card__body">
        <p class="lev-record-card__address">
            {{ $address ?: 'Endereço não informado' }}
        </p>

        <div class="lev-record-card__metrics">
            <span>
                <strong>{{ $record->area_sqm ? number_format((float) $record->area_sqm, 0, ',', '.') . ' m²' : '-' }}</strong>
                Área
            </span>
            <span>
                <strong>{{ $record->viability?->launch_month?->format('m/Y') ?? '-' }}</strong>
                Lançamento
            </span>
            <span>
                <strong>{{ $record->viability?->vgv ? 'R$ ' . number_format((float) $record->viability->vgv, 0, ',', '.') : '-' }}</strong>
                VGV
            </span>
        </div>
    </div>
</div>
