import {Router} from 'express';
import {pool} from '../index.js';
import multer from 'multer';
import * as XLSX from 'xlsx';
import {validateEquipmentData, excelDateToJSDate} from '../utils/equipment.js';

function mapStatus(excelStatus?: string): string {
  if (!excelStatus) return 'pending';
  const statusMap: Record<string, string> = {
    'IS': 'calibrated',
    'OOS': 'expired',
    'N/A': 'pending',
    'IP': 'in_progress',
  };
  return statusMap[excelStatus.toUpperCase()] || 'pending';
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 10 * 1024 * 1024}
});

function parseRowFromSheet(row: any, sheetType: string): any {
  if (sheetType === 'cal_schedule' || sheetType === 'master_list_dl') {
    return parseExcelRowByIndex(row);
  }
  if (sheetType === 'fuera_servicio') {
    const values = Object.values(row).filter(v => v !== undefined && v !== null && v !== '');
    return {
      external_id: String(values[0] || ''),
      description: String(values[1] || ''),
      location: String(values[2] || ''),
      calibration_date: parseDateFromValue(values[3]),
      expiration_date: parseDateFromValue(values[4]),
      status: mapStatusOS(String(values[5])),
      norm: 'ANUAL',
      notes: values[values.length - 1] ? String(values[values.length - 1]) : '',
    };
  }
  return {external_id: '', description: '', location: '', calibration_date: null, expiration_date: null, status: 'pending', norm: '', notes: ''};
}

function parseExcelRowByIndex(row: any): any {
  const values = Object.values(row).filter(v => v !== undefined && v !== null && v !== '');
  if (values.length < 3) return {external_id: '', description: '', location: '', calibration_date: null, expiration_date: null, status: 'pending', norm: '', notes: ''};
  
  return {
    external_id: String(values[0] || ''),
    description: String(values[1] || ''),
    location: String(values[2] || ''),
    calibration_date: parseDateFromValue(values[3]),
    expiration_date: parseDateFromValue(values[4]),
    status: mapStatus(String(values[5])),
    norm: String(values[6] || ''),
    notes: values[7] ? String(values[7]) : '',
  };
}

function parseDateFromValue(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'number') {
    return excelDateToJSDate(value);
  }
  if (typeof value === 'string') {
    const cleaned = value.trim();
    const dateMatch = cleaned.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
    const isoDate = new Date(cleaned);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString().split('T')[0];
    }
  }
  return null;
}

function mapStatusOS(status?: string): string {
  if (!status) return 'pending';
  const map: Record<string, string> = {
    'OS': 'out_of_service',
    'IS': 'in_service',
    'OC': 'out_for_calibration',
    'OOS': 'expired',
  };
  return map[status] || 'pending';
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY expiration_date ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch equipment'});
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expired = await pool.query(
      `SELECT * FROM equipment WHERE expiration_date < $1 ORDER BY expiration_date ASC`,
      [now.toISOString().split('T')[0]]
    );
    
    const upcoming = await pool.query(
      `SELECT * FROM equipment WHERE expiration_date >= $1 AND expiration_date <= $2 ORDER BY expiration_date ASC`,
      [now.toISOString().split('T')[0], in30Days.toISOString().split('T')[0]]
    );

    res.json({
      expired: expired.rows,
      upcoming: upcoming.rows,
      expiredCount: expired.rows.length,
      upcomingCount: upcoming.rows.length,
    });
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch alerts'});
  }
});

router.post('/', async (req, res) => {
  try {
    const {external_id, description, location, calibration_date, expiration_date, status, norm, notes} = req.body;
    const result = await pool.query(
      `INSERT INTO equipment (external_id, description, location, calibration_date, expiration_date, status, norm, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [external_id, description, location, calibration_date, expiration_date, status || 'pending', norm, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to create equipment'});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {external_id, description, location, calibration_date, expiration_date, status, norm, notes} = req.body;
    const result = await pool.query(
      `UPDATE equipment SET external_id=$1, description=$2, location=$3, calibration_date=$4, expiration_date=$5, status=$6, norm=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [external_id, description, location, calibration_date, expiration_date, status, norm, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to update equipment'});
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    await pool.query('DELETE FROM equipment WHERE id=$1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({error: 'Failed to delete equipment'});
  }
});

const SHEET_CONFIG: Record<string, {type: string; skipRows: number; name: string}> = {
  'Cal Schedule': {type: 'cal_schedule', skipRows: 2, name: 'Cal Schedule'},
  'Master List DL': {type: 'master_list_dl', skipRows: 3, name: 'Master List DL'},
  'iNSTRUMENTOS FUERA DE SERVICIO': {type: 'fuera_servicio', skipRows: 0, name: 'Instrumentos Fora de Servicio'},
};

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({error: 'No file uploaded'});
    }

    const workbook = XLSX.read(req.file.buffer, {type: 'buffer'});
    let allEquipmentData: any[] = [];
    const sheetResults: {name: string; imported: number; skipped: number}[] = [];

    for (const sheetName of workbook.SheetNames) {
      const config = SHEET_CONFIG[sheetName];
      if (!config) continue;

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any>(worksheet);
      const sheetData = data.slice(config.skipRows).map((row: any) => parseRowFromSheet(row, config.type)).filter((row: any) => row.external_id);
      allEquipmentData = [...allEquipmentData, ...sheetData];
      sheetResults.push({name: config.name, imported: sheetData.length, skipped: 0});
    }

    const equipmentData = allEquipmentData;

    const validationErrors: {row: number; errors: string[]}[] = [];
    const validData: typeof equipmentData = [];

    equipmentData.forEach((item, index) => {
      const validation = validateEquipmentData(item);
      if (!validation.valid) {
        validationErrors.push({row: index + 3, errors: validation.errors});
      } else {
        validData.push(item);
      }
    });

    if (validData.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron equipos válidos para importar',
        validationErrors,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertPromises = validData.map(item => 
        client.query(
          `INSERT INTO equipment (external_id, description, location, calibration_date, expiration_date, status, norm, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (external_id) DO UPDATE SET
           description = EXCLUDED.description,
           location = EXCLUDED.location,
           calibration_date = EXCLUDED.calibration_date,
           expiration_date = EXCLUDED.expiration_date,
           status = EXCLUDED.status,
           norm = EXCLUDED.norm,
           notes = EXCLUDED.notes,
           updated_at = NOW()`,
          [item.external_id, item.description, item.location, item.calibration_date, item.expiration_date, item.status, item.norm, item.notes]
        )
      );

      await Promise.all(insertPromises);
      await client.query('COMMIT');

      res.json({
        success: true,
        imported: validData.length,
        skipped: validationErrors.length,
        errors: validationErrors,
        sheets: sheetResults,
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Failed to import Excel file',
      details: error.message || String(error)
    });
  }
});

export default router;