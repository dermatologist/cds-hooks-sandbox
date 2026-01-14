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
 * Main function to launch the application
 */
function main() {
  // Get command line arguments (skip node and script name)
  const args = process.argv.slice(2);

  // Check if we have at least 2 arguments (discoveryUrl, fhirUrl)
  if (args.length < 2 || args.length > 3) {
    console.error('Error: 2 required arguments, 1 optional\n');
    console.log('Usage: npm run dhti <discoveryUrl> <fhirUrl> [patientId]');
    console.log('\nExamples:');
    console.log('  npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir patient123');
    console.log('  npm run dhti http://localhost:8001/cds-services https://api.example.org/fhir');
    process.exit(1);
  }

  const [discoveryUrl, fhirUrl, patientId] = args;

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
  console.log(`\nApplication URL: ${fullUrl}\n`);

  // Only display the launch URL, do not open the browser or start the dev server
  // (No further action required)
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
