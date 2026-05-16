import {Router} from 'express';
import {pool} from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch projects'});
  }
});

router.post('/', async (req, res) => {
  try {
    const {name, description, status, color, start_date, end_date} = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, description, status, color, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, status || 'active', color || '#4CAAF2', start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to create project'});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {name, description, status, color, start_date, end_date} = req.body;
    const result = await pool.query(
      `UPDATE projects SET name=$1, description=$2, status=$3, color=$4, start_date=$5, end_date=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, description, status, color, start_date, end_date, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to update project'});
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    await pool.query('DELETE FROM projects WHERE id=$1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({error: 'Failed to delete project'});
  }
});

router.patch('/set-colors', async (req, res) => {
  try {
    await pool.query(`
      UPDATE projects SET color = CASE
        WHEN id = 6 THEN '#4CAAF2'
        WHEN id = 7 THEN '#4ADE80'
        WHEN id = 8 THEN '#FBBF24'
        WHEN id = 9 THEN '#A78BFA'
        ELSE color
      END
    `);
    res.json({success: true, message: 'Colores actualizados'});
  } catch (error) {
    res.status(500).json({error: 'Failed to update colors'});
  }
});

export default router;