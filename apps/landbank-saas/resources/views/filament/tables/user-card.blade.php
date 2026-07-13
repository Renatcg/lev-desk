@php
    use App\Filament\Resources\Users\UserResource;

    $record = $getRecord();
    $initials = collect(explode(' ', trim($record->name)))
        ->filter()
        ->take(2)
        ->map(fn (string $part): string => mb_strtoupper(mb_substr($part, 0, 1)))
        ->implode('') ?: 'U';
@endphp

<div class="lev-record-card lev-user-card">
    <div class="lev-user-card__top">
        <div class="lev-user-card__avatar">{{ $initials }}</div>
        <div class="lev-record-card__title">
            <h3>{{ $record->name }}</h3>
            <p>{{ $record->email }}</p>
        </div>
    </div>

    <div class="lev-user-card__meta">
        <span>{{ UserResource::roleLabel($record->role) }}</span>
        <span>{{ $record->company?->name ?? 'Lev' }}</span>
    </div>

    <div class="lev-user-card__footer">
        <span>Criado em {{ $record->created_at?->format('d/m/Y') }}</span>
    </div>
</div>
