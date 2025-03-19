const ImageProcessor = require('../services/imageProcessor');
const { mockFileSystem, setupTestEnvironment, cleanupTestEnvironment } = require('./testHelpers');

// Mock the Google Gemini service
jest.mock('../services/googleGeminiService', () => {
  return jest.fn().mockImplementation(() => ({
    processBatch: jest.fn().mockResolvedValue([mockFileSystem.sampleMetadata])
  }));
});

describe('ImageProcessor', () => {
  let imageProcessor;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    setupTestEnvironment();
    imageProcessor = new ImageProcessor(mockApiKey);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('validateImages', () => {
    test('should accept valid image paths', async () => {
      const paths = [mockFileSystem.paths.validImage];
      const validPaths = await imageProcessor.validateImages(paths);
      expect(validPaths).toEqual([mockFileSystem.paths.validImage]);
    });

    test('should filter out invalid image paths', async () => {
      const paths = [
        mockFileSystem.paths.validImage,
        mockFileSystem.paths.invalidImage,
        mockFileSystem.paths.nonImage,
        'nonexistent/path/image.jpg'
      ];

      const validPaths = await imageProcessor.validateImages(paths);
      expect(validPaths).toEqual([mockFileSystem.paths.validImage]);
    });

    test('should handle empty input array', async () => {
      const validPaths = await imageProcessor.validateImages([]);
      expect(validPaths).toEqual([]);
    });
  });

  describe('processImages', () => {
    const mockProgressCallback = jest.fn();

    beforeEach(() => {
      mockProgressCallback.mockClear();
    });

    test('should process valid images and return metadata', async () => {
      const result = await imageProcessor.processImages(
        [mockFileSystem.paths.validImage],
        mockProgressCallback
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFileSystem.sampleMetadata);
      expect(mockProgressCallback).toHaveBeenCalledWith(mockFileSystem.paths.validImage);
    });

    test('should throw error when no valid images are found', async () => {
      await expect(imageProcessor.processImages([], mockProgressCallback))
        .rejects
        .toThrow('No valid images found');
      
      expect(mockProgressCallback).not.toHaveBeenCalled();
    });

    test('should handle processing errors', async () => {
      // Mock the processBatch method to throw an error
      imageProcessor.geminiService.processBatch.mockRejectedValueOnce(
        new Error('Processing failed')
      );

      await expect(
        imageProcessor.processImages([mockFileSystem.paths.validImage], mockProgressCallback)
      ).rejects.toThrow('Image processing failed: Processing failed');
    });
  });

  describe('validateMetadata', () => {
    test('should validate correct metadata structure', () => {
      expect(imageProcessor.validateMetadata(mockFileSystem.sampleMetadata)).toBe(true);
    });

    test('should reject invalid metadata structure', () => {
      const invalidMetadata = {
        title: 'Test'
        // Missing required fields
      };

      expect(imageProcessor.validateMetadata(invalidMetadata)).toBe(false);
    });
  });

  describe('handleProcessingError', () => {
    test('should return error metadata object', () => {
      const error = new Error('Test error');
      const result = imageProcessor.handleProcessingError(
        error,
        mockFileSystem.paths.validImage
      );

      expect(result).toEqual({
        thumbnail: mockFileSystem.paths.validImage,
        title: 'Error Processing Image',
        description: 'Test error',
        tags: ['error'],
        error: true
      });
    });
  });
});