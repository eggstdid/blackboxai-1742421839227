const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class GoogleGeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
    }

    async processImage(imagePath) {
        try {
            // Read the image file
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);

            // Prepare the request payload
            const payload = {
                contents: [{
                    parts: [
                        { text: "Generate a title, description, and relevant tags for this image. Format the response as JSON with 'title', 'description', and 'tags' fields." },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }]
            };

            // Make API request
            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Parse and format the response
            const generatedText = response.data.candidates[0].content.parts[0].text;
            const metadata = JSON.parse(generatedText);

            // Add thumbnail path to metadata
            metadata.thumbnail = imagePath;

            return metadata;
        } catch (error) {
            console.error('Error processing image:', error);
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    // Batch process images with concurrency control
    async processBatch(imagePaths, progressCallback, concurrency = 3) {
        const results = [];
        const chunks = this.chunkArray(imagePaths, concurrency);

        for (const chunk of chunks) {
            const promises = chunk.map(async (imagePath) => {
                const result = await this.processImage(imagePath);
                if (progressCallback) {
                    progressCallback(imagePath);
                }
                return result;
            });

            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
        }

        return results;
    }

    // Helper function to chunk array for batch processing
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = GoogleGeminiService;