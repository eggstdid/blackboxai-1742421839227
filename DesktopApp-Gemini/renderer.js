// DOM Elements
const dropZone = document.getElementById('dropZone');
const selectFilesBtn = document.getElementById('selectFiles');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const gallerySection = document.getElementById('gallerySection');
const metadataTableBody = document.getElementById('metadataTableBody');
const exportCSVBtn = document.getElementById('exportCSV');
const errorToast = document.getElementById('errorToast');
const errorMessage = document.getElementById('errorMessage');

// State management
let selectedFiles = [];
let processedMetadata = [];

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
    );

    if (files.length > 0) {
        handleSelectedFiles(files);
    }
});

// File selection button handler
selectFilesBtn.addEventListener('click', async () => {
    try {
        const filePaths = await window.electronAPI.selectImages();
        if (filePaths.length > 0) {
            handleSelectedFiles(filePaths);
        }
    } catch (error) {
        showError('Error selecting files: ' + error.message);
    }
});

// Handle selected files
async function handleSelectedFiles(files) {
    selectedFiles = files;
    showProgressSection();
    await processImages();
}

// Process images with Google Gemini
async function processImages() {
    try {
        progressSection.classList.remove('hidden');
        let processed = 0;

        // Process images and update progress
        window.electronAPI.onProgress((progress) => {
            processed++;
            updateProgress(processed, selectedFiles.length);
        });

        // Start processing
        processedMetadata = await window.electronAPI.processImages(selectedFiles);
        
        // Show results
        displayMetadata(processedMetadata);
        showGallerySection();
        enableExportButton();
    } catch (error) {
        showError('Error processing images: ' + error.message);
    }
}

// Update progress bar and text
function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${current} of ${total} images processed`;
}

// Display metadata in table
function displayMetadata(metadata) {
    metadataTableBody.innerHTML = '';
    
    metadata.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = 'metadata-row hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${item.thumbnail}" alt="thumbnail" class="image-thumbnail">
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${item.title}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-500">${item.description}</div>
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                    ${item.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
            </td>
        `;
        
        metadataTableBody.appendChild(row);
    });
}

// Export to CSV
exportCSVBtn.addEventListener('click', async () => {
    try {
        await window.electronAPI.exportToCSV(processedMetadata);
        showSuccess('Metadata exported successfully!');
    } catch (error) {
        showError('Error exporting CSV: ' + error.message);
    }
});

// UI Helpers
function showProgressSection() {
    progressSection.classList.remove('hidden');
    gallerySection.classList.add('hidden');
}

function showGallerySection() {
    progressSection.classList.add('hidden');
    gallerySection.classList.remove('hidden');
}

function enableExportButton() {
    exportCSVBtn.disabled = false;
}

function showError(message) {
    errorMessage.textContent = message;
    errorToast.classList.remove('hidden');
    errorToast.classList.add('toast-enter');
    
    setTimeout(() => {
        errorToast.classList.remove('toast-enter');
        errorToast.classList.add('toast-exit');
        setTimeout(() => {
            errorToast.classList.add('hidden');
            errorToast.classList.remove('toast-exit');
        }, 300);
    }, 5000);
}

// Initialize error handler
window.electronAPI.onError((error) => {
    showError(error.message);
});