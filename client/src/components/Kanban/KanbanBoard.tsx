import {useState, useEffect} from 'react';
import KanbanCard from './KanbanCard';
import type {TaskEvent, ProjectEvent} from '../Calendar/calendarUtils';
import {API_URL} from '../../config';

interface KanbanBoardProps {
  onEditTask?: (task: TaskEvent) => void;
}

export default function KanbanBoard({onEditTask}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [projects, setProjects] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<TaskEvent | null>(null);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/projects`),
      ]);
      setTasks(await tasksRes.json());
      setProjects(await projectsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatWeekRange = () => {
    const startDay = weekDays[0].getDate();
    const endDay = weekEnd.getDate();
    const startMonth = weekDays[0].toLocaleDateString('es', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('es', { month: 'short' });
    return `${startDay}-${startMonth} - ${endDay}-${endMonth}`;
  };

  const isInWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const taskDate = new Date(dateStr);
    const start = new Date(currentWeekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59);
    return taskDate >= start && taskDate <= end;
  };

  const isOverdue = (task: TaskEvent) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  const filteredTasks = tasks.filter(task => {
    const inWeek = isInWeek(task.due_date);
    const overdue = isOverdue(task);
    const matchesProject = selectedProject === '' || task.project_id === selectedProject;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return (inWeek || overdue) && matchesProject && matchesSearch;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => {
    const inCurrentWeek = isInWeek(t.due_date);
    return t.status === 'completed' && inCurrentWeek;
  });

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId') || '0');
    if (!taskId) return;

    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: newStatus}),
      });
      loadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditTask = (task: TaskEvent) => {
    setEditingTask(task);
    onEditTask?.(task);
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;
    try {
      await fetch(`${API_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...editingTask,
          recurrence_end: editingTask.recurrence_end || null,
        }),
      });
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await fetch(`${API_URL}/tasks/${editingTask.id}`, {method: 'DELETE'});
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCreateTask = async (status: string) => {
    const newTask = {
      title: 'Nueva tarea',
      description: '',
      project_id: selectedProject || null,
      priority: 'medium',
      status: status,
      due_date: currentWeekStart.toISOString().split('T')[0],
      due_time: '09:00',
      recurrence: 'none',
      recurrence_interval: 1,
      recurrence_end: null,
    };
    try {
      await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newTask),
      });
      loadData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (loading) return <div className="p-6 text-[#8BA3B9]">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const newStart = new Date(currentWeekStart);
              newStart.setDate(newStart.getDate() - 7);
              setCurrentWeekStart(newStart);
            }}
            className="bg-[#1A2D44] px-3 py-1 rounded text-white hover:bg-[#2a3f5a]"
          >
            ◀
          </button>
          <h2 className="text-xl font-bold text-white">
            Semana: {formatWeekRange()}
          </h2>
          <button 
            onClick={() => {
              const newStart = new Date(currentWeekStart);
              newStart.setDate(newStart.getDate() + 7);
              setCurrentWeekStart(newStart);
            }}
            className="bg-[#1A2D44] px-3 py-1 rounded text-white hover:bg-[#2a3f5a]"
          >
            ▶
          </button>
        </div>
        
        <div className="flex gap-4">
          <select 
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value === '' ? '' : Number(e.target.value))}
            className="bg-[#1A2D44] text-white p-2 rounded-lg"
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#1A2D44] text-white p-2 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pendiente */}
        <div 
          className="bg-[#1A2D44] rounded-xl p-4 min-h-[400px]"
          onDragOver={e => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'pending')}
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            Pendiente 
            <span className="bg-[#4CAAF2] text-white text-xs px-2 py-0.5 rounded">{pendingTasks.length}</span>
          </h3>
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <KanbanCard 
                key={task.id} 
                task={task} 
                onClick={() => handleEditTask(task)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
          <button 
            onClick={() => handleCreateTask('pending')}
            className="w-full mt-4 bg-[#0F1C2E] text-[#8BA3B9] p-2 rounded hover:bg-[#152538] border border-dashed border-[#8BA3B9]"
          >
            + Nueva
          </button>
        </div>

        {/* En Progreso */}
        <div 
          className="bg-[#1A2D44] rounded-xl p-4 min-h-[400px]"
          onDragOver={e => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'in_progress')}
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            En Progreso
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">{inProgressTasks.length}</span>
          </h3>
          <div className="space-y-2">
            {inProgressTasks.map(task => (
              <KanbanCard 
                key={task.id} 
                task={task} 
                onClick={() => handleEditTask(task)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
          <button 
            onClick={() => handleCreateTask('in_progress')}
            className="w-full mt-4 bg-[#0F1C2E] text-[#8BA3B9] p-2 rounded hover:bg-[#152538] border border-dashed border-[#8BA3B9]"
          >
            + Nueva
          </button>
        </div>

        {/* Completado */}
        <div 
          className="bg-[#1A2D44] rounded-xl p-4 min-h-[400px]"
          onDragOver={e => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'completed')}
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            Completado
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">{completedTasks.length}</span>
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <KanbanCard 
                key={task.id} 
                task={task} 
                onClick={() => handleEditTask(task)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
          {completedTasks.length === 0 && (
            <p className="text-[#8BA3B9] text-sm text-center mt-4">Sin tareas completadas esta semana</p>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingTask(null)}>
          <div 
            className="bg-[#1A2D44] rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Editar Tarea</h2>
              <button onClick={() => setEditingTask(null)} className="text-[#8BA3B9] hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[#8BA3B9] text-sm">Título</label>
                <input 
                  type="text"
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                />
              </div>

              <div>
                <label className="text-[#8BA3B9] text-sm">Descripción</label>
                <textarea 
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[#8BA3B9] text-sm">Proyecto</label>
                <select 
                  value={editingTask.project_id || ''}
                  onChange={e => setEditingTask({...editingTask, project_id: e.target.value ? Number(e.target.value) : null})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                >
                  <option value="">Sin proyecto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8BA3B9] text-sm">Fecha</label>
                  <input 
                    type="date"
                    value={editingTask.due_date?.split('T')[0] || ''}
                    onChange={e => setEditingTask({...editingTask, due_date: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[#8BA3B9] text-sm">Hora</label>
                  <input 
                    type="time"
                    value={editingTask.due_time?.substring(0, 5) || '09:00'}
                    onChange={e => setEditingTask({...editingTask, due_time: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8BA3B9] text-sm">Prioridad</label>
                  <select 
                    value={editingTask.priority}
                    onChange={e => setEditingTask({...editingTask, priority: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#8BA3B9] text-sm">Estado</label>
                  <select 
                    value={editingTask.status}
                    onChange={e => setEditingTask({...editingTask, status: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#8BA3B9] text-sm">Repetir</label>
                <select 
                  value={editingTask.recurrence || 'none'}
                  onChange={e => setEditingTask({...editingTask, recurrence: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                >
                  <option value="none">No repetir</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2a3f5a] flex gap-2">
              <button 
                onClick={handleDeleteTask}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                Eliminar
              </button>
              <button 
                onClick={() => setEditingTask(null)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTask}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}