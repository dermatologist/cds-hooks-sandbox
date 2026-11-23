#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * DHTI Launch Script
 *
 * This script launches the CDS Hooks Sandbox with pre-configured settings.
 * It takes two required arguments and one optional argument:
 *   1. Discovery endpoint URL of CDS Services (required)
 *   2. FHIR endpoint URL (required)
 *   3. Patient ID (optional)
 *
 * Usage:
 *   npm run dhti <discoveryUrl> <fhirUrl> [patientId]
 *
 * Example:
 *   npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir patient123
 *   npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

/**
 * Validate that a string is a non-empty value
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidArgument(value) {
  return !!(value && typeof value === 'string' && value.trim().length > 0);
}

/**
 * Validate and encode URL
 * @param {string} url - The URL to validate and encode
 * @param {string} paramName - The name of the parameter (for error messages)
 * @param {boolean} throwError - If true, throw error instead of exiting (for testing)
 * @returns {string} - The encoded URL
 */
function validateAndEncodeUrl(url, paramName, throwError = false) {
  if (!isValidArgument(url)) {
    const errorMessage = `Error: ${paramName} is required and cannot be empty`;
    if (throwError) {
      throw new Error(errorMessage);
    }
    console.error(errorMessage);
    process.exit(1);
  }

  // Encode the URL for query parameter
  return encodeURIComponent(url.trim());
}

/**
 * Validate patient ID
 * @param {string} patientId - The patient ID to validate
 * @param {boolean} throwError - If true, throw error instead of exiting (for testing)
 * @returns {string} - The validated and encoded patient ID
 */
function validatePatientId(patientId, throwError = false) {
  if (!isValidArgument(patientId)) {
    // Patient ID is optional, so return empty string if not provided
    return '';
  }
  // Encode the patient ID for query parameter
  return encodeURIComponent(patientId.trim());
}

/**
 * Fetch the first patient ID from a FHIR server
 * @param {string} fhirUrl - The FHIR server URL
 * @returns {Promise<string>} - The first patient ID or empty string
 */
async function fetchFirstPatientId(fhirUrl) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${fhirUrl}/Patient?_count=1`);
      const protocol = url.protocol === 'https:' ? https : http;

      const request = protocol.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const entries = response.entry || [];
            if (entries.length > 0 && entries[0].resource && entries[0].resource.id) {
              resolve(entries[0].resource.id);
            } else {
              resolve('');
            }
          } catch (e) {
            resolve('');
          }
        });
      });

      request.on('error', () => {
        resolve('');
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve('');
      });
    } catch (e) {
      resolve('');
    }
  });
}

/**
 * Main function to launch the application
 */
async function main() {
  // Default URLs
  const defaultDiscoveryUrl = 'http://localhost:8001/langserve/dhti-elixir-schat/cds-services';
  const defaultFhirUrl = 'https://hapi.fhir.org/baseR4';

  // Get command line arguments (skip node and script name)
  const args = process.argv.slice(2);

  // Use defaults or provided arguments
  let discoveryUrl = defaultDiscoveryUrl;
  let fhirUrl = defaultFhirUrl;
  let patientId = '';

  if (args.length > 0) {
    discoveryUrl = args[0];
  }
  if (args.length > 1) {
    fhirUrl = args[1];
  }
  if (args.length > 2) {
    patientId = args[2];
  }

  // If no patient ID provided, fetch the first one from FHIR server
  if (!patientId) {
    console.log('Fetching first patient ID from FHIR server...');
    patientId = await fetchFirstPatientId(fhirUrl);
    if (patientId) {
      console.log(`Found patient ID: ${patientId}`);
    } else {
      console.log('No patient ID found, will use patient selection UI');
    }
  }

  // Validate and encode arguments
  const encodedDiscoveryUrl = validateAndEncodeUrl(discoveryUrl, 'Discovery URL');
  const encodedFhirUrl = validateAndEncodeUrl(fhirUrl, 'FHIR URL');
  const encodedPatientId = validatePatientId(patientId);

  // Construct the URL with query parameters
  const port = process.env.PORT || 8080;
  let queryParams = `serviceDiscoveryURL=${encodedDiscoveryUrl}&fhirServiceUrl=${encodedFhirUrl}`;
  if (encodedPatientId) {
    queryParams += `&patientId=${encodedPatientId}`;
  }
  const fullUrl = `http://localhost:${port}/?${queryParams}`;

  console.log('Starting CDS Hooks Sandbox with DHTI configuration...');
  console.log(`Discovery URL: ${discoveryUrl}`);
  console.log(`FHIR URL: ${fhirUrl}`);
  if (patientId) {
    console.log(`Patient ID: ${patientId}`);
  } else {
    console.log('Patient ID: (not provided)');
  }

  // Display Application URL in red
  console.log('\n\x1b[31mApplication URL: %s\x1b[0m\n', fullUrl);

  // Start the dev server with a spinning wheel
  startDevServer();
}

/**
 * Start the development server with a spinning wheel animation
 */
function startDevServer() {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIndex = 0;

  console.log('Starting development server...');
  console.log('Press Ctrl+C twice to exit\n');

  const spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${spinner[spinnerIndex]} Starting...`);
    spinnerIndex = (spinnerIndex + 1) % spinner.length;
  }, 100);

  // Spawn the yarn dev process
  const devProcess = spawn('yarn', ['dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  // Clear the spinner when process starts
  devProcess.stdout.on('data', () => {
    clearInterval(spinnerInterval);
    process.stdout.write('\r\n');
  });

  devProcess.stderr.on('data', () => {
    clearInterval(spinnerInterval);
    process.stdout.write('\r\n');
  });

  // Handle process exit
  devProcess.on('close', (code) => {
    clearInterval(spinnerInterval);
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(spinnerInterval);
    console.log('\n\nShutting down...');
    devProcess.kill('SIGINT');
  });
}

// Export for testing
module.exports = {
  isValidArgument,
  validateAndEncodeUrl,
  validatePatientId,
};

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}
