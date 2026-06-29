#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendSrc = path.resolve(__dirname, '../backend/src');

console.log('🚀 开始移除所有 .ts 扩展名导入...');
console.log('📁 扫描路径:', backendSrc);
console.log();

let filesModified = 0;
let totalReplacements = 0;

function traverseDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // 匹配 from './xxx.ts' 或 from '../xxx.ts'
  content = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)\.ts(['"])/g,
    (match, prefix, pathWithoutTs, suffix) => {
      totalReplacements++;
      return `${prefix}${pathWithoutTs}${suffix}`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log('✅ 修复:', path.relative(backendSrc, filePath));
  }
}

traverseDirectory(backendSrc);

console.log();
console.log('✅ 修复完成！');
console.log('📊 统计:');
console.log('   - 修改文件数:', filesModified);
console.log('   - 替换次数:', totalReplacements);
