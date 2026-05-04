import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {Pool} from 'pg';
import equipmentRoutes from './routes/equipment';
import projectsRoutes from './routes/projects';
import tasksRoutes from './routes/tasks';

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

app.use('/api/equipment', equipmentRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
export {pool};