import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {Pool} from 'pg';
import equipmentRoutes from './routes/equipment.js';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({status: 'ok', database: 'connected'});
  } catch (error) {
    res.status(500).json({status: 'error', database: 'disconnected'});
  }
});

app.post('/api/admin/fix-constraints', async (req, res) => {
  try {
    await pool.query('ALTER TABLE equipment ADD CONSTRAINT equipment_external_id_unique UNIQUE (external_id)');
    res.json({success: true, message: 'Constraint added'});
  } catch (error: any) {
    if (error.code === '42P07') {
      res.json({success: true, message: 'Constraint already exists'});
    } else {
      res.status(500).json({error: error.message});
    }
  }
});

app.post('/api/admin/add-project-color', async (req, res) => {
  try {
    await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT \'#4CAAF2\'');
    res.json({success: true, message: 'Column added'});
  } catch (error: any) {
    if (error.code === '42701') {
      res.json({success: true, message: 'Column already exists'});
    } else {
      res.status(500).json({error: error.message});
    }
  }
});

app.post('/api/admin/add-task-time', async (req, res) => {
  try {
    await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME NOT NULL DEFAULT \'09:00\'');
    await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT \'none\'');
    await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1');
    await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end DATE');
    res.json({success: true, message: 'Task columns added'});
  } catch (error: any) {
    if (error.code === '42701') {
      res.json({success: true, message: 'Columns already exist'});
    } else {
      res.status(500).json({error: error.message});
    }
  }
});

app.use('/api/equipment', equipmentRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
export {pool};