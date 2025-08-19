const { NFTStorage, Blob } = require('nft.storage');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');

// Load environment variables from config directory
require('dotenv').config({ path: path.resolve(__dirname, '../config/config.env') });

class NFTStorageService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.NFT_STORAGE_API_KEY;
    if (!this.apiKey) {
      throw new Error('NFT_STORAGE_API_KEY is not defined in config.env');
    }
    this.client = new NFTStorage({ token: this.apiKey });
  }
  /**
   * Upload a file to NFT.Storage
   * @param {string} filePath Path to the file to upload
   * @returns {Promise<string>} The CID of the uploaded file
   */
  async uploadFile(filePath) {
    try {
      console.log(`Uploading file: ${filePath}`);
      const file = await this.fileFromPath(filePath);
      const cid = await this.client.storeBlob(file);
      console.log(`File uploaded successfully. CID: ${cid}`);
      return cid;
    } catch (error) {
      console.error('Error uploading file to NFT.Storage:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload a certificate with metadata to NFT.Storage
   * @param {string} collectionId The collection ID (not used in v1 API but kept for compatibility)
   * @param {Object} certificateData Certificate metadata
   * @param {string} imagePath Path to the certificate image
   * @returns {Promise<{cid: string, url: string}>} The CID and URL of the stored metadata
   */
  async uploadCertificate(collectionId, certificateData, imagePath) {
    try {
      console.log(`Starting certificate upload for ${certificateData.name}`);
      
      // Upload the image first
      console.log('Uploading certificate image...');
      const imageFile = await this.fileFromPath(imagePath);
      const imageCid = await this.client.storeBlob(imageFile);
      
      // Create metadata object
      const metadata = {
        name: `Certificate for ${certificateData.name}`,
        description: `Certificate issued to ${certificateData.name} (${certificateData.email})`,
        image: new Blob(
          [Buffer.from(`ipfs://${imageCid}`)],
          { type: 'application/json' }
        ),
        properties: {
          certificateNumber: certificateData.certificateNumber,
          email: certificateData.email,
          issuedAt: new Date().toISOString()
        }
      };

      // Store the metadata
      console.log('Uploading certificate metadata...');
      const metadataCid = await this.client.storeDirectory([
        new Blob(
          [JSON.stringify(metadata, null, 2)],
          { type: 'application/json' }
        )
      ]);

      console.log(`Certificate uploaded successfully. CID: ${metadataCid}`);
      
      return {
        cid: metadataCid,
        url: `https://${metadataCid}.ipfs.nftstorage.link`
      };
      
    } catch (error) {
      console.error('Error uploading certificate:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to upload certificate: ${error.message}`);
    }
  }

  /**
   * Helper to create a Blob object from a file path
   * @private
   */
  async fileFromPath(filePath) {
    const content = await fs.promises.readFile(filePath);
    const type = mime.getType(filePath) || 'application/octet-stream';
    return new Blob([content], { type });
  }
}

module.exports = new NFTStorageService();
