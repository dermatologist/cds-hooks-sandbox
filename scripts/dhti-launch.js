#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * DHTI Launch Script
 *
 * This script launches the CDS Hooks Sandbox with pre-configured settings.
 * It takes three arguments:
 *   1. Discovery endpoint URL of CDS Services
 *   2. FHIR endpoint URL
 *   3. Patient ID
 *
 * Usage:
 *   npm run dhti <discoveryUrl> <fhirUrl> <patientId>
 *
 * Example:
 *   npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir patient123
 */

const { spawn } = require('child_process');

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
    const errorMessage = 'Error: Patient ID is required and cannot be empty';
    if (throwError) {
      throw new Error(errorMessage);
    }
    console.error(errorMessage);
    process.exit(1);
  }

  // Encode the patient ID for query parameter
  return encodeURIComponent(patientId.trim());
}

/**
 * Main function to launch the application
 */
function main() {
  // Get command line arguments (skip node and script name)
  const args = process.argv.slice(2);

  // Check if we have exactly 3 arguments
  if (args.length !== 3) {
    console.error('Error: Exactly 3 arguments are required\n');
    console.log('Usage: npm run dhti <discoveryUrl> <fhirUrl> <patientId>');
    console.log('\nExample:');
    console.log('  npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir patient123');
    process.exit(1);
  }

  const [discoveryUrl, fhirUrl, patientId] = args;

  // Validate and encode arguments
  const encodedDiscoveryUrl = validateAndEncodeUrl(discoveryUrl, 'Discovery URL');
  const encodedFhirUrl = validateAndEncodeUrl(fhirUrl, 'FHIR URL');
  const encodedPatientId = validatePatientId(patientId);

  // Construct the URL with query parameters
  const port = process.env.PORT || 8080;
  const queryParams = `serviceDiscoveryURL=${encodedDiscoveryUrl}&fhirServiceUrl=${encodedFhirUrl}&patientId=${encodedPatientId}`;
  const fullUrl = `http://localhost:${port}/?${queryParams}`;

  console.log('Starting CDS Hooks Sandbox with DHTI configuration...');
  console.log(`Discovery URL: ${discoveryUrl}`);
  console.log(`FHIR URL: ${fhirUrl}`);
  console.log(`Patient ID: ${patientId}`);
  console.log(`\nApplication URL: ${fullUrl}\n`);

  // Construct the target URL for webpack-dev-server to open
  const openTarget = `/?${queryParams}`;

  // Start webpack-dev-server with --open and --open-target flags
  const webpackDevServer = spawn('npx', [
    'webpack-dev-server',
    '--config', 'webpack.config.dev.js',
    '--open',
    '--open-target', openTarget,
  ], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    webpackDevServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    webpackDevServer.kill('SIGTERM');
    process.exit(0);
  });

  webpackDevServer.on('exit', (code) => {
    process.exit(code);
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
