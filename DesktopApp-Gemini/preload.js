const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File handling
    selectImages: async () => {
        try {
            return await ipcRenderer.invoke('dialog:openFile');
        } catch (error) {
            console.error('Error selecting images:', error);
            throw error;
        }
    },

    // Process images with Google Gemini
    processImages: async (images) => {
        try {
            return await ipcRenderer.invoke('process:images', images);
        } catch (error) {
            console.error('Error processing images:', error);
            throw error;
        }
    },

    // Export metadata to CSV
    exportToCSV: async (metadata) => {
        try {
            return await ipcRenderer.invoke('export:csv', metadata);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            throw error;
        }
    },

    // Progress updates
    onProgress: (callback) => {
        const progressHandler = (event, value) => callback(value);
        ipcRenderer.on('process:progress', progressHandler);
        return () => {
            ipcRenderer.removeListener('process:progress', progressHandler);
        };
    },

    // Error handling
    onError: (callback) => {
        const errorHandler = (event, error) => callback(error);
        ipcRenderer.on('process:error', errorHandler);
        return () => {
            ipcRenderer.removeListener('process:error', errorHandler);
        };
    }
});

// Utility functions exposed to renderer
contextBridge.exposeInMainWorld('utils', {
    // Format file size
    formatFileSize: (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },

    // Format date
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});

// Handle any preload script errors
window.addEventListener('error', (event) => {
    console.error('Preload script error:', event.error);
    ipcRenderer.send('process:error', {
        message: `Preload script error: ${event.error.message}`
    });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    ipcRenderer.send('process:error', {
        message: `Unhandled promise rejection: ${event.reason}`
    });
});
