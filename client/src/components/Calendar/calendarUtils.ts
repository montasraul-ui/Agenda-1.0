// Tipos para el calendario
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  type: 'project' | 'equipment';
  data: ProjectEvent | EquipmentEvent;
}

export interface ProjectEvent {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
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
};

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
    color: COLORS.project,
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
    .map(eq => ({
      id: `equipment-${eq.id}`,
      title: `${eq.external_id}: ${eq.description}`,
      start: eq.expiration_date,
      color: getEquipmentColor(eq.expiration_date),
      type: 'equipment',
      data: eq,
    }));
}

/**
 * Combina proyectos y equipos en un solo array de eventos
 */
export function mergeEvents(projects: ProjectEvent[], equipment: EquipmentEvent[]): CalendarEvent[] {
  return [
    ...mapProjectsToEvents(projects),
    ...mapEquipmentToEvents(equipment),
  ];
}

/**
 * Formatea fecha para mostrar en modal
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
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