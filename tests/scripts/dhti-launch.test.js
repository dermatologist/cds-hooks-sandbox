/**
 * Tests for DHTI Launch Script
 */

const dhtiLaunch = require('../../scripts/dhti-launch');

describe('DHTI Launch Script', () => {
  describe('isValidArgument', () => {
    it('returns true for valid non-empty string', () => {
      expect(dhtiLaunch.isValidArgument('test')).toBe(true);
      expect(dhtiLaunch.isValidArgument('http://example.com')).toBe(true);
      expect(dhtiLaunch.isValidArgument('patient123')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(dhtiLaunch.isValidArgument('')).toBe(false);
      expect(dhtiLaunch.isValidArgument('   ')).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(dhtiLaunch.isValidArgument(null)).toBe(false);
      expect(dhtiLaunch.isValidArgument(undefined)).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(dhtiLaunch.isValidArgument(123)).toBe(false);
      expect(dhtiLaunch.isValidArgument({})).toBe(false);
      expect(dhtiLaunch.isValidArgument([])).toBe(false);
    });
  });

  describe('validateAndEncodeUrl', () => {
    it('returns encoded URL for valid input', () => {
      const url = 'http://example.com/cds-services';
      const encoded = dhtiLaunch.validateAndEncodeUrl(url, 'Test URL', true);
      expect(encoded).toBe(encodeURIComponent(url));
    });

    it('handles URLs with special characters', () => {
      const url = 'http://example.com/path?query=value&foo=bar';
      const encoded = dhtiLaunch.validateAndEncodeUrl(url, 'Test URL', true);
      expect(encoded).toBe(encodeURIComponent(url));
    });

    it('trims whitespace from URL', () => {
      const url = '  http://example.com/cds-services  ';
      const encoded = dhtiLaunch.validateAndEncodeUrl(url, 'Test URL', true);
      expect(encoded).toBe(encodeURIComponent(url.trim()));
    });

    it('throws error for empty URL', () => {
      expect(() => {
        dhtiLaunch.validateAndEncodeUrl('', 'Test URL', true);
      }).toThrow('Error: Test URL is required and cannot be empty');
    });

    it('throws error for null URL', () => {
      expect(() => {
        dhtiLaunch.validateAndEncodeUrl(null, 'Discovery URL', true);
      }).toThrow('Error: Discovery URL is required and cannot be empty');
    });
  });

  describe('validatePatientId', () => {
    it('returns encoded patient ID for valid input', () => {
      expect(dhtiLaunch.validatePatientId('patient123', true)).toBe(encodeURIComponent('patient123'));
      expect(dhtiLaunch.validatePatientId('SMART-1288992', true)).toBe(encodeURIComponent('SMART-1288992'));
    });

    it('trims whitespace and encodes patient ID', () => {
      expect(dhtiLaunch.validatePatientId('  patient123  ', true)).toBe(encodeURIComponent('patient123'));
    });

    it('throws error for empty patient ID', () => {
      expect(() => {
        dhtiLaunch.validatePatientId('', true);
      }).toThrow('Error: Patient ID is required and cannot be empty');
    });

    it('throws error for null patient ID', () => {
      expect(() => {
        dhtiLaunch.validatePatientId(null, true);
      }).toThrow('Error: Patient ID is required and cannot be empty');
    });
  });
});
