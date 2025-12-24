#!/usr/bin/env node

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Credenciais Supabase
const SUPABASE_HOST = 'db.yyybnzgnfdcnhcluiduh.supabase.co';
const SUPABASE_PORT = 5432;
const SUPABASE_DB = 'postgres';
const SUPABASE_USER = 'postgres';
const SUPABASE_PASSWORD = '#@R3n4t0#@c.C!';

console.log('🚀 Iniciando migração do banco de dados...\n');

try {
  // Criar conexão
  const sql = postgres({
    host: SUPABASE_HOST,
    port: SUPABASE_PORT,
    database: SUPABASE_DB,
    username: SUPABASE_USER,
    password: SUPABASE_PASSWORD,
    ssl: 'require',
  });

  console.log('✅ Conectado ao Supabase\n');

  // Ler arquivo de migração
  const migrationFile = path.join(
    __dirname,
    '../supabase/migrations/20251223233413_create_contas_receber_tables.sql'
  );

  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Total de comandos SQL: ${statements.length}\n`);

  // Executar cada statement
  let successCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      console.log(`[${i + 1}/${statements.length}] Executando...`);
      await sql.unsafe(statement);
      console.log(`✅ Sucesso!\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Erro: ${error.message}\n`);
    }
  }

  console.log(`\n🎉 Migração concluída!`);
  console.log(`✅ ${successCount}/${statements.length} comandos executados com sucesso\n`);

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Erro na migração:', error.message);
  process.exit(1);
}
