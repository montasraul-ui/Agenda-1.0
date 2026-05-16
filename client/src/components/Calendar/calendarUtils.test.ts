import {describe, it, expect} from 'vitest';
import {
  getDaysUntilExpiration,
  getEquipmentColor,
  mapEquipmentToEvents,
  mapTasksToEvents,
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

describe('mapTasksToEvents', () => {
  it('should map tasks to calendar events with project color', () => {
    const tasks = [
      { id: 1, project_id: 1, project_name: 'Proyecto 1', project_color: '#4CAAF2', title: 'Tarea 1', description: '', status: 'pending', priority: 'high', due_date: '2026-06-15' },
    ];
    const events = mapTasksToEvents(tasks);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('task');
    expect(events[0].color).toBe('#4CAAF2');
    expect(events[0].title).toContain('Tarea 1');
    expect(events[0].title).toContain('Proyecto 1');
  });

  it('should use priority color when no project color', () => {
    const tasks = [
      { id: 1, project_id: null, title: 'Tarea sin proyecto', description: '', status: 'pending', priority: 'high', due_date: '2026-06-15' },
    ];
    const events = mapTasksToEvents(tasks);
    expect(events).toHaveLength(1);
    expect(events[0].color).toBe(COLORS.taskHigh);
  });

  it('should filter out completed tasks', () => {
    const tasks = [
      { id: 1, project_id: 1, title: 'Tarea completada', description: '', status: 'completed', priority: 'medium', due_date: '2026-06-15' },
    ];
    const events = mapTasksToEvents(tasks);
    expect(events).toHaveLength(0);
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
  it('should merge equipment and tasks (no projects)', () => {
    const equipment = [
      { id: 1, external_id: 'DR-00001', description: 'Sensor', location: '', calibration_date: '', expiration_date: '2026-12-01', status: 'calibrated', norm: '', notes: '' },
    ];
    const tasks = [
      { id: 1, project_id: 1, project_name: 'Proyecto 1', project_color: '#4CAAF2', title: 'Tarea 1', description: '', status: 'pending', priority: 'high', due_date: '2026-06-15' },
    ];
    const events = mergeEvents(equipment, tasks);
    expect(events).toHaveLength(2);
    expect(events.find(e => e.type === 'equipment')).toBeDefined();
    expect(events.find(e => e.type === 'task')).toBeDefined();
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