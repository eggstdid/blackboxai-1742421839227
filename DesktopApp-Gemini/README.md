# Image Metadata Generator with Google Gemini

A desktop application that uses Google's Gemini AI to automatically generate titles, descriptions, and tags for images. Built with Electron, this application provides an intuitive interface for processing multiple images and exporting metadata to CSV format.

## Features

- Bulk image upload support
- Automatic metadata generation using Google Gemini AI
- Real-time processing progress tracking
- Modern, responsive user interface
- CSV export functionality
- Support for multiple image formats (JPG, PNG, GIF, WebP)
- Error handling and retry mechanisms

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DesktopApp-Gemini
```

2. Install dependencies:
```bash
npm install
```

3. Configure the application:
   - Open `config/config.json`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key

## Running the Application

Start the application in development mode:
```bash
npm start
```

## Usage

1. Launch the application
2. Click "Select Files" or drag and drop images into the upload area
3. Wait for the metadata generation process to complete
4. Review the generated metadata in the table
5. Click "Export CSV" to save the metadata

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Error Handling

The application includes comprehensive error handling for:
- Invalid image files
- Network connectivity issues
- API errors
- File system operations

## Development

### Project Structure

```
DesktopApp-Gemini/
├── config/
│   └── config.json         # Application configuration
├── services/
│   ├── googleGeminiService.js  # Google Gemini API integration
│   ├── imageProcessor.js       # Image processing logic
│   └── csvExporter.js         # CSV export functionality
├── main.js                 # Main process
├── preload.js             # Preload script
├── index.html             # Main window
├── styles.css             # Application styles
└── renderer.js            # Renderer process
```

### Building

To create a production build:
```bash
npm run build
```

## Security

- Uses contextIsolation and disabled nodeIntegration for renderer process
- Secure handling of API keys through configuration
- Input validation and sanitization
- Error handling and logging

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request