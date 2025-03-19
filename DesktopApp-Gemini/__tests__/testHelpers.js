const path = require('path');
const fs = require('fs').promises;

// Mock file system helpers
const mockFileSystem = {
  // Mock file paths
  paths: {
    validImage: path.join(__dirname, 'fixtures', 'test-image.jpg'),
    invalidImage: path.join(__dirname, 'fixtures', 'invalid.jpg'),
    nonImage: path.join(__dirname, 'fixtures', 'test.txt')
  },

  // Mock file stats
  stats: {
    validImage: {
      isFile: () => true,
      size: 1024
    },
    invalidImage: {
      isFile: () => true,
      size: 0
    },
    nonImage: {
      isFile: () => true,
      size: 100
    }
  },

  // Mock metadata
  sampleMetadata: {
    title: 'Sample Image',
    description: 'A sample image for testing',
    tags: ['test', 'sample', 'mock'],
    thumbnail: path.join(__dirname, 'fixtures', 'test-image.jpg')
  }
};

// Mock fs.access
async function mockAccess(filePath) {
  if (Object.values(mockFileSystem.paths).includes(filePath)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('ENOENT: no such file or directory'));
}

// Mock fs.stat
async function mockStat(filePath) {
  if (filePath === mockFileSystem.paths.validImage) {
    return Promise.resolve(mockFileSystem.stats.validImage);
  }
  if (filePath === mockFileSystem.paths.invalidImage) {
    return Promise.resolve(mockFileSystem.stats.invalidImage);
  }
  if (filePath === mockFileSystem.paths.nonImage) {
    return Promise.resolve(mockFileSystem.stats.nonImage);
  }
  return Promise.reject(new Error('ENOENT: no such file or directory'));
}

// Setup test environment
function setupTestEnvironment() {
  // Mock fs.promises methods
  jest.spyOn(fs, 'access').mockImplementation(mockAccess);
  jest.spyOn(fs, 'stat').mockImplementation(mockStat);
}

// Cleanup test environment
function cleanupTestEnvironment() {
  jest.restoreAllMocks();
}

module.exports = {
  mockFileSystem,
  setupTestEnvironment,
  cleanupTestEnvironment
};