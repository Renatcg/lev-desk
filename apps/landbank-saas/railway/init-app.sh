#!/usr/bin/env sh
set -e

mkdir -p \
  bootstrap/cache \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs

php artisan storage:link || true
php artisan migrate --force
php artisan vendor:publish --tag=filament-assets --force || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
