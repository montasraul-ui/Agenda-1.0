import {describe, it, expect} from 'vitest';
import {validateEquipmentData, mapStatus, excelDateToJSDate} from '../utils/equipment.js';

describe('validateEquipmentData', () => {
  it('should return valid for correct data', () => {
    const result = validateEquipmentData({
      external_id: 'DR-00001',
      description: 'Sensor de EO',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return invalid for missing external_id', () => {
    const result = validateEquipmentData({
      external_id: '',
      description: 'Sensor de EO',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ID de equipo es requerido');
  });

  it('should return invalid for missing description', () => {
    const result = validateEquipmentData({
      external_id: 'DR-00001',
      description: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Descripción es requerida');
  });

  it('should return invalid for whitespace-only external_id', () => {
    const result = validateEquipmentData({
      external_id: '   ',
      description: 'Sensor de EO',
    });
    expect(result.valid).toBe(false);
  });
});

describe('mapStatus', () => {
  it('should map IS to calibrated', () => {
    expect(mapStatus('IS')).toBe('calibrated');
  });

  it('should map OOS to expired', () => {
    expect(mapStatus('OOS')).toBe('expired');
  });

  it('should map N/A to pending', () => {
    expect(mapStatus('N/A')).toBe('pending');
  });

  it('should map IP to in_progress', () => {
    expect(mapStatus('IP')).toBe('in_progress');
  });

  it('should return pending for unknown status', () => {
    expect(mapStatus('UNKNOWN')).toBe('pending');
  });

  it('should return pending for undefined', () => {
    expect(mapStatus(undefined)).toBe('pending');
  });
});

describe('excelDateToJSDate', () => {
  it('should convert Excel date 1 to 1900-01-01', () => {
    expect(excelDateToJSDate(1)).toBe('1900-01-01');
  });

  it('should convert Excel date 44196 to 2021-01-01', () => {
    expect(excelDateToJSDate(44196)).toBe('2021-01-01');
  });

  it('should handle date around current year', () => {
    const result = excelDateToJSDate(45678);
    expect(result).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
  });
});