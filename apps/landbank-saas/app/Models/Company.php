<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'document',
        'email',
        'phone',
        'plan',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function landPlots(): HasMany
    {
        return $this->hasMany(LandPlot::class);
    }

    public function emailDomain(): ?string
    {
        $email = strtolower((string) $this->email);

        if (! str_contains($email, '@')) {
            return null;
        }

        return substr(strrchr($email, '@'), 1) ?: null;
    }
}
