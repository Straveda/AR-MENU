/**
 * Abstract class representing a storage provider.
 * All storage implementations must extend this class.
 */
export class StorageProvider {
  /**
   * Uploads a file to the storage provider.
   * @param {Buffer} fileBuffer - The file content as a buffer.
   * @param {string} fileName - The name of the file.
   * @param {string} mimeType - The MIME type of the file.
   * @param {string} folder - The folder path to upload to.
   * @returns {Promise<{ url: string, fileId: string }>}
   */
  async uploadFile(fileBuffer, fileName, mimeType, folder) {
    throw new Error('Method "uploadFile" must be implemented');
  }

  /**
   * Deletes a file from the storage provider.
   * @param {string} fileId - The ID of the file to delete.
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    throw new Error('Method "deleteFile" must be implemented');
  }
}
