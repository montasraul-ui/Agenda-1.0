import {describe, it, expect} from 'vitest';

// Funciones helper para tareas (a crear en utils)
function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
  };
  return labels[status] || status;
}

function getTaskPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };
  return labels[priority] || priority;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function filterTasksByProject(tasks: any[], projectId: number | null): any[] {
  return tasks.filter(task => task.project_id === projectId);
}

describe('getTaskStatusLabel', () => {
  it('should return correct label for pending', () => {
    expect(getTaskStatusLabel('pending')).toBe('Pendiente');
  });

  it('should return correct label for in_progress', () => {
    expect(getTaskStatusLabel('in_progress')).toBe('En progreso');
  });

  it('should return correct label for completed', () => {
    expect(getTaskStatusLabel('completed')).toBe('Completada');
  });

  it('should return status itself for unknown status', () => {
    expect(getTaskStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getTaskPriorityLabel', () => {
  it('should return correct label for low', () => {
    expect(getTaskPriorityLabel('low')).toBe('Baja');
  });

  it('should return correct label for medium', () => {
    expect(getTaskPriorityLabel('medium')).toBe('Media');
  });

  it('should return correct label for high', () => {
    expect(getTaskPriorityLabel('high')).toBe('Alta');
  });
});

describe('formatDateShort', () => {
  it('should format date as MM/DD/YYYY', () => {
    expect(formatDateShort('2026-05-15')).toBe('05/15/2026');
  });

  it('should return - for empty date', () => {
    expect(formatDateShort('')).toBe('-');
  });
});

describe('isOverdue', () => {
  it('should return true for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(isOverdue(pastDate.toISOString().split('T')[0])).toBe(true);
  });

  it('should return false for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(isOverdue(futureDate.toISOString().split('T')[0])).toBe(false);
  });

  it('should return false for empty date', () => {
    expect(isOverdue('')).toBe(false);
  });
});

describe('filterTasksByProject', () => {
  const tasks = [
    {id: 1, project_id: 1, title: 'Task 1'},
    {id: 2, project_id: null, title: 'Task 2'},
    {id: 3, project_id: 2, title: 'Task 3'},
    {id: 4, project_id: null, title: 'Task 4'},
  ];

  it('should filter tasks with specific project_id', () => {
    const result = filterTasksByProject(tasks, 1);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Task 1');
  });

  it('should filter independent tasks (null project_id)', () => {
    const result = filterTasksByProject(tasks, null);
    expect(result).toHaveLength(2);
  });

  it('should return empty array for non-existent project', () => {
    const result = filterTasksByProject(tasks, 999);
    expect(result).toHaveLength(0);
  });
});