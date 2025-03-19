const GoogleGeminiService = require('../services/googleGeminiService');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('axios');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('GoogleGeminiService', () => {
  let geminiService;
  const mockApiKey = 'test-api-key';
  const mockImagePath = '/path/to/test-image.jpg';
  const mockImageBuffer = Buffer.from('mock image data');
  const mockBase64Image = mockImageBuffer.toString('base64');

  beforeEach(() => {
    geminiService = new GoogleGeminiService(mockApiKey);
    jest.clearAllMocks();

    // Mock file reading
    fs.readFile.mockResolvedValue(mockImageBuffer);
  });

  describe('processImage', () => {
    const mockApiResponse = {
      data: {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                title: 'Test Image',
                description: 'A test image description',
                tags: ['test', 'image', 'ai']
              })
            }]
          }
        }]
      }
    };

    test('should process image successfully', async () => {
      axios.post.mockResolvedValue(mockApiResponse);

      const result = await geminiService.processImage(mockImagePath);

      // Verify file was read
      expect(fs.readFile).toHaveBeenCalledWith(mockImagePath);

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('gemini-pro-vision:generateContent'),
        expect.objectContaining({
          contents: [{
            parts: [
              { text: expect.any(String) },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: mockBase64Image
                }
              }
            ]
          }]
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      // Verify result structure
      expect(result).toEqual({
        title: 'Test Image',
        description: 'A test image description',
        tags: ['test', 'image', 'ai'],
        thumbnail: mockImagePath
      });
    });

    test('should handle API errors', async () => {
      const apiError = new Error('API Error');
      axios.post.mockRejectedValue(apiError);

      await expect(geminiService.processImage(mockImagePath))
        .rejects
        .toThrow('Failed to process image: API Error');
    });

    test('should handle file read errors', async () => {
      const fileError = new Error('File read error');
      fs.readFile.mockRejectedValue(fileError);

      await expect(geminiService.processImage(mockImagePath))
        .rejects
        .toThrow('Failed to process image: File read error');
    });

    test('should handle invalid API responses', async () => {
      axios.post.mockResolvedValue({
        data: {
          // Missing candidates array
        }
      });

      await expect(geminiService.processImage(mockImagePath))
        .rejects
        .toThrow('Invalid API response');
    });
  });

  describe('processBatch', () => {
    const mockImages = [
      '/path/to/image1.jpg',
      '/path/to/image2.jpg',
      '/path/to/image3.jpg'
    ];

    test('should process images in batches', async () => {
      const mockResult = {
        title: 'Test Image',
        description: 'Test Description',
        tags: ['test'],
        thumbnail: ''
      };

      // Mock processImage to return success for each image
      jest.spyOn(geminiService, 'processImage')
        .mockImplementation(async (path) => ({
          ...mockResult,
          thumbnail: path
        }));

      const progressCallback = jest.fn();
      const results = await geminiService.processBatch(mockImages, progressCallback);

      // Verify all images were processed
      expect(results).toHaveLength(mockImages.length);
      expect(geminiService.processImage).toHaveBeenCalledTimes(mockImages.length);

      // Verify progress callback was called for each image
      expect(progressCallback).toHaveBeenCalledTimes(mockImages.length);
    });

    test('should handle partial failures in batch', async () => {
      // Mock processImage to fail for the second image
      jest.spyOn(geminiService, 'processImage')
        .mockImplementation(async (path) => {
          if (path === mockImages[1]) {
            throw new Error('Processing failed');
          }
          return {
            title: 'Test Image',
            description: 'Test Description',
            tags: ['test'],
            thumbnail: path
          };
        });

      const progressCallback = jest.fn();
      const results = await geminiService.processBatch(mockImages, progressCallback);

      // Should still process other images
      expect(results).toHaveLength(mockImages.length - 1);
      expect(progressCallback).toHaveBeenCalledTimes(mockImages.length - 1);
    });

    test('should respect concurrency limit', async () => {
      const mockProcessImage = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          title: 'Test',
          description: 'Test',
          tags: ['test'],
          thumbnail: ''
        };
      });

      geminiService.processImage = mockProcessImage;
      const startTime = Date.now();
      
      await geminiService.processBatch(mockImages, () => {}, 2);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // With concurrency of 2, should take longer than processing all at once
      expect(duration).toBeGreaterThan(20);
    });
  });

  describe('getMimeType', () => {
    test('should return correct mime type for supported images', () => {
      const testCases = [
        { path: 'test.jpg', expected: 'image/jpeg' },
        { path: 'test.jpeg', expected: 'image/jpeg' },
        { path: 'test.png', expected: 'image/png' },
        { path: 'test.gif', expected: 'image/gif' },
        { path: 'test.webp', expected: 'image/webp' }
      ];

      testCases.forEach(({ path, expected }) => {
        expect(geminiService.getMimeType(path)).toBe(expected);
      });
    });

    test('should return default mime type for unknown extensions', () => {
      expect(geminiService.getMimeType('test.unknown')).toBe('image/jpeg');
    });
  });
});