<?php

namespace App\Services;

use App\Models\LandPlot;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class LevAiAssistant
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function answer(User $user, array $messages): string
    {
        if (blank(config('services.openai.key'))) {
            return 'A IA ainda não está conectada. Configure OPENAI_API_KEY no Railway e faça o redeploy para eu responder usando os dados cadastrados.';
        }

        $plots = $this->plotsFor($user);

        if ($plots->isEmpty()) {
            return 'Ainda não encontrei terrenos cadastrados para sua empresa. Cadastre o primeiro terreno para eu conseguir consultar documentos, viabilidade, IPTU e lançamentos.';
        }

        try {
            $response = Http::withToken(config('services.openai.key'))
                ->acceptJson()
                ->asJson()
                ->timeout(45)
                ->post('https://api.openai.com/v1/responses', [
                    'model' => config('services.openai.model'),
                    'input' => $this->inputFor($user, $plots, $messages),
                    'max_output_tokens' => 900,
                ]);
        } catch (Throwable $exception) {
            Log::warning('Lev AI request failed.', ['message' => $exception->getMessage()]);

            return 'Tive uma falha ao chamar a IA agora. Tente novamente em alguns instantes.';
        }

        if ($response->failed()) {
            Log::warning('Lev AI returned an error.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return 'A IA retornou um erro agora. Verifique se OPENAI_API_KEY e OPENAI_MODEL estão corretos no Railway.';
        }

        return $this->textFromResponse($response->json()) ?: 'A IA respondeu sem texto. Tente reformular a pergunta.';
    }

    /**
     * @return Collection<int, LandPlot>
     */
    protected function plotsFor(User $user): Collection
    {
        return LandPlot::query()
            ->with(['company', 'documents', 'viability'])
            ->when(! $user->isLevAdmin(), fn ($query) => $query->where('company_id', $user->company_id))
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  Collection<int, LandPlot>  $plots
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<int, array{role: string, content: string}>
     */
    protected function inputFor(User $user, Collection $plots, array $messages): array
    {
        return [
            [
                'role' => 'developer',
                'content' => implode("\n", [
                    'Você é a IA da Lev para gestão de landbank.',
                    'Responda em português do Brasil, de forma objetiva e operacional.',
                    'Use exclusivamente o contexto cadastrado enviado nesta requisição.',
                    'Nunca invente dados ausentes. Quando faltar dado, diga que não está cadastrado.',
                    'Nunca misture empresas. Se o contexto trouxer uma empresa, responda só sobre ela.',
                    'Se o contexto trouxer múltiplas empresas, agrupe por empresa e não consolide dados entre empresas sem pedido explícito.',
                    'Para perguntas sobre lançamentos, use mês de lançamento da viabilidade.',
                ]),
            ],
            [
                'role' => 'user',
                'content' => "Usuário: {$user->name} ({$user->email}). Empresa do usuário: ".($user->company?->name ?? 'Lev/Admin').".\n\nContexto cadastrado:\n".$this->contextFor($plots),
            ],
            ...array_slice($messages, -8),
        ];
    }

    /**
     * @param  Collection<int, LandPlot>  $plots
     */
    protected function contextFor(Collection $plots): string
    {
        return $plots
            ->map(function (LandPlot $plot): string {
                $viability = $plot->viability;

                $documents = $plot->documents
                    ->map(fn ($document): string => sprintf(
                        '%s (%s, status %s, vencimento %s)',
                        $document->name,
                        $document->type,
                        $document->status,
                        $document->expires_at?->format('d/m/Y') ?? 'não informado'
                    ))
                    ->implode('; ');

                return sprintf(
                    "- Terreno: %s\n  Empresa: %s\n  Status: %s\n  RGI: %s\n  Proprietário: %s\n  Área: %s m²\n  Endereço: %s\n  IPTU: %s\n  Dívida conhecida: %s\n  Documentos: %s\n  Viabilidade: empreendimento %s; valor terreno %s; VGV %s; unidades %s; padrão %s; lançamento %s; área vendável %s m²; premissas %s",
                    $plot->name,
                    $plot->company?->name ?? 'não informada',
                    $plot->status ?? 'não informado',
                    $plot->registry_number ?? 'não informado',
                    $plot->owner_name ?? 'não informado',
                    $plot->area_sqm ?? 'não informada',
                    collect([$plot->street, $plot->number, $plot->district, $plot->city, $plot->state, $plot->zip_code])->filter()->implode(', ') ?: 'não informado',
                    $plot->iptu_due_date?->format('d/m/Y') ?? 'não informado',
                    filled($plot->known_debt_amount) ? 'R$ '.number_format((float) $plot->known_debt_amount, 2, ',', '.') : 'não informada',
                    $documents ?: 'nenhum documento cadastrado',
                    $viability?->project_name ?? 'não informado',
                    filled($viability?->land_value) ? 'R$ '.number_format((float) $viability->land_value, 2, ',', '.') : 'não informado',
                    filled($viability?->vgv) ? 'R$ '.number_format((float) $viability->vgv, 2, ',', '.') : 'não informado',
                    $viability?->units_count ?? 'não informado',
                    $viability?->standard ?? 'não informado',
                    $viability?->launch_month?->format('m/Y') ?? 'não informado',
                    $viability?->sellable_area_sqm ?? 'não informada',
                    $viability?->assumptions ?? 'não informadas',
                );
            })
            ->implode("\n\n");
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function textFromResponse(array $payload): ?string
    {
        if (filled($payload['output_text'] ?? null)) {
            return trim((string) $payload['output_text']);
        }

        return collect($payload['output'] ?? [])
            ->flatMap(fn ($item) => $item['content'] ?? [])
            ->pluck('text')
            ->filter()
            ->implode("\n");
    }
}
