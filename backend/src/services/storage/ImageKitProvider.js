import ImageKit from 'imagekit';
import { StorageProvider } from './StorageProvider.js';

export class ImageKitProvider extends StorageProvider {
  constructor() {
    super();
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }

  async uploadFile(fileBuffer, fileName, folder = 'menu-ar/dishes') {
    try {
      const response = await this.imagekit.upload({
        file: fileBuffer,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: true,
      });

      return {
        url: response.url,
        fileId: response.fileId,
      };
    } catch (error) {
      console.error('ImageKit Upload Error:', error);
      throw new Error(`Failed to upload file to ImageKit: ${error.message}`);
    }
  }

  async deleteFile(fileId) {
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('ImageKit Delete Error:', error);
      throw new Error(`Failed to delete file from ImageKit: ${error.message}`);
    }
  }
}
