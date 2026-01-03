import { ImageKitProvider } from "./ImageKitProvider.js";

class StorageService {
  constructor() {
    // In the future, we could add logic here to switch providers based on config
    this.provider = new ImageKitProvider();
  }

  /**
   * Uploads a file using the configured provider.
   * @param {Buffer} fileBuffer 
   * @param {string} fileName 
   * @param {string} folder 
   * @returns {Promise<{ url: string, fileId: string }>}
   */
  async uploadFile(fileBuffer, fileName, folder) {
    return this.provider.uploadFile(fileBuffer, fileName, folder);
  }

    /**
   * Deletes a file using the configured provider.
   * @param {string} fileId 
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    return this.provider.deleteFile(fileId);
  }
}

// Export as singleton
export const storageService = new StorageService();
