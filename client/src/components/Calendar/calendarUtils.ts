// Tipos para el calendario
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  allDay?: boolean;
  type: 'project' | 'equipment' | 'task';
  data: ProjectEvent | EquipmentEvent | TaskEvent;
}

export interface ProjectEvent {
  id: number;
  name: string;
  description: string;
  status: string;
  color: string;
  start_date: string;
  end_date: string;
}

export interface TaskEvent {
  id: number;
  project_id: number | null;
  project_name?: string;
  project_color?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  due_time: string;
  recurrence: string;
  recurrence_interval: number;
  recurrence_end: string | null;
}

export interface EquipmentEvent {
  id: number;
  external_id: string;
  description: string;
  location: string;
  calibration_date: string;
  expiration_date: string;
  status: string;
  norm: string;
  notes: string;
}

// Colores del tema
export const COLORS = {
  project: '#4CAAF2',
  equipmentGreen: '#4ADE80',
  equipmentOrange: '#FBBF24',
  equipmentRed: '#F87171',
  taskHigh: '#F87171',
  taskMedium: '#FBBF24',
  taskLow: '#4ADE80',
};

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return COLORS.taskHigh;
    case 'medium': return COLORS.taskMedium;
    case 'low': return COLORS.taskLow;
    default: return COLORS.taskMedium;
  }
}

/**
 * Calcula los días hasta el vencimiento
 */
export function getDaysUntilExpiration(expirationDate: string): number {
  if (!expirationDate) return Infinity;
  const expDate = new Date(expirationDate);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna el color según los días hasta vencimiento
 */
export function getEquipmentColor(expirationDate: string): string {
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) return COLORS.equipmentRed;
  if (days <= 30) return COLORS.equipmentOrange;
  return COLORS.equipmentGreen;
}

/**
 * Convierte proyectos a eventos del calendario
 */
export function mapProjectsToEvents(projects: ProjectEvent[]): CalendarEvent[] {
  return projects.map(project => ({
    id: `project-${project.id}`,
    title: project.name,
    start: project.start_date,
    end: project.end_date,
    color: project.color || COLORS.project,
    type: 'project',
    data: project,
  }));
}

/**
 * Convierte equipos a eventos del calendario
 */
export function mapEquipmentToEvents(equipment: EquipmentEvent[]): CalendarEvent[] {
  return equipment
    .filter(eq => eq.expiration_date)
    .map(eq => {
      const expDateOnly = eq.expiration_date.split('T')[0];
      return {
        id: `equipment-${eq.id}`,
        title: `${eq.external_id}: ${eq.description}`,
        start: `${expDateOnly}T23:59:00`,
        allDay: true,
        color: getEquipmentColor(eq.expiration_date),
        type: 'equipment',
        data: eq,
      };
    });
}

/**
 * Convierte tareas a eventos del calendario
 */
export function mapTasksToEvents(tasks: TaskEvent[]): CalendarEvent[] {
  return tasks
    .filter(task => task.due_date && task.status !== 'completed')
    .map(task => {
      const projectName = task.project_name || 'Sin proyecto';
      const color = task.project_color || getPriorityColor(task.priority);
      const dueTime = (task.due_time || '09:00').substring(0, 5);
      const dueDateOnly = task.due_date.split('T')[0];
      return {
        id: `task-${task.id}`,
        title: `${task.title} (${projectName})`,
        start: `${dueDateOnly}T${dueTime}:00`,
        allDay: false,
        color: color,
        type: 'task' as const,
        data: task,
      };
    });
}

/**
 * Combina equipos y tareas (proyectos no se muestran, solo sus actividades)
 */
export function mergeEvents(equipment: EquipmentEvent[], tasks: TaskEvent[]): CalendarEvent[] {
  return [
    ...mapEquipmentToEvents(equipment),
    ...mapTasksToEvents(tasks),
  ];
}

/**
 * Formatea fecha para mostrar en modal (dd/mm/yy)
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Obtiene el texto del estado de vencimiento
 */
export function getExpirationStatus(expirationDate: string): {text: string; color: string} {
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) return {text: `Vencido hace ${Math.abs(days)} días`, color: COLORS.equipmentRed};
  if (days === 0) return {text: 'Vence hoy', color: COLORS.equipmentRed};
  if (days === 1) return {text: 'Vence mañana', color: COLORS.equipmentOrange};
  if (days <= 30) return {text: `Vence en ${days} días`, color: COLORS.equipmentOrange};
  return {text: `Vence en ${days} días`, color: COLORS.equipmentGreen};
}