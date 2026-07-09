<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('app:create-lev-user')]
#[Description('Create a tenant user or LEV admin for the Landbank panel')]
class CreateLevUser extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->ask('E-mail do usuário');
        $name = $this->ask('Nome', 'Admin');
        $password = $this->secret('Senha');
        $companyName = $this->ask('Empresa', 'LEV Demo Incorporadora');
        $role = $this->choice('Perfil', ['company_admin', 'company_editor', 'company_viewer', 'lev_admin'], 0);

        if (! $email || ! $password) {
            $this->error('E-mail e senha são obrigatórios.');

            return self::FAILURE;
        }

        $company = Company::firstOrCreate(
            ['name' => $companyName],
            [
                'email' => $email,
                'plan' => 'free',
                'status' => 'active',
            ],
        );

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'company_id' => $company->id,
                'name' => $name,
                'password' => Hash::make($password),
                'role' => $role,
            ],
        );

        $this->info("Usuário {$user->email} criado/atualizado para {$company->name}.");

        return self::SUCCESS;
    }
}
