/**
 * Script para importar solicitações de visita do Lovable
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';
const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';

function findCSVFile(baseName) {
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`⚠️ Pasta não encontrada: ${CSV_PATH}`);
    return null;
  }
  const files = fs.readdirSync(CSV_PATH);
  const found = files.find(f => f.toLowerCase().includes(baseName.toLowerCase()) && f.endsWith('.csv'));
  return found ? path.join(CSV_PATH, found) : null;
}

function parseCSVLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  let headerLine = lines[0];
  if (headerLine.match(/^\s*\d+\|/)) {
    headerLine = headerLine.replace(/^\s*\d+\|/, '');
  }
  
  const headers = parseCSVLine(headerLine, separator).map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^\s*\d+\|/)) {
      line = line.replace(/^\s*\d+\|/, '');
    }
    
    const values = parseCSVLine(line, separator);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      if (value === '' || value === 'null' || value === 'NULL' || value === undefined) {
        value = null;
      }
      
      row[header] = value;
    });
    
    rows.push(row);
  }
  
  return rows;
}

async function main() {
  console.log('📥 Importando Solicitações de Visita...\n');

  // Procurar arquivo CSV
  const csvFile = findCSVFile('solicitacoes_visita') || findCSVFile('solicitacoes-visita') || findCSVFile('visita');
  
  if (!csvFile) {
    // Tentar caminho específico fornecido pelo usuário
    const specificPath = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS\\solicitacoes_visita-export-2026-01-14_14-12-31.csv';
    if (fs.existsSync(specificPath)) {
      csvFile = specificPath;
    } else {
      console.log('❌ Arquivo CSV de solicitações de visita não encontrado!');
      console.log(`   Procurando em: ${CSV_PATH}`);
      console.log('   Nomes esperados: solicitacoes_visita, solicitacoes-visita, visita');
      return;
    }
  }

  console.log(`✅ Arquivo encontrado: ${path.basename(csvFile)}\n`);

  // Parse CSV
  const rows = parseCSV(csvFile);
  console.log(`📊 Total de linhas no CSV: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('⚠️ Nenhuma linha encontrada no CSV');
    return;
  }

  // Verificar estrutura da tabela
  const { data: sample } = await supabase
    .from('solicitacoes_visita')
    .select('*')
    .limit(1);

  if (!sample || sample.length === 0) {
    console.log('📋 Estrutura esperada da tabela solicitacoes_visita:');
    console.log('   - id (UUID)');
    console.log('   - nome (TEXT)');
    console.log('   - telefone (TEXT)');
    console.log('   - email (TEXT, opcional)');
    console.log('   - endereco (TEXT)');
    console.log('   - cidade (TEXT)');
    console.log('   - estado (TEXT, opcional)');
    console.log('   - cep (TEXT, opcional)');
    console.log('   - data_agendada (DATE)');
    console.log('   - observacoes (TEXT, opcional)');
    console.log('   - visualizada (BOOLEAN, default false)');
    console.log('   - organization_id (UUID)');
    console.log('   - created_at (TIMESTAMPTZ)\n');
  }

  // Mapear colunas do CSV para a tabela (baseado no CSV fornecido)
  const mappedRows = rows.map((row, index) => {
    // Mapear campos do CSV fornecido (baseado na estrutura real da tabela)
    const enderecoCompleto = [row.endereco, row.complemento].filter(Boolean).join(', ');
    
    const mapped = {
      id: row.id || null,
      nome: row.nome || '',
      telefone: row.telefone || '',
      email: row.email || '',
      cidade: row.cidade || '',
      endereco: enderecoCompleto || null,
      complemento: row.complemento || null,
      mensagem: row.mensagem || null,
      data_agendada: row.data_agendada || null,
      horario_agendado: row.horario_agendado || '',
      status: row.status || 'pendente',
      visualizada: row.visualizada === 'true' || row.visualizada === true || row.visualizada === 'True' || false,
      visualizada_em: row.visualizada_em || null,
      visualizada_por: row.visualizada_por || null,
      observacoes_internas: row.observacoes_internas || null,
      organization_id: row.organization_id || ORG_PRISMA,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    };

    // Validar campos obrigatórios
    if (!mapped.nome || !mapped.telefone || !mapped.cidade) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: campos obrigatórios faltando (nome: ${mapped.nome}, telefone: ${mapped.telefone}, cidade: ${mapped.cidade})`);
      return null;
    }

    // Converter data_agendada se necessário
    if (mapped.data_agendada) {
      try {
        // Se já está no formato YYYY-MM-DD, usar diretamente
        if (mapped.data_agendada.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Já está no formato correto
        } else {
          const date = new Date(mapped.data_agendada);
          if (isNaN(date.getTime())) {
            mapped.data_agendada = null;
          } else {
            mapped.data_agendada = date.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        mapped.data_agendada = null;
      }
    }

    // Converter visualizada_em se necessário
    if (mapped.visualizada_em) {
      try {
        const date = new Date(mapped.visualizada_em);
        if (isNaN(date.getTime())) {
          mapped.visualizada_em = null;
        }
      } catch (e) {
        mapped.visualizada_em = null;
      }
    }

    return mapped;
  }).filter(r => r !== null);

  console.log(`✅ ${mappedRows.length} registros válidos para importar\n`);

  if (mappedRows.length === 0) {
    console.log('❌ Nenhum registro válido encontrado');
    return;
  }

  // Inserir em lotes
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
    const batch = mappedRows.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('solicitacoes_visita')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${data?.length || 0} registros inseridos`);
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Inseridos: ${inserted}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📝 Total processado: ${mappedRows.length}\n`);
}

main().catch(console.error);
