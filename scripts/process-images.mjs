#!/usr/bin/env node

/**
 * Asset Processing Script - conforme .cursorrules seção 19
 *
 * Converte imagens para WebP, gera blur placeholders LQIP,
 * otimiza tamanhos e cria fallbacks
 *
 * Uso: node scripts/process-images.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  inputDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../public/images/optimized'),
  formats: ['webp', 'avif'],
  quality: {
    webp: 85,
    avif: 80,
    jpg: 85,
    png: 90
  },
  sizes: {
    hero: { width: 1600, height: 1000 },
    logo: { width: 400, height: 160 },
    thumbnail: { width: 400, height: 300 },
    avatar: { width: 100, height: 100 }
  },
  blur: {
    width: 10,
    quality: 20
  }
};

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function getFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else if (entry.isFile() && /\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function generateBlurData(inputPath, outputPath) {
  const buffer = await sharp(inputPath)
    .resize(config.blur.width, null, { withoutEnlargement: true })
    .jpeg({ quality: config.blur.quality })
    .toBuffer();

  const base64 = buffer.toString('base64');
  const blurDataURL = `data:image/jpeg;base64,${base64}`;

  await fs.writeFile(outputPath, blurDataURL);
  return blurDataURL;
}

async function processImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const relativePath = path.relative(config.inputDir, path.dirname(inputPath));
  const outputSubDir = path.join(outputDir, relativePath);

  await ensureDir(outputSubDir);

  console.log(`📸 Processando: ${inputPath}`);

  const sharpInstance = sharp(inputPath);
  const metadata = await sharpInstance.metadata();

  // Determinar categoria baseada no caminho
  const category = relativePath.includes('hero') ? 'hero'
                 : relativePath.includes('logo') ? 'logo'
                 : relativePath.includes('avatar') ? 'avatar'
                 : 'thumbnail';

  const size = config.sizes[category];

  // Gerar WebP otimizado
  const webpPath = path.join(outputSubDir, `${filename}.webp`);
  await sharpInstance
    .resize(size.width, size.height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true
    })
    .webp({ quality: config.quality.webp })
    .toFile(webpPath);

  // Gerar AVIF otimizado
  const avifPath = path.join(outputSubDir, `${filename}.avif`);
  await sharpInstance
    .resize(size.width, size.height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true
    })
    .avif({ quality: config.quality.avif })
    .toFile(avifPath);

  // Gerar blur placeholder
  const blurPath = path.join(outputSubDir, `${filename}.blur.txt`);
  const blurDataURL = await generateBlurData(inputPath, blurPath);

  // Manter original se necessário
  const originalPath = path.join(outputSubDir, `${filename}${path.extname(inputPath)}`);
  await fs.copyFile(inputPath, originalPath);

  return {
    original: path.relative(path.join(__dirname, '../public'), originalPath),
    webp: path.relative(path.join(__dirname, '../public'), webpPath),
    avif: path.relative(path.join(__dirname, '../public'), avifPath),
    blurDataURL,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    }
  };
}

async function generateManifest(processedImages) {
  const manifest = {
    processedAt: new Date().toISOString(),
    totalImages: processedImages.length,
    images: processedImages,
    config
  };

  const manifestPath = path.join(config.outputDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`📋 Manifesto gerado: ${manifestPath}`);
}

async function main() {
  console.log('🚀 Iniciando processamento de assets...\n');

  try {
    await ensureDir(config.outputDir);

    const inputFiles = await getFiles(config.inputDir);
    console.log(`📁 Encontradas ${inputFiles.length} imagens para processar\n`);

    const processedImages = [];

    for (const file of inputFiles) {
      try {
        const result = await processImage(file, config.outputDir);
        processedImages.push({
          input: path.relative(config.inputDir, file),
          ...result
        });
      } catch (error) {
        console.error(`❌ Erro processando ${file}:`, error.message);
      }
    }

    await generateManifest(processedImages);

    console.log(`\n✅ Processamento concluído! ${processedImages.length} imagens otimizadas`);
    console.log(`📂 Arquivos salvos em: ${config.outputDir}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

main();