<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\LandPlot;
use App\Models\PlotDocument;
use App\Models\PlotViability;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $company = Company::firstOrCreate(
            ['document' => '00.000.000/0001-00'],
            [
                'name' => 'LEV Demo Incorporadora',
                'email' => 'demo@levlandbank.test',
                'phone' => '(21) 99999-0000',
                'plan' => 'free',
                'status' => 'active',
            ],
        );

        $plot = LandPlot::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Terreno Centro - Lote A'],
            [
                'status' => 'under_review',
                'registry_number' => 'RGI 12345',
                'area_sqm' => 2450.75,
                'owner_name' => 'Espólio Exemplo',
                'city' => 'Rio de Janeiro',
                'state' => 'RJ',
                'iptu_due_date' => now()->addMonths(2)->toDateString(),
                'known_debt_amount' => 18500,
                'known_debt_notes' => 'Débito informado manualmente, pendente de conferência.',
            ],
        );

        PlotViability::firstOrCreate(
            ['land_plot_id' => $plot->id],
            [
                'project_name' => 'Residencial Centro Lev',
                'land_value' => 3200000,
                'vgv' => 18500000,
                'units_count' => 96,
                'standard' => 'standard',
                'launch_month' => now()->addMonths(8)->startOfMonth()->toDateString(),
                'sellable_area_sqm' => 6200,
                'assumptions' => 'Dados de demonstração para validar a esteira de lançamento.',
            ],
        );

        PlotDocument::firstOrCreate(
            ['land_plot_id' => $plot->id, 'type' => 'rgi'],
            [
                'name' => 'RGI demonstrativo',
                'path' => 'plot-documents/demo-rgi.pdf',
                'status' => 'pending_review',
            ],
        );
    }
}
