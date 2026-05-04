export interface EquipmentEvent {
  id: number;
  external_id: string;
  description: string;
  location: string;
  expiration_date: string;
  calibration_date?: string;
  status?: string;
  norm?: string;
  notes?: string;
}

export interface Alert {
  id: string;
  equipmentId: number;
  externalId: string;
  description: string;
  location: string;
  expirationDate: string;
  daysUntilExpiration: number;
  alertLevel: 'critical' | 'warning' | 'info';
}

export const ALERT_THRESHOLDS = {
  CRITICAL: 7,
  WARNING: 15,
  INFO: 30,
};

export function getDaysUntilExpiration(expirationDate: string): number {
  if (!expirationDate) return Infinity;
  const expDate = new Date(expirationDate);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getAlertLevel(daysUntil: number): 'critical' | 'warning' | 'info' {
  if (daysUntil <= ALERT_THRESHOLDS.CRITICAL) return 'critical';
  if (daysUntil <= ALERT_THRESHOLDS.WARNING) return 'warning';
  return 'info';
}

export function generateAlerts(equipment: EquipmentEvent[]): Alert[] {
  return equipment
    .map(eq => {
      const days = getDaysUntilExpiration(eq.expiration_date);
      if (days > ALERT_THRESHOLDS.INFO || days < -90) return null;
      
      return {
        id: `alert-${eq.id}`,
        equipmentId: eq.id,
        externalId: eq.external_id,
        description: eq.description,
        location: eq.location || '-',
        expirationDate: eq.expiration_date,
        daysUntilExpiration: days,
        alertLevel: getAlertLevel(days),
      };
    })
    .filter((alert): alert is Alert => alert !== null)
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
}

export function formatAlertDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

export function getAlertLevelColor(level: 'critical' | 'warning' | 'info'): string {
  switch (level) {
    case 'critical': return '#F87171';
    case 'warning': return '#FBBF24';
    case 'info': return '#4ADE80';
  }
}

export function getAlertLevelLabel(level: 'critical' | 'warning' | 'info'): string {
  switch (level) {
    case 'critical': return 'Crítico';
    case 'warning': return 'Advertencia';
    case 'info': return 'Próximo';
  }
}

export function formatDaysUntil(days: number): string {
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
}