#!/usr/bin/env node

/**
 * Fix Content Syntax Errors
 * Remove duplicate commas and fix syntax issues caused by tracking addition
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const CONTENT_DIR = 'domains/marketing/content';

async function fixContentFile(filePath) {
  const fullPath = path.join(CONTENT_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Fix double commas
  const originalContent = content;
  content = content.replace(/,,\s*$/gm, ',\n');

  // Fix interface placement issues (move interfaces to top)
  const interfaceMatches = content.match(/export interface \w+ \{[\s\S]*?\};?\s*\n\n/g);
  if (interfaceMatches) {
    let interfaces = '';
    let body = content;

    for (const interfaceMatch of interfaceMatches) {
      interfaces += interfaceMatch;
      body = body.replace(interfaceMatch, '');
    }

    // If interfaces were found and moved, reconstruct the file
    if (interfaces) {
      content = interfaces + '\n' + body;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed syntax in ${filePath}`);
    changed = true;
  }

  return changed;
}

async function fixAllContentFiles() {
  const files = await glob('*-content.ts', { cwd: CONTENT_DIR });

  let fixedCount = 0;
  for (const file of files) {
    if (await fixContentFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n📊 SUMMARY: Fixed syntax in ${fixedCount} files`);
  return fixedCount;
}

fixAllContentFiles().catch(console.error);
