const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const ImageProcessor = require('./services/imageProcessor');
const CSVExporter = require('./services/csvExporter');
const config = require('./config/config.json');

let mainWindow;
const imageProcessor = new ImageProcessor(config.gemini.apiKey);
const csvExporter = new CSVExporter();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle image file selection
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: config.app.supportedImageFormats.map(ext => ext.replace('.', '')) }
    ]
  });
  if (!canceled) {
    return filePaths;
  }
  return [];
});

// Handle image processing
ipcMain.handle('process:images', async (event, imagePaths) => {
  try {
    const progressCallback = (imagePath) => {
      event.sender.send('process:progress', {
        file: path.basename(imagePath)
      });
    };

    const metadata = await imageProcessor.processImages(imagePaths, progressCallback);
    return metadata;
  } catch (error) {
    console.error('Error processing images:', error);
    event.sender.send('process:error', {
      message: `Failed to process images: ${error.message}`
    });
    throw error;
  }
});

// Handle CSV export
ipcMain.handle('export:csv', async (event, metadata) => {
  try {
    const filePath = await csvExporter.exportToCSV(metadata, mainWindow);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    event.sender.send('process:error', {
      message: `Failed to export CSV: ${error.message}`
    });
    throw error;
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('An uncaught error occurred:', error);
  if (mainWindow) {
    mainWindow.webContents.send('process:error', {
      message: `Application error: ${error.message}`
    });
  }
});

// Handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  if (mainWindow) {
    mainWindow.webContents.send('process:error', {
      message: `Application error: ${reason}`
    });
  }
});
