import { ImageKitProvider } from './ImageKitProvider.js';

class StorageService {
  constructor() {
    
    this.provider = new ImageKitProvider();
  }

  
  async uploadFile(fileBuffer, fileName, folder) {
    return this.provider.uploadFile(fileBuffer, fileName, folder);
  }

  
  async deleteFile(fileId) {
    return this.provider.deleteFile(fileId);
  }
}


export const storageService = new StorageService();
