export class StorageProvider {
  async uploadFile(fileBuffer, fileName, mimeType, folder) {
    throw new Error('Method "uploadFile" must be implemented');
  }

  async deleteFile(fileId) {
    throw new Error('Method "deleteFile" must be implemented');
  }
}
