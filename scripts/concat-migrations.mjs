#!/usr/bin/env node
/**
 * Concatena todas as migrations em ordem cronológica
 * para criar um schema baseline único
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const MIGRATIONS_DIR = 'supabase/migrations';
const OUTPUT_DIR = 'infra/migrations';

async function main() {
  console.log('🔧 Concatenando migrations para schema baseline...\n');

  // Criar diretório de saída
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Ler todas as migrations
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ordem alfabética = ordem cronológica (YYYYMM...)

  console.log(`📁 Encontradas ${sqlFiles.length} migrations`);

  // Concatenar todo o conteúdo
  let fullSchema = `-- StudioOS V5 - Schema Baseline
-- Gerado em: ${new Date().toISOString()}
-- Total de migrations: ${sqlFiles.length}
-- 
-- ATENÇÃO: Este é o schema completo consolidado.
-- Para recriar o banco do zero, execute este arquivo.

`;

  // Adicionar comando para limpar tudo (opcional, mas útil para restore)
  fullSchema += `-- Desabilitar RLS temporariamente durante o setup\n`;
  fullSchema += `SET session_replication_role = 'replica';\n\n`;

  for (const file of sqlFiles) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    fullSchema += `\n-- ============================================\n`;
    fullSchema += `-- Migration: ${file}\n`;
    fullSchema += `-- ============================================\n\n`;
    fullSchema += content;
    fullSchema += '\n\n';
  }

  // Reabilitar RLS
  fullSchema += `-- Reabilitar RLS\n`;
  fullSchema += `SET session_replication_role = 'origin';\n`;

  // Salvar arquivo
  const outputFile = join(OUTPUT_DIR, '00000000000000_baseline_schema.sql');
  await writeFile(outputFile, fullSchema);

  const stats = fullSchema.length;
  const lines = fullSchema.split('\n').length;

  console.log(`✅ Schema baseline criado:`);
  console.log(`   Arquivo: ${outputFile}`);
  console.log(`   Tamanho: ${(stats / 1024).toFixed(2)} KB`);
  console.log(`   Linhas: ${lines}`);
  console.log(`   Migrations incluídas: ${sqlFiles.length}`);

  // Criar também um arquivo de metadados
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalMigrations: sqlFiles.length,
    firstMigration: sqlFiles[0],
    lastMigration: sqlFiles[sqlFiles.length - 1],
    sizeBytes: stats,
    sizeKB: (stats / 1024).toFixed(2),
    migrations: sqlFiles
  };

  await writeFile(
    join(OUTPUT_DIR, 'baseline-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`\n📄 Metadados salvos em: ${join(OUTPUT_DIR, 'baseline-metadata.json')}`);
}

main().catch(console.error);
