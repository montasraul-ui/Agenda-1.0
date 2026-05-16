import {Router} from 'express';
import {pool} from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, t.project_id, t.title, t.description, t.status, t.priority, t.due_date,
        t.due_time, t.recurrence, t.recurrence_interval, t.recurrence_end,
        COALESCE(p.name, '') as project_name, COALESCE(p.color, '') as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.due_date ASC, t.due_time ASC
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
    const {project_id, title, description, status, priority, due_date, due_time, recurrence, recurrence_interval, recurrence_end} = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, due_time, recurrence, recurrence_interval, recurrence_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [project_id, title, description, status || 'pending', priority || 'medium', due_date, due_time || '09:00', recurrence || 'none', recurrence_interval || 1, recurrence_end || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({error: 'Failed to create task'});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {project_id, title, description, status, priority, due_date, due_time, recurrence, recurrence_interval, recurrence_end} = req.body;
    const result = await pool.query(
      `UPDATE tasks SET project_id=$1, title=$2, description=$3, status=$4, priority=$5, due_date=$6, due_time=$7, recurrence=$8, recurrence_interval=$9, recurrence_end=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [project_id, title, description, status, priority, due_date, due_time, recurrence, recurrence_interval, recurrence_end, id]
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

router.post('/:id/complete', async (req, res) => {
  try {
    const {id} = req.params;
    
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({error: 'Task not found'});
    }
    
    const task = taskResult.rows[0];
    
    await pool.query('UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', id]);
    
    if (task.recurrence && task.recurrence !== 'none') {
      let nextDate = new Date(task.due_date);
      const interval = task.recurrence_interval || 1;
      
      if (task.recurrence === 'daily') {
        nextDate.setDate(nextDate.getDate() + interval);
      } else if (task.recurrence === 'weekly') {
        nextDate.setDate(nextDate.getDate() + (interval * 7));
      } else if (task.recurrence === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + interval);
      }
      
      if (task.recurrence_end && new Date(task.recurrence_end) < nextDate) {
        return res.json({success: true, message: 'Task completed, recurrence ended'});
      }
      
      const nextDueDate = nextDate.toISOString().split('T')[0];
      
      await pool.query(
        `INSERT INTO tasks (project_id, title, description, status, priority, due_date, due_time, recurrence, recurrence_interval, recurrence_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [task.project_id, task.title, task.description, 'pending', task.priority, nextDueDate, task.due_time, task.recurrence, task.recurrence_interval, task.recurrence_end]
      );
      
      return res.json({success: true, message: 'Task completed, next recurring task created'});
    }
    
    res.json({success: true, message: 'Task completed'});
  } catch (error) {
    res.status(500).json({error: 'Failed to complete task'});
  }
});

export default router;