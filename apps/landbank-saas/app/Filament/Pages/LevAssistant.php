<?php

namespace App\Filament\Pages;

use App\Models\LandPlot;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;

class LevAssistant extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftRight;

    protected static ?string $navigationLabel = 'IA da Lev';

    protected static ?string $title = 'IA da Lev';

    protected static ?string $slug = '/';

    protected string $view = 'filament.pages.lev-assistant';

    public string $message = '';

    /** @var array<int, array{role: string, content: string}> */
    public array $messages = [];

    public function mount(): void
    {
        $this->messages = [
            [
                'role' => 'assistant',
                'content' => 'Olá. Eu sou a IA da Lev. Posso consultar terrenos, documentos, IPTU, dívidas e lançamentos previstos com base apenas nos dados da sua empresa.',
            ],
        ];
    }

    public function send(): void
    {
        $question = trim($this->message);

        if ($question === '') {
            return;
        }

        $this->messages[] = ['role' => 'user', 'content' => $question];
        $this->messages[] = ['role' => 'assistant', 'content' => $this->answer($question)];
        $this->message = '';
    }

    protected function answer(string $question): string
    {
        $plots = LandPlot::query()
            ->with(['documents', 'viability'])
            ->when(! auth()->user()?->isLevAdmin(), fn ($query) => $query->where('company_id', auth()->user()?->company_id))
            ->orderBy('name')
            ->get();

        if ($plots->isEmpty()) {
            return 'Ainda não encontrei terrenos cadastrados para sua empresa. Cadastre o primeiro terreno em Landbank > Terrenos, ou envie RGI/certidão e viabilidade quando o fluxo de IA documental estiver conectado.';
        }

        $question = mb_strtolower($question);

        if (str_contains($question, 'lançamento') || str_contains($question, 'lancamento')) {
            $launches = $plots
                ->filter(fn ($plot) => $plot->viability?->launch_month)
                ->sortBy(fn ($plot) => $plot->viability->launch_month)
                ->map(fn ($plot) => sprintf(
                    '%s: %s (%s, %s unidades, VGV %s)',
                    $plot->viability->launch_month->format('m/Y'),
                    $plot->viability->project_name ?: $plot->name,
                    $plot->name,
                    $plot->viability->units_count ?: '-',
                    $plot->viability->vgv ? 'R$ ' . number_format((float) $plot->viability->vgv, 2, ',', '.') : 'não informado'
                ))
                ->values();

            return $launches->isEmpty()
                ? 'Não há mês de lançamento cadastrado nas viabilidades dos terrenos da sua empresa.'
                : "Esteira de lançamentos cadastrada:\n- " . $launches->implode("\n- ");
        }

        if (str_contains($question, 'documento') || str_contains($question, 'certid') || str_contains($question, 'rgi')) {
            $pending = $plots
                ->map(fn ($plot) => sprintf(
                    '%s: %s documento(s), %s pendente(s) de revisão',
                    $plot->name,
                    $plot->documents->count(),
                    $plot->documents->where('status', 'pending_review')->count()
                ))
                ->values();

            return "Resumo documental:\n- " . $pending->implode("\n- ");
        }

        if (str_contains($question, 'iptu') || str_contains($question, 'dívida') || str_contains($question, 'divida')) {
            $items = $plots
                ->filter(fn ($plot) => $plot->iptu_due_date || $plot->known_debt_amount)
                ->map(fn ($plot) => sprintf(
                    '%s: IPTU %s, dívida conhecida %s',
                    $plot->name,
                    $plot->iptu_due_date?->format('d/m/Y') ?: 'não informado',
                    $plot->known_debt_amount ? 'R$ ' . number_format((float) $plot->known_debt_amount, 2, ',', '.') : 'não informada'
                ))
                ->values();

            return $items->isEmpty()
                ? 'Não há vencimentos de IPTU ou dívidas pregressas cadastradas para os terrenos da sua empresa.'
                : "IPTU e dívidas cadastradas:\n- " . $items->implode("\n- ");
        }

        $totalArea = $plots->sum(fn ($plot) => (float) ($plot->area_sqm ?? 0));
        $totalVgv = $plots->sum(fn ($plot) => (float) ($plot->viability?->vgv ?? 0));
        $totalUnits = $plots->sum(fn ($plot) => (int) ($plot->viability?->units_count ?? 0));

        return sprintf(
            "Sua empresa tem %s terreno(s) cadastrados, %s m² de área informada, VGV potencial de %s e %s unidade(s) previstas. Posso detalhar lançamentos, documentos, IPTU/dívidas ou um terreno específico.",
            $plots->count(),
            number_format($totalArea, 2, ',', '.'),
            $totalVgv > 0 ? 'R$ ' . number_format($totalVgv, 2, ',', '.') : 'não informado',
            $totalUnits
        );
    }
}
