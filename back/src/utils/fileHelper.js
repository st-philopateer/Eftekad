import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const saveBase64File = (base64Data, originalFileName = 'file.pdf') => {
  if (!base64Data || typeof base64Data !== 'string') return base64Data;
  if (!base64Data.startsWith('data:application/pdf;base64,')) {
    return base64Data; // Already a URL or relative path
  }

  try {
    const rawBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');
    const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `prep_${Date.now()}_${Math.round(Math.random() * 1e9)}_${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`📁 Saved PDF to disk: ${filename} (${buffer.length} bytes)`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 to disk:', err);
    return base64Data; // Fallback to storing original string if disk write fails
  }
};
