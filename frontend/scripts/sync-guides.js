import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in Docker with /docs mounted at root
let docsDir = '/docs';
if (!fs.existsSync(docsDir)) {
  docsDir = path.resolve(__dirname, '../../docs');
}

const targetDir = path.resolve(__dirname, '../public/guides-static');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy HTML files
try {
  const files = fs.readdirSync(docsDir);
  let count = 0;
  
  files.forEach(file => {
    if (file.endsWith('.html')) {
      const src = path.join(docsDir, file);
      const dest = path.join(targetDir, file);
      fs.copyFileSync(src, dest);
      count++;
    }
  });
  
  console.log(`Successfully synced ${count} guide files to ${targetDir}`);
} catch (error) {
  console.error('Error syncing guides:', error.message);
  process.exit(1);
}
