import {describe, it, expect} from 'vitest';
import {
  getDaysUntilExpiration,
  getEquipmentColor,
  mapProjectsToEvents,
  mapEquipmentToEvents,
  mergeEvents,
  getExpirationStatus,
  formatDateShort,
  COLORS,
} from './calendarUtils';

describe('getDaysUntilExpiration', () => {
  it('should return positive days for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = getDaysUntilExpiration(futureDate.toISOString().split('T')[0]);
    expect(result).toBe(30);
  });

  it('should return negative days for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = getDaysUntilExpiration(pastDate.toISOString().split('T')[0]);
    expect(result).toBe(-10);
  });

  it('should return infinity for empty date', () => {
    expect(getDaysUntilExpiration('')).toBe(Infinity);
    expect(getDaysUntilExpiration(null as any)).toBe(Infinity);
  });
});

describe('getEquipmentColor', () => {
  it('should return green for >30 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    const result = getEquipmentColor(futureDate.toISOString().split('T')[0]);
    expect(result).toBe(COLORS.equipmentGreen);
  });

  it('should return orange for <=30 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const result = getEquipmentColor(futureDate.toISOString().split('T')[0]);
    expect(result).toBe(COLORS.equipmentOrange);
  });

  it('should return red for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = getEquipmentColor(pastDate.toISOString().split('T')[0]);
    expect(result).toBe(COLORS.equipmentRed);
  });
});

describe('mapProjectsToEvents', () => {
  it('should map projects to calendar events', () => {
    const projects = [
      { id: 1, name: 'Proyecto 1', description: 'Desc', status: 'active', start_date: '2026-06-01', end_date: '2026-06-30' },
    ];
    const events = mapProjectsToEvents(projects);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('project');
    expect(events[0].color).toBe(COLORS.project);
    expect(events[0].title).toBe('Proyecto 1');
  });
});

describe('mapEquipmentToEvents', () => {
  it('should map equipment to calendar events', () => {
    const equipment = [
      { id: 1, external_id: 'DR-00001', description: 'Sensor', location: 'Chamber 1', calibration_date: '2026-01-01', expiration_date: '2026-06-01', status: 'calibrated', norm: 'ISO13485', notes: '' },
    ];
    const events = mapEquipmentToEvents(equipment);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('equipment');
    expect(events[0].title).toContain('DR-00001');
  });

  it('should filter equipment without expiration_date', () => {
    const equipment = [
      { id: 1, external_id: 'DR-00001', description: 'Sensor', location: '', calibration_date: '', expiration_date: '', status: 'pending', norm: '', notes: '' },
    ];
    const events = mapEquipmentToEvents(equipment);
    expect(events).toHaveLength(0);
  });
});

describe('mergeEvents', () => {
  it('should merge projects, equipment and tasks', () => {
    const projects = [
      { id: 1, name: 'Proyecto 1', description: 'Desc', status: 'active', start_date: '2026-06-01', end_date: '2026-06-30' },
    ];
    const equipment = [
      { id: 1, external_id: 'DR-00001', description: 'Sensor', location: '', calibration_date: '', expiration_date: '2026-12-01', status: 'calibrated', norm: '', notes: '' },
    ];
    const tasks = [
      { id: 1, project_id: 1, title: 'Tarea 1', description: '', status: 'pending', priority: 'high', due_date: '2026-06-15' },
    ];
    const events = mergeEvents(projects, equipment, tasks);
    expect(events).toHaveLength(3);
  });
});

describe('getExpirationStatus', () => {
  it('should return correct status for expired', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = getExpirationStatus(pastDate.toISOString().split('T')[0]);
    expect(result.text).toContain('Vencido');
    expect(result.color).toBe(COLORS.equipmentRed);
  });

  it('should return correct status for today', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = getExpirationStatus(today);
    expect(result.text).toBe('Vence hoy');
  });

  it('should return correct status for within 30 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const result = getExpirationStatus(futureDate.toISOString().split('T')[0]);
    expect(result.text).toContain('15 días');
    expect(result.color).toBe(COLORS.equipmentOrange);
  });
});

describe('formatDateShort', () => {
  it('should format date as MM/DD/YYYY', () => {
    expect(formatDateShort('2026-05-03')).toBe('05/03/2026');
  });

  it('should return - for empty date', () => {
    expect(formatDateShort('')).toBe('-');
  });
});