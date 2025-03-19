const CSVExporter = require('../services/csvExporter');
const fs = require('fs').promises;
const { dialog } = require('electron');
const Papa = require('papaparse');

// Mock dependencies
jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn()
  }
}));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn()
  }
}));

jest.mock('papaparse', () => ({
  unparse: jest.fn()
}));

describe('CSVExporter', () => {
  let csvExporter;
  const mockParentWindow = {};
  
  const sampleMetadata = [
    {
      thumbnail: '/path/to/image1.jpg',
      title: 'Test Image 1',
      description: 'Description 1',
      tags: ['tag1', 'tag2']
    },
    {
      thumbnail: '/path/to/image2.jpg',
      title: 'Test Image 2',
      description: 'Description 2',
      tags: ['tag3', 'tag4']
    }
  ];

  beforeEach(() => {
    csvExporter = new CSVExporter();
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('exportToCSV', () => {
    test('should export metadata to CSV file', async () => {
      // Mock dialog response
      const mockFilePath = '/path/to/export.csv';
      dialog.showSaveDialog.mockResolvedValue({
        filePath: mockFilePath,
        canceled: false
      });

      // Mock CSV conversion
      const mockCSV = 'filename,title,description,tags,filepath\n';
      Papa.unparse.mockReturnValue(mockCSV);

      // Execute export
      const result = await csvExporter.exportToCSV(sampleMetadata, mockParentWindow);

      // Verify dialog was shown
      expect(dialog.showSaveDialog).toHaveBeenCalledWith(mockParentWindow, {
        defaultPath: csvExporter.defaultFilename,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      // Verify CSV conversion
      expect(Papa.unparse).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            filename: 'image1.jpg',
            title: 'Test Image 1',
            description: 'Description 1',
            tags: 'tag1, tag2',
            filepath: '/path/to/image1.jpg'
          })
        ]),
        expect.any(Object)
      );

      // Verify file was written
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockFilePath,
        mockCSV,
        'utf-8'
      );

      // Verify return value
      expect(result).toBe(mockFilePath);
    });

    test('should handle dialog cancellation', async () => {
      dialog.showSaveDialog.mockResolvedValue({
        canceled: true
      });

      await expect(csvExporter.exportToCSV(sampleMetadata, mockParentWindow))
        .rejects
        .toThrow('Export cancelled');

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('should handle write errors', async () => {
      dialog.showSaveDialog.mockResolvedValue({
        filePath: '/path/to/export.csv',
        canceled: false
      });

      const writeError = new Error('Write failed');
      fs.writeFile.mockRejectedValue(writeError);

      await expect(csvExporter.exportToCSV(sampleMetadata, mockParentWindow))
        .rejects
        .toThrow('Failed to export CSV: Write failed');
    });
  });

  describe('validateMetadata', () => {
    test('should validate correct metadata array', () => {
      expect(() => csvExporter.validateMetadata(sampleMetadata)).not.toThrow();
    });

    test('should reject non-array input', () => {
      expect(() => csvExporter.validateMetadata('not an array'))
        .toThrow('Metadata must be an array');
    });

    test('should reject metadata with missing required fields', () => {
      const invalidMetadata = [
        {
          title: 'Test',
          // Missing other required fields
        }
      ];

      expect(() => csvExporter.validateMetadata(invalidMetadata))
        .toThrow('Missing required field');
    });
  });

  describe('cleanMetadata', () => {
    test('should clean metadata fields', () => {
      const dirtyMetadata = [
        {
          thumbnail: '/path/to/image.jpg',
          title: '=dangerous,title',
          description: '@risky-description',
          tags: ['tag1', 'tag2']
        }
      ];

      const cleaned = csvExporter.cleanMetadata(dirtyMetadata);

      expect(cleaned[0].title).not.toContain('=');
      expect(cleaned[0].description).not.toContain('@');
    });

    test('should handle non-string values', () => {
      const metadata = [
        {
          thumbnail: '/path/to/image.jpg',
          title: 123,
          description: null,
          tags: ['tag1']
        }
      ];

      const cleaned = csvExporter.cleanMetadata(metadata);

      expect(typeof cleaned[0].title).toBe('string');
      expect(typeof cleaned[0].description).toBe('string');
    });
  });

  describe('getFilenameFromPath', () => {
    test('should extract filename from path', () => {
      const testPaths = {
        windows: 'C:\\Users\\test\\image.jpg',
        unix: '/home/user/image.jpg',
        filename: 'image.jpg'
      };

      expect(csvExporter.getFilenameFromPath(testPaths.windows)).toBe('image.jpg');
      expect(csvExporter.getFilenameFromPath(testPaths.unix)).toBe('image.jpg');
      expect(csvExporter.getFilenameFromPath(testPaths.filename)).toBe('image.jpg');
    });
  });
});