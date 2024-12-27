// R2 Storage Layer
export class R2Storage {
  constructor(bucket) {
    this.bucket = bucket;
  }

  // Helper method to generate storage keys
  _generateKey(type, id, filename) {
    try {
      return `${type}/${id}/${filename}`;
    } catch (error) {
      throw new Error(`Failed to generate key: ${error.message}`);
    }
  }

  // Upload a file
  async upload(key, data, metadata = {}) {
    try {
      await this.bucket.put(key, data, {
        customMetadata: metadata
      });
      return key;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Download a file
  async download(key) {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        throw new Error('File not found');
      }
      return object;
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  // Delete a file
  async delete(key) {
    try {
      await this.bucket.delete(key);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // List files with a prefix
  async list(prefix = '') {
    try {
      const objects = await this.bucket.list({ prefix });
      return objects.objects;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Get file metadata
  async getMetadata(key) {
    try {
      const object = await this.bucket.head(key);
      if (!object) {
        throw new Error('File not found');
      }
      return object.customMetadata;
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  // Update file metadata
  async updateMetadata(key, metadata) {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        throw new Error('File not found');
      }
      
      const data = await object.arrayBuffer();
      await this.bucket.put(key, data, {
        customMetadata: {
          ...object.customMetadata,
          ...metadata
        }
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  // Copy a file
  async copy(sourceKey, destinationKey) {
    try {
      const sourceObject = await this.bucket.get(sourceKey);
      if (!sourceObject) {
        throw new Error('Source file not found');
      }

      const data = await sourceObject.arrayBuffer();
      await this.bucket.put(destinationKey, data, {
        customMetadata: sourceObject.customMetadata
      });

      return destinationKey;
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  // Move a file
  async move(sourceKey, destinationKey) {
    try {
      await this.copy(sourceKey, destinationKey);
      await this.delete(sourceKey);
      return destinationKey;
    } catch (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }
}
