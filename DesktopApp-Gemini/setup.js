const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n=== Image Metadata Generator Setup ===\n');

  try {
    // Check if node_modules exists
    try {
      await fs.access('node_modules');
      console.log('✓ Dependencies already installed');
    } catch {
      console.log('Installing dependencies...');
      await execPromise('npm install');
      console.log('✓ Dependencies installed successfully');
    }

    // Get API key from user
    const apiKey = await question('\nPlease enter your Google Gemini API key: ');
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Update config file with API key
    const configPath = path.join(__dirname, 'config', 'config.json');
    const config = require(configPath);
    config.gemini.apiKey = apiKey;

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('✓ API key configured successfully');

    // Create necessary directories
    const dirs = ['build'];
    for (const dir of dirs) {
      try {
        await fs.mkdir(path.join(__dirname, dir));
        console.log(`✓ Created ${dir} directory`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }

    console.log('\n=== Setup Complete ===');
    console.log('\nYou can now start the application with:');
    console.log('npm start\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup().catch(console.error);