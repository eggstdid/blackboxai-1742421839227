const Papa = require('papaparse');
const fs = require('fs').promises;
const { dialog } = require('electron');

class CSVExporter {
    constructor() {
        this.defaultFilename = 'image-metadata.csv';
    }

    /**
     * Convert metadata array to CSV format and save to file
     * @param {Array} metadata Array of metadata objects
     * @param {BrowserWindow} parentWindow Parent window for dialog
     * @returns {Promise<string>} Path to saved file
     */
    async exportToCSV(metadata, parentWindow) {
        try {
            // Prepare data for CSV conversion
            const csvData = metadata.map(item => ({
                filename: this.getFilenameFromPath(item.thumbnail),
                title: item.title,
                description: item.description,
                tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                filepath: item.thumbnail
            }));

            // Convert to CSV
            const csv = Papa.unparse(csvData, {
                quotes: true, // Wrap fields in quotes
                header: true, // Include header row
                delimiter: ',' // Use comma as delimiter
            });

            // Get save location from user
            const { filePath, canceled } = await dialog.showSaveDialog(parentWindow, {
                defaultPath: this.defaultFilename,
                filters: [
                    { name: 'CSV Files', extensions: ['csv'] }
                ]
            });

            if (canceled || !filePath) {
                throw new Error('Export cancelled');
            }

            // Write CSV to file
            await fs.writeFile(filePath, csv, 'utf-8');
            
            return filePath;
        } catch (error) {
            console.error('Error exporting CSV:', error);
            throw new Error(`Failed to export CSV: ${error.message}`);
        }
    }

    /**
     * Extract filename from full path
     * @param {string} filepath Full path to file
     * @returns {string} Filename without path
     */
    getFilenameFromPath(filepath) {
        return filepath.split(/[\\/]/).pop();
    }

    /**
     * Validate metadata array structure
     * @param {Array} metadata Array of metadata objects
     * @returns {boolean} True if valid
     */
    validateMetadata(metadata) {
        if (!Array.isArray(metadata)) {
            throw new Error('Metadata must be an array');
        }

        const requiredFields = ['thumbnail', 'title', 'description', 'tags'];
        
        metadata.forEach((item, index) => {
            requiredFields.forEach(field => {
                if (!(field in item)) {
                    throw new Error(`Missing required field '${field}' in metadata item ${index}`);
                }
            });
        });

        return true;
    }

    /**
     * Clean metadata for CSV export
     * @param {Array} metadata Array of metadata objects
     * @returns {Array} Cleaned metadata array
     */
    cleanMetadata(metadata) {
        return metadata.map(item => ({
            ...item,
            title: this.sanitizeField(item.title),
            description: this.sanitizeField(item.description),
            tags: Array.isArray(item.tags) 
                ? item.tags.map(tag => this.sanitizeField(tag)).join(', ')
                : this.sanitizeField(item.tags)
        }));
    }

    /**
     * Sanitize a field value for CSV export
     * @param {string} value Field value to sanitize
     * @returns {string} Sanitized value
     */
    sanitizeField(value) {
        if (typeof value !== 'string') {
            return String(value);
        }
        // Remove potential CSV injection characters
        return value.replace(/[=+\-@]/g, ' ');
    }
}

module.exports = CSVExporter;