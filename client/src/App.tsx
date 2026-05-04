import {BrowserRouter, Routes, Route, Link, useLocation} from 'react-router-dom';
import {useState, useEffect} from 'react';
import './App.css';
import CalendarView from './components/Calendar/CalendarView';
import TasksView from './components/Tasks/TasksView';
import NotificationBell from './components/Alerts/NotificationBell';
import EquipmentCharts from './components/Charts/EquipmentCharts';
import ProjectChart from './components/Charts/ProjectChart';
import TaskChart from './components/Charts/TaskChart';
import {API_URL} from './config';

interface Equipment {
  id: number;
  external_id: string;
  description: string;
  location: string;
  calibration_date: string;
  expiration_date: string;
  status: string;
  norm: string;
  notes: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}

function Navigation() {
  const location = useLocation();
  const navItems = [
    {path: '/', label: 'Dashboard', icon: '📊'},
    {path: '/equipment', label: 'Calibraciones', icon: '🔧'},
    {path: '/projects', label: 'Proyectos', icon: '📁'},
    {path: '/tasks', label: 'Tareas', icon: '✅'},
    {path: '/calendar', label: 'Calendario', icon: '📅'},
  ];
  return (
    <nav className="bg-[#1A2D44] p-4 flex gap-4 border-b border-[#2a3f5a]">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`px-4 py-2 rounded-lg transition-colors ${
            location.pathname === item.path
              ? 'bg-[#4CAAF2] text-white'
              : 'text-[#8BA3B9] hover:bg-[#2a3f5a]'
          }`}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/equipment`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/projects`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/tasks`).then(r => r.json()).catch(() => []),
    ]).then(([eq, proj, tsk]) => {
      setEquipment(eq);
      setProjects(proj);
      setTasks(tsk);
      setLoading(false);
    });
  }, []);

  const pendingCalibrations = equipment.filter(e => {
    const expDate = new Date(e.expiration_date);
    const now = new Date();
    const daysUntil = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 30 && daysUntil > 0;
  });

  const outOfServiceCount = equipment.filter(e => e.status === 'out_of_service').length;

  const upcomingTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    return dueDate >= now && dueDate <= in7Days;
  }).sort((a, b) => {
    const priorityOrder = {high: 0, medium: 1, low: 2};
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - Agenda 1.0</h1>
      {loading ? (
        <p className="text-[#8BA3B9]">Cargando...</p>
      ) : (
        <>
          {/* SECCIÓN 1: EQUIPOS */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-[#4CAAF2]">Equipos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A2D44] p-5 rounded-xl">
                <h3 className="text-[#8BA3B9] text-sm uppercase mb-2">Total Equipos</h3>
                <p className="text-4xl font-bold text-[#4CAAF2]">{equipment.length}</p>
              </div>
              <div className="bg-[#1A2D44] p-5 rounded-xl">
                <h3 className="text-[#8BA3B9] text-sm uppercase mb-2">Pendientes (30 días)</h3>
                <p className="text-4xl font-bold text-[#FBBF24]">{pendingCalibrations.length}</p>
              </div>
              <div className="bg-[#1A2D44] p-5 rounded-xl">
                <h3 className="text-[#8BA3B9] text-sm uppercase mb-2">Fuera de Servicio</h3>
                <p className="text-4xl font-bold text-gray-400">{outOfServiceCount}</p>
              </div>
            </div>
            <EquipmentCharts equipment={equipment} />
          </div>

          {/* SECCIÓN 2: PROYECTOS */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-[#4ADE80]">Proyectos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A2D44] p-5 rounded-xl">
                <h3 className="text-[#8BA3B9] text-sm uppercase mb-2">Total Proyectos</h3>
                <p className="text-4xl font-bold text-[#4CAAF2]">{projects.length}</p>
              </div>
              <div className="bg-[#1A2D44] p-5 rounded-xl">
                <h3 className="text-[#8BA3B9] text-sm uppercase mb-2">Completados</h3>
                <p className="text-4xl font-bold text-[#4ADE80]">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
            </div>
            <ProjectChart projects={projects} />
          </div>

          {/* SECCIÓN 3: TAREAS/ACTIVIDADES */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#F87171]">Tareas/Actividades</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskChart tasks={tasks} />
              
              {/* Lista de tareas próximas */}
              <div className="bg-[#1A2D44] p-4 rounded-xl">
                <h3 className="text-lg font-bold text-[#FBBF24] mb-4">Próximos 7 días</h3>
                {upcomingTasks.length === 0 ? (
                  <p className="text-[#8BA3B9]">No hay tareas pendientes</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {upcomingTasks.map(t => (
                      <div key={t.id} className="bg-[#0F1C2E] p-3 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            t.priority === 'high' ? 'bg-red-500' : 
                            t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                          <span className="text-white">{t.title}</span>
                        </div>
                        <span className="text-[#8BA3B9] text-sm">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({external_id: '', description: '', location: '', calibration_date: '', expiration_date: '', status: 'pending', norm: '', notes: ''});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; skipped: number; errors: {row: number; errors: string[]}[]} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/equipment`).then(r => r.json()).then(setEquipment).finally(() => setLoading(false));
  }, []);

  const refreshEquipment = async () => {
    const res = await fetch(`${API_URL}/equipment`);
    setEquipment(await res.json());
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/equipment/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setImportResult(data);
        await refreshEquipment();
      } else {
        alert(data.error || 'Error al importar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/equipment`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({external_id: '', description: '', location: '', calibration_date: '', expiration_date: '', status: 'pending', norm: '', notes: ''});
    await refreshEquipment();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar equipo?')) {
      await fetch(`${API_URL}/equipment/${id}`, {method: 'DELETE'});
      setEquipment(equipment.filter(e => e.id !== id));
    }
  };

  const getStatusColor = (status: string, expDate: string) => {
    if (new Date(expDate) < new Date()) return 'bg-red-500';
    if (status === 'calibrated') return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Equipos de Calibración</h1>
        <div className="flex gap-2">
          <label className="bg-[#10B981] px-4 py-2 rounded-lg hover:bg-[#059669] cursor-pointer flex items-center gap-2">
            <span>📥 Importar Excel</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" disabled={importing} />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="bg-[#4CAAF2] px-4 py-2 rounded-lg hover:bg-[#3a8ecc]">
            {showForm ? 'Cancelar' : '+ Nuevo Equipo'}
          </button>
        </div>
      </div>
      {importing && <p className="text-[#4CAAF2] mb-4">Importando...</p>}
      {importResult && (
        <div className="bg-[#10B981]/20 p-4 rounded-xl mb-4">
          <p className="font-bold">✅ Importación completada</p>
          <p className="text-sm">Importados: {importResult.imported} | Omitidos: {importResult.skipped}</p>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1A2D44] p-6 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <input placeholder="ID" value={form.external_id} onChange={e => setForm({...form, external_id: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" required />
          <input placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white col-span-2" required />
          <input placeholder="Ubicación" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" />
          <input type="date" value={form.calibration_date} onChange={e => setForm({...form, calibration_date: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" />
          <input type="date" value={form.expiration_date} onChange={e => setForm({...form, expiration_date: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white">
            <option value="pending">Pendiente</option>
            <option value="calibrated">Calibrado</option>
          </select>
          <select value={form.norm} onChange={e => setForm({...form, norm: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white">
            <option value="">Seleccionar norma</option>
            <option value="iso_13485">ISO 13485</option>
            <option value="iso_11135">ISO 11135</option>
          </select>
          <button type="submit" className="bg-[#4ADE80] col-span-2 md:col-span-4 p-2 rounded font-bold mt-2">Guardar</button>
        </form>
      )}
      {loading ? (
        <p className="text-[#8BA3B9]">Cargando...</p>
      ) : equipment.length === 0 ? (
        <p className="text-[#8BA3B9]">No hay equipos. Agrega el primero.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-[#1A2D44] rounded-xl">
            <thead>
              <tr className="text-left text-[#8BA3B9] border-b border-[#2a3f5a]">
                <th className="p-4">ID</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4">Calibración</th>
                <th className="p-4">Vencimiento</th>
                <th className="p-4">Norma</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(e => (
                <tr key={e.id} className="border-b border-[#2a3f5a] hover:bg-[#2a3f5a]">
                  <td className="p-4">{e.external_id}</td>
                  <td className="p-4">{e.description}</td>
                  <td className="p-4">{e.location}</td>
                  <td className="p-4">{formatDate(e.calibration_date)}</td>
                  <td className="p-4">{formatDate(e.expiration_date)}</td>
                  <td className="p-4">{e.norm === 'iso_13485' ? 'ISO 13485' : e.norm === 'iso_11135' ? 'ISO 11135' : '-'}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${getStatusColor(e.status, e.expiration_date)}`}>{e.status}</span></td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(e.id)} className="text-[#F87171] hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({name: '', description: '', status: 'active', start_date: '', end_date: ''});
  const [newActivity, setNewActivity] = useState({title: '', description: '', priority: 'medium', due_date: ''});

  const refreshData = async () => {
    const [p, t] = await Promise.all([
      fetch(`${API_URL}/projects`).then(r => r.json()),
      fetch(`${API_URL}/tasks`).then(r => r.json()),
    ]);
    setProjects(p);
    setTasks(t);
  };

  useEffect(() => {
    refreshData().then(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });
    const newProject = await res.json();
    setShowForm(false);
    setForm({name: '', description: '', status: 'active', start_date: '', end_date: ''});
    setProjects([...projects, newProject]);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setForm({name: project.name, description: project.description || '', status: project.status, start_date: project.start_date || '', end_date: project.end_date || ''});
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    await fetch(`${API_URL}/projects/${editingProject.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });
    setShowEditModal(false);
    setEditingProject(null);
    refreshData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este proyecto y todas sus actividades?')) return;
    await fetch(`${API_URL}/projects/${id}`, {method: 'DELETE'});
    refreshData();
  };

  const handleAddActivity = async () => {
    if (!editingProject || !newActivity.title.trim()) return;
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...newActivity, project_id: editingProject.id, status: 'pending'}),
    });
    setNewActivity({title: '', description: '', priority: 'medium', due_date: ''});
    refreshData();
  };

  const handleDeleteActivity = async (taskId: number) => {
    await fetch(`${API_URL}/tasks/${taskId}`, {method: 'DELETE'});
    refreshData();
  };

  const projectTasks = editingProject ? tasks.filter(t => t.project_id === editingProject.id) : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#4CAAF2] px-4 py-2 rounded-lg hover:bg-[#3a8ecc]">{showForm ? 'Cancelar' : '+ Nuevo Proyecto'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1A2D44] p-6 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <input placeholder="Nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white col-span-2" required />
          <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" />
          <input placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white col-span-2" />
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="bg-[#0F1C2E] p-2 rounded text-white">
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="on_hold">En pausa</option>
          </select>
          <button type="submit" className="bg-[#4ADE80] col-span-3 p-2 rounded font-bold">Guardar</button>
        </form>
      )}
      {loading ? <p className="text-[#8BA3B9]">Cargando...</p> : projects.length === 0 ? (
        <p className="text-[#8BA3B9]">No hay proyectos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-[#1A2D44] p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${p.status === 'active' ? 'bg-green-500' : p.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'}`}>{p.status}</span>
              </div>
              <p className="text-[#8BA3B9] text-sm mb-2">{p.description || 'Sin descripción'}</p>
              <p className="text-[#8BA3B9] text-xs">Fechas: {p.start_date || '-'} → {p.end_date || '-'}</p>
              <p className="text-[#4CAAF2] text-sm mt-2">{tasks.filter(t => t.project_id === p.id).length} actividades</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleEdit(p)} className="bg-[#4CAAF2] px-3 py-1 rounded text-sm hover:bg-[#3a8ecc]">Editar</button>
                <button onClick={() => handleDelete(p.id)} className="bg-[#F87171] px-3 py-1 rounded text-sm hover:bg-[#dc2626]">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2D44] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Editar Proyecto</h2>
            <form onSubmit={handleUpdate} className="space-y-4 mb-6">
              <div>
                <label className="text-[#8BA3B9] text-sm">Nombre</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1" required />
              </div>
              <div>
                <label className="text-[#8BA3B9] text-sm">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8BA3B9] text-sm">Fecha inicio</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1" />
                </div>
                <div>
                  <label className="text-[#8BA3B9] text-sm">Fecha fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[#8BA3B9] text-sm">Estado</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1">
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="on_hold">En pausa</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#4ADE80] px-4 py-2 rounded font-bold">Guardar cambios</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-500 px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>

            <div className="border-t border-[#2a3f5a] pt-4">
              <h3 className="text-xl font-bold mb-3">Actividades del Proyecto</h3>
              <div className="bg-[#0F1C2E] p-3 rounded-lg mb-4">
                <p className="text-[#8BA3B9] text-sm mb-2">Agregar nueva actividad:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input placeholder="Título" value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})} className="bg-[#1A2D44] p-2 rounded text-white" />
                  <input type="date" value={newActivity.due_date} onChange={e => setNewActivity({...newActivity, due_date: e.target.value})} className="bg-[#1A2D44] p-2 rounded text-white" />
                </div>
                <div className="flex gap-2">
                  <select value={newActivity.priority} onChange={e => setNewActivity({...newActivity, priority: e.target.value})} className="bg-[#1A2D44] p-2 rounded text-white">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                  <button onClick={handleAddActivity} className="bg-[#4CAAF2] px-3 py-1 rounded text-sm">Agregar</button>
                </div>
              </div>
              {projectTasks.length === 0 ? (
                <p className="text-[#8BA3B9] text-sm">No hay actividades.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {projectTasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-[#0F1C2E] p-2 rounded">
                      <div>
                        <span className="font-medium">{t.title}</span>
                        <span className={`ml-2 text-xs px-1 rounded ${t.status === 'completed' ? 'bg-green-500' : t.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}>{t.status}</span>
                      </div>
                      <button onClick={() => handleDeleteActivity(t.id)} className="text-[#F87171] hover:text-red-400">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0F1C2E]">
        <header className="bg-[#192B39] p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#4CAAF2]">Agenda 1.0</h1>
          <div className="flex items-center gap-4">
            <span className="text-[#8BA3B9] text-sm">Gestión ISO 13485 / 11135</span>
            <NotificationBell />
          </div>
        </header>
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipment" element={<EquipmentList />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/calendar" element={<CalendarView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;