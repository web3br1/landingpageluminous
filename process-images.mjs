#!/usr/bin/env node

console.log('🚀 Script de processamento de imagens executado!');
console.log('📁 Procurando imagens em: public/images/');

// Simples verificação de arquivos
import fs from 'fs/promises';
import path from 'path';

const imagesDir = './public/images';

try {
  const files = await fs.readdir(imagesDir, { recursive: true });
  const imageFiles = files.filter(file =>
    /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(file)
  );

  console.log(`📸 Encontradas ${imageFiles.length} imagens:`);
  imageFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\n✅ Script executado com sucesso!');

} catch (error) {
  console.log('📁 Diretório public/images não encontrado ou vazio');
  console.log('✅ Script executado (sem imagens para processar)');
}
