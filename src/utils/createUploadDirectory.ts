import fs from 'fs';
import path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default () => {
  // Create main uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Create model-specific subdirectories
  const modelDirs = ['categories', 'brands', 'products'];
  modelDirs.forEach((dir) => {
    const modelDir = path.join(uploadDir, dir);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir);
    }
  });
};
