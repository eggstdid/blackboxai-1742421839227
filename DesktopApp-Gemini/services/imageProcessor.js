const GoogleGeminiService = require('./googleGeminiService');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessor {
    constructor(apiKey) {
        this.geminiService = new GoogleGeminiService(apiKey);
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    }

    /**
     * Process multiple images with progress tracking
     * @param {Array<string>} imagePaths Array of image file paths
     * @param {Function} progressCallback Callback for progress updates
     * @returns {Promise<Array>} Array of processed metadata
     */
    async processImages(imagePaths, progressCallback) {
        try {
            // Validate images
            const validatedPaths = await this.validateImages(imagePaths);
            
            if (validatedPaths.length === 0) {
                throw new Error('No valid images found');
            }

            // Process images in batches
            const metadata = await this.geminiService.processBatch(
                validatedPaths,
                progressCallback,
                3 // Process 3 images concurrently
            );

            return metadata;
        } catch (error) {
            console.error('Error in image processing:', error);
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    /**
     * Validate image files
     * @param {Array<string>} imagePaths Array of file paths
     * @returns {Promise<Array<string>>} Array of valid image paths
     */
    async validateImages(imagePaths) {
        const validPaths = [];

        for (const imagePath of imagePaths) {
            try {
                // Check if file exists
                await fs.access(imagePath);
                
                // Check file extension
                const ext = path.extname(imagePath).toLowerCase();
                if (this.supportedFormats.includes(ext)) {
                    // Check if file is readable
                    const stats = await fs.stat(imagePath);
                    if (stats.isFile() && stats.size > 0) {
                        validPaths.push(imagePath);
                    }
                }
            } catch (error) {
                console.warn(`Skipping invalid image: ${imagePath}`, error);
            }
        }

        return validPaths;
    }

    /**
     * Create thumbnail for an image
     * @param {string} imagePath Path to the image
     * @returns {Promise<string>} Path to the thumbnail
     */
    async createThumbnail(imagePath) {
        // In a real implementation, you might want to:
        // 1. Create a thumbnail directory if it doesn't exist
        // 2. Generate a smaller version of the image
        // 3. Save it with a thumbnail prefix or in a thumbnail directory
        // For now, we'll just return the original path
        return imagePath;
    }

    /**
     * Clean up temporary files
     * @returns {Promise<void>}
     */
    async cleanup() {
        // Implement cleanup logic if needed
        // For example, removing temporary thumbnails
    }

    /**
     * Handle errors during processing
     * @param {Error} error Error object
     * @param {string} imagePath Path to the image that caused the error
     * @returns {Object} Error metadata object
     */
    handleProcessingError(error, imagePath) {
        return {
            thumbnail: imagePath,
            title: 'Error Processing Image',
            description: error.message,
            tags: ['error'],
            error: true
        };
    }

    /**
     * Validate metadata structure
     * @param {Object} metadata Metadata object to validate
     * @returns {boolean} True if valid
     */
    validateMetadata(metadata) {
        const requiredFields = ['title', 'description', 'tags'];
        return requiredFields.every(field => field in metadata);
    }
}

module.exports = ImageProcessor;