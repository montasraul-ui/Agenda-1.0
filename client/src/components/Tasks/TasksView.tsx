import {useState, useEffect} from 'react';
import {API_URL} from '../../config';

interface Task {
  id: number;
  project_id: number | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}

interface Project {
  id: number;
  name: string;
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'independent' | 'project'>('all');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [form, setForm] = useState({
    project_id: '' as string | number,
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/projects`)
      ]);
      setTasks(await tasksRes.json());
      setProjects(await projectsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      project_id: form.project_id === '' ? null : form.project_id
    };
    
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    setShowForm(false);
    setForm({
      project_id: '',
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: ''
    });
    loadData();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...task, status: newStatus})
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar tarea?')) {
      await fetch(`${API_URL}/tasks/${id}`, {method: 'DELETE'});
      loadData();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'independent') return task.project_id === null;
    if (filter === 'project') return task.project_id !== null;
    return true;
  }).filter(task => {
    if (selectedProject === '') return true;
    return task.project_id === Number(selectedProject);
  });

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return 'Sin proyecto';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Proyecto desconocido';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  if (loading) return <div className="p-6 text-[#8BA3B9]">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tareas</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#4CAAF2] px-4 py-2 rounded-lg hover:bg-[#3a8ecc]"
        >
          {showForm ? 'Cancelar' : '+ Nueva Tarea'}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value as any)}
          className="bg-[#1A2D44] text-white p-2 rounded-lg"
        >
          <option value="all">Todas</option>
          <option value="independent">Sin proyecto</option>
          <option value="project">Con proyecto</option>
        </select>
        
        {filter === 'project' && (
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
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1A2D44] p-6 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <select 
            value={form.project_id}
            onChange={e => setForm({...form, project_id: e.target.value})}
            className="bg-[#0F1C2E] p-2 rounded text-white"
          >
            <option value="">Sin proyecto</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <input 
            placeholder="Título" 
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            className="bg-[#0F1C2E] p-2 rounded text-white col-span-2"
            required
          />
          
          <input 
            placeholder="Descripción" 
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="bg-[#0F1C2E] p-2 rounded text-white col-span-3"
          />
          
          <select 
            value={form.priority}
            onChange={e => setForm({...form, priority: e.target.value})}
            className="bg-[#0F1C2E] p-2 rounded text-white"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          
          <input 
            type="date"
            value={form.due_date}
            onChange={e => setForm({...form, due_date: e.target.value})}
            className="bg-[#0F1C2E] p-2 rounded text-white"
          />
          
          <button type="submit" className="bg-[#4ADE80] col-span-1 p-2 rounded font-bold">
            Guardar
          </button>
        </form>
      )}

      {/* Lista de tareas */}
      {filteredTasks.length === 0 ? (
        <p className="text-[#8BA3B9]">No hay tareas</p>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-[#1A2D44] p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select 
                  value={task.status}
                  onChange={e => handleStatusChange(task, e.target.value)}
                  className={`text-white text-sm px-2 py-1 rounded ${getStatusColor(task.status)}`}
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completada</option>
                </select>
                
                <div>
                  <h3 className="font-bold text-white">{task.title}</h3>
                  <p className="text-[#8BA3B9] text-sm">{task.description || 'Sin descripción'}</p>
                  <p className="text-[#8BA3B9] text-xs mt-1">
                    {getProjectName(task.project_id)} • {formatDate(task.due_date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs text-white ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="text-[#F87171] hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}