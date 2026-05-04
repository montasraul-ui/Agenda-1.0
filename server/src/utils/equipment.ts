export function excelDateToJSDate(serial: number | undefined | null): string | null {
  if (serial === undefined || serial === null || isNaN(serial) || serial === 0) {
    return null;
  }
  const epoch = new Date(Date.UTC(1900, 0, 1));
  const date = new Date(epoch.getTime() + (serial - 1) * 86400000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface ExcelRow {
  '__EMPTY'?: string;
  '__EMPTY_1'?: string;
  '__EMPTY_2'?: string;
  'Master List of Instruments and Calibration Schedule'?: number;
  '__EMPTY_3'?: number;
  '__EMPTY_6'?: string;
  '__EMPTY_9'?: string;
  '__EMPTY_11'?: string;
}

export function parseExcelRow(row: ExcelRow) {
  return {
    external_id: row['__EMPTY'] || '',
    description: row['__EMPTY_1'] || '',
    location: row['__EMPTY_2'] || '',
    calibration_date: row['Master List of Instruments and Calibration Schedule'] 
      ? excelDateToJSDate(row['Master List of Instruments and Calibration Schedule']) 
      : null,
    expiration_date: row['__EMPTY_3'] 
      ? excelDateToJSDate(row['__EMPTY_3']) 
      : null,
    status: mapStatus(row['__EMPTY_6']),
    norm: row['__EMPTY_9'] || '',
    notes: row['__EMPTY_11'] || '',
  };
}

export function mapStatus(excelStatus?: string): string {
  if (!excelStatus) return 'pending';
  const statusMap: Record<string, string> = {
    'IS': 'calibrated',
    'OOS': 'expired',
    'N/A': 'pending',
    'IP': 'in_progress',
  };
  return statusMap[excelStatus.toUpperCase()] || 'pending';
}

export function validateEquipmentData(data: {external_id: string; description: string}): {valid: boolean; errors: string[]} {
  const errors: string[] = [];
  if (!data.external_id || data.external_id.trim() === '') {
    errors.push('ID de equipo es requerido');
  }
  if (!data.description || data.description.trim() === '') {
    errors.push('Descripción es requerida');
  }
  return {valid: errors.length === 0, errors};
}