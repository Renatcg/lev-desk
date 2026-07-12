<?php

namespace App\Filament\Pages;

use App\Services\LevAiAssistant;
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
        $this->messages[] = [
            'role' => 'assistant',
            'content' => app(LevAiAssistant::class)->answer(auth()->user(), $this->messages),
        ];
        $this->message = '';
    }
}
