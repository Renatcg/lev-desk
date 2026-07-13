<?php

namespace App\Services;

use App\Models\PlotDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

class VercelBlobStorage
{
    public function enabled(): bool
    {
        return filled(config('services.vercel_blob.token'));
    }

    /**
     * @return array{url: string, pathname?: string}
     */
    public function uploadPlotDocument(PlotDocument $document): array
    {
        $path = (string) $document->path;

        if ($this->isUrl($path)) {
            return ['url' => $path];
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            throw new RuntimeException("Document file was not found on the public disk: {$path}");
        }

        $absolutePath = $disk->path($path);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $filename = Str::slug(pathinfo($path, PATHINFO_FILENAME)) ?: 'documento';
        $pathname = collect([
            trim((string) config('services.vercel_blob.prefix', 'landbank'), '/'),
            'plot-documents',
            (string) $document->land_plot_id,
            Str::uuid().'-'.$filename.($extension ? ".{$extension}" : ''),
        ])->filter()->implode('/');

        $result = $this->run([
            'put',
            $pathname,
            $absolutePath,
            mime_content_type($absolutePath) ?: 'application/octet-stream',
        ]);

        if (blank($result['url'] ?? null)) {
            throw new RuntimeException('Vercel Blob upload did not return a URL.');
        }

        return $result;
    }

    public function delete(string $urlOrPathname): void
    {
        if (blank($urlOrPathname) || ! $this->enabled()) {
            return;
        }

        $this->run(['del', $urlOrPathname]);
    }

    public function isUrl(?string $path): bool
    {
        return filled($path) && Str::startsWith($path, ['http://', 'https://']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function run(array $arguments): array
    {
        $script = base_path('scripts/vercel-blob.mjs');

        $process = new Process(
            array_merge([(string) config('services.vercel_blob.node_binary', 'node'), $script], $arguments),
            base_path(),
            [
                'BLOB_READ_WRITE_TOKEN' => (string) config('services.vercel_blob.token'),
                'VERCEL_BLOB_ACCESS' => (string) config('services.vercel_blob.access', 'public'),
            ],
        );

        $process->setTimeout(180);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'Vercel Blob command failed.');
        }

        $decoded = json_decode($process->getOutput(), true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Vercel Blob command returned invalid JSON.');
        }

        return $decoded;
    }
}
