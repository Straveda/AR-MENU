import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

console.log('Environment Check:');
console.log('IMAGEKIT_PUBLIC_KEY:', process.env.IMAGEKIT_PUBLIC_KEY ? 'Set' : 'Missing');
console.log('IMAGEKIT_PRIVATE_KEY:', process.env.IMAGEKIT_PRIVATE_KEY ? 'Set' : 'Missing');
console.log('IMAGEKIT_URL_ENDPOINT:', process.env.IMAGEKIT_URL_ENDPOINT ? 'Set' : 'Missing');

const runVerification = async () => {
  console.log('Starting Verification: Cloudinary -> ImageKit Migration');

  // Dynamic import to ensure env vars are loaded first
  const { storageService } = await import('../src/services/storage/StorageService.js');

  try {
    // 1. Create a dummy buffer
    const buffer = Buffer.from('Verification Test Content ' + Date.now());
    const fileName = `verification-test-${Date.now()}.txt`;

    console.log(`Attempting to upload file: ${fileName}`);

    // 2. Upload using StorageService
    const result = await storageService.uploadFile(buffer, fileName, 'menu-ar/verification');

    console.log('Upload Result:', result);

    if (result.url && result.url.includes('imagekit.io')) {
      console.log('✅ SUCCESS: File uploaded to ImageKit!');
      console.log(`URL: ${result.url}`);
    } else {
      console.error('❌ FAILURE: URL does not look like an ImageKit URL or upload failed.');
    }

    // 3. (Optional) clean up
    if (result.fileId) {
      console.log(`Attempting to delete file: ${result.fileId}`);
      await storageService.deleteFile(result.fileId);
      console.log('✅ SUCCESS: File deleted from ImageKit!');
    }
  } catch (error) {
    console.error('❌ FAILURE: Verification script encountered an error:', error);
    process.exit(1);
  }
};

runVerification();
