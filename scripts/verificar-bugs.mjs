import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';
const ISSUES = {
  consoleErrors: [],
  consoleWarns: [],
  todos: [],
  typeIssues: [],
  missingErrorHandling: [],
  missingLoading: [],
};

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = filePath.replace(/\\/g, '/');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Console errors
      if (line.includes('console.error') && !line.includes('//')) {
        ISSUES.consoleErrors.push({
          file: relativePath,
          line: lineNum,
          code: line.trim(),
        });
      }

      // Console warns
      if (line.includes('console.warn') && !line.includes('//')) {
        ISSUES.consoleWarns.push({
          file: relativePath,
          line: lineNum,
          code: line.trim(),
        });
      }

      // TODOs
      if (line.match(/TODO|FIXME|XXX|HACK/i) && !line.includes('//')) {
        ISSUES.todos.push({
          file: relativePath,
          line: lineNum,
          code: line.trim(),
        });
      }

      // Missing error handling (try sem catch ou catch vazio)
      if (line.includes('try {') || line.includes('try{')) {
        const tryIndex = index;
        let hasCatch = false;
        let catchEmpty = false;
        
        for (let i = tryIndex + 1; i < Math.min(tryIndex + 50, lines.length); i++) {
          if (lines[i].includes('catch')) {
            hasCatch = true;
            // Verificar se catch está vazio
            if (lines[i].includes('catch') && (lines[i].includes('{}') || lines[i + 1]?.trim() === '}')) {
              catchEmpty = true;
            }
            break;
          }
        }

        if (!hasCatch || catchEmpty) {
          ISSUES.missingErrorHandling.push({
            file: relativePath,
            line: lineNum,
            code: line.trim(),
          });
        }
      }

      // Missing loading states (queries sem isLoading check)
      if (line.includes('useQuery') || line.includes('useMutation')) {
        const queryName = line.match(/(useQuery|useMutation)\s*\(/)?.[0];
        if (queryName) {
          // Verificar se há isLoading sendo usado
          const hasLoading = content.includes('isLoading') || content.includes('loading');
          if (!hasLoading && !relativePath.includes('LoadingState')) {
            ISSUES.missingLoading.push({
              file: relativePath,
              line: lineNum,
              code: line.trim(),
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Pular node_modules e outros
      if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('🔍 Verificando código para bugs e problemas comuns...\n');
scanDirectory(SRC_DIR);

console.log('📊 RESUMO DE PROBLEMAS ENCONTRADOS\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (ISSUES.consoleErrors.length > 0) {
  console.log(`❌ Console Errors: ${ISSUES.consoleErrors.length}`);
  ISSUES.consoleErrors.slice(0, 5).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
    console.log(`   ${issue.code.substring(0, 80)}...`);
  });
  if (ISSUES.consoleErrors.length > 5) {
    console.log(`   ... e mais ${ISSUES.consoleErrors.length - 5}`);
  }
  console.log('');
}

if (ISSUES.consoleWarns.length > 0) {
  console.log(`⚠️  Console Warnings: ${ISSUES.consoleWarns.length}`);
  ISSUES.consoleWarns.slice(0, 5).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
  });
  if (ISSUES.consoleWarns.length > 5) {
    console.log(`   ... e mais ${ISSUES.consoleWarns.length - 5}`);
  }
  console.log('');
}

if (ISSUES.todos.length > 0) {
  console.log(`📝 TODOs/FIXMEs: ${ISSUES.todos.length}`);
  ISSUES.todos.slice(0, 10).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
    console.log(`   ${issue.code.substring(0, 80)}...`);
  });
  if (ISSUES.todos.length > 10) {
    console.log(`   ... e mais ${ISSUES.todos.length - 10}`);
  }
  console.log('');
}

if (ISSUES.missingErrorHandling.length > 0) {
  console.log(`⚠️  Possível falta de tratamento de erro: ${ISSUES.missingErrorHandling.length}`);
  ISSUES.missingErrorHandling.slice(0, 5).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
  });
  console.log('');
}

if (ISSUES.missingLoading.length > 0) {
  console.log(`⏳ Possível falta de loading state: ${ISSUES.missingLoading.length}`);
  ISSUES.missingLoading.slice(0, 5).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
  });
  console.log('');
}

const total = 
  ISSUES.consoleErrors.length +
  ISSUES.consoleWarns.length +
  ISSUES.todos.length +
  ISSUES.missingErrorHandling.length +
  ISSUES.missingLoading.length;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📊 Total de problemas encontrados: ${total}\n`);

if (total === 0) {
  console.log('✅ Nenhum problema encontrado!');
} else {
  console.log('💡 Priorize corrigir console.errors e falta de tratamento de erro.');
}
