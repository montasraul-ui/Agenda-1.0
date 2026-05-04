import {Router} from 'express';
import {pool} from '../index';

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
    const {name, description, status, start_date, end_date} = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, description, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, status || 'active', start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to create project'});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {name, description, status, start_date, end_date} = req.body;
    const result = await pool.query(
      `UPDATE projects SET name=$1, description=$2, status=$3, start_date=$4, end_date=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, description, status, start_date, end_date, id]
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

export default router;