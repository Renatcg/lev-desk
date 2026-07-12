<?php

return [
    'temporary_file_upload' => [
        'disk' => env('LIVEWIRE_TEMP_DISK', 'public'),
        'rules' => ['required', 'file', 'max:20480'],
        'directory' => env('LIVEWIRE_TEMP_DIRECTORY', 'livewire-tmp'),
        'middleware' => 'throttle:60,1',
        'preview_mimes' => [
            'png', 'gif', 'bmp', 'svg', 'wav', 'mp4',
            'mov', 'avi', 'wmv', 'mp3', 'm4a',
            'jpg', 'jpeg', 'mpga', 'webp', 'wma',
            'pdf',
        ],
        'max_upload_time' => 10,
        'cleanup' => true,
    ],
];
