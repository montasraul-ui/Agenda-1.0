import {Router} from 'express';
import {pool} from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, t.project_id, t.title, t.description, t.status, t.priority, t.due_date,
        COALESCE(p.name, '') as project_name, COALESCE(p.color, '') as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.due_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch tasks'});
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const {projectId} = req.params;
    const result = await pool.query('SELECT * FROM tasks WHERE project_id=$1 ORDER BY due_date ASC', [projectId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch tasks'});
  }
});

router.post('/', async (req, res) => {
  try {
    const {project_id, title, description, status, priority, due_date} = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, title, description, status || 'pending', priority || 'medium', due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to create task'});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {project_id, title, description, status, priority, due_date} = req.body;
    const result = await pool.query(
      `UPDATE tasks SET project_id=$1, title=$2, description=$3, status=$4, priority=$5, due_date=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [project_id, title, description, status, priority, due_date, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to update task'});
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({error: 'Failed to delete task'});
  }
});

export default router;