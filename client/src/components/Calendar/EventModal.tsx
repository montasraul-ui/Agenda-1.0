import {useEffect, useState} from 'react';
import type {CalendarEvent, EquipmentEvent, ProjectEvent, TaskEvent} from './calendarUtils';
import {formatDateShort, getExpirationStatus} from './calendarUtils';
import {API_URL} from '../../config';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onTaskCompleted?: () => void;
  projects?: ProjectEvent[];
}

export default function EventModal({event, onClose, onTaskCompleted, projects = []}: EventModalProps) {
  const [completing, setCompleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    project_id: null as number | null,
    priority: 'medium',
    status: 'pending',
    due_date: '',
    due_time: '09:00',
    recurrence: 'none',
    recurrence_interval: 1,
    recurrence_end: '',
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (event?.type === 'task') {
      const task = event.data as TaskEvent;
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        project_id: task.project_id,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        due_time: task.due_time ? task.due_time.substring(0, 5) : '09:00',
        recurrence: task.recurrence || 'none',
        recurrence_interval: task.recurrence_interval || 1,
        recurrence_end: task.recurrence_end || '',
      });
    }
  }, [event]);

  if (!event) return null;

  const isProject = event.type === 'project';
  const isTask = event.type === 'task';
  const projectData = isProject ? (event.data as ProjectEvent) : null;
  const equipmentData = !isProject && !isTask ? (event.data as EquipmentEvent) : null;
  const taskData = isTask ? (event.data as TaskEvent) : null;

  const handleCompleteTask = async () => {
    if (!taskData || completing) return;
    setCompleting(true);
    try {
      await fetch(`${API_URL}/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'completed'}),
      });
      onTaskCompleted?.();
      onClose();
    } catch (error) {
      console.error('Error completing task:', error);
      setCompleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!taskData || saving) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...editForm,
          recurrence_end: editForm.recurrence_end || null,
        }),
      });
      onTaskCompleted?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task:', error);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskData || deleting) return;
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/tasks/${taskData.id}`, {method: 'DELETE'});
      onTaskCompleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setDeleting(false);
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F87171';
      case 'medium': return '#FBBF24';
      case 'low': return '#4ADE80';
      default: return '#A78BFA';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1A2D44] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">
            {isProject ? 'Proyecto' : isTask ? (isEditing ? 'Editar Tarea' : 'Tarea') : 'Equipo de Calibración'}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#8BA3B9] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* TAREAS - MODO EDICIÓN */}
          {isTask && taskData && isEditing && (
            <>
              <div>
                <label className="text-[#8BA3B9] text-sm">Título</label>
                <input 
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[#8BA3B9] text-sm">Descripción</label>
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[#8BA3B9] text-sm">Proyecto</label>
                <select 
                  value={editForm.project_id || ''}
                  onChange={e => setEditForm({...editForm, project_id: e.target.value ? Number(e.target.value) : null})}
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
                    value={editForm.due_date}
                    onChange={e => setEditForm({...editForm, due_date: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#8BA3B9] text-sm">Hora</label>
                  <input 
                    type="time"
                    value={editForm.due_time}
                    onChange={e => setEditForm({...editForm, due_time: e.target.value})}
                    className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8BA3B9] text-sm">Prioridad</label>
                  <select 
                    value={editForm.priority}
                    onChange={e => setEditForm({...editForm, priority: e.target.value})}
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
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
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
                  value={editForm.recurrence}
                  onChange={e => setEditForm({...editForm, recurrence: e.target.value})}
                  className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                >
                  <option value="none">No repetir</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                </select>
              </div>

              {editForm.recurrence !== 'none' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#8BA3B9] text-sm">Intervalo</label>
                    <input 
                      type="number"
                      min="1"
                      value={editForm.recurrence_interval}
                      onChange={e => setEditForm({...editForm, recurrence_interval: parseInt(e.target.value) || 1})}
                      className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[#8BA3B9] text-sm">Fin recurrencia</label>
                    <input 
                      type="date"
                      value={editForm.recurrence_end}
                      onChange={e => setEditForm({...editForm, recurrence_end: e.target.value})}
                      className="w-full bg-[#0F1C2E] p-2 rounded text-white mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#2a3f5a] flex gap-2">
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </>
          )}

          {/* TAREAS - MODO SOLO LECTURA */}
          {isTask && taskData && !isEditing && (
            <>
              <div>
                <h3 className="text-[#4CAAF2] text-lg font-semibold">{event.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8BA3B9] text-sm">Proyecto</p>
                  <p className="text-white">{taskData.project_name || 'Sin proyecto'}</p>
                </div>
                <div>
                  <p className="text-[#8BA3B9] text-sm">Estado</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    taskData.status === 'completed' ? 'bg-blue-500' : 
                    taskData.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}>
                    {taskData.status === 'completed' ? 'Completada' : 
                     taskData.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8BA3B9] text-sm">Prioridad</p>
                  <span 
                    className="px-2 py-1 rounded text-xs"
                    style={{backgroundColor: getPriorityColor(taskData.priority)}}
                  >
                    {getPriorityLabel(taskData.priority)}
                  </span>
                </div>
                <div>
                  <p className="text-[#8BA3B9] text-sm">Fecha límite</p>
                  <p className="text-white">{formatDateShort(taskData.due_date)} {taskData.due_time?.substring(0, 5)}</p>
                </div>
              </div>

              {taskData.description && (
                <div>
                  <p className="text-[#8BA3B9] text-sm">Descripción</p>
                  <p className="text-white">{taskData.description}</p>
                </div>
              )}

              {taskData.status !== 'completed' && (
                <div className="mt-4 pt-4 border-t border-[#2a3f5a]">
                  <button
                    onClick={handleCompleteTask}
                    disabled={completing}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {completing ? 'Completando...' : '✓ Marcar como completada'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* PROYECTOS */}
          {isProject && projectData && (
            <>
              <div>
                <h3 className="text-[#4CAAF2] text-lg font-semibold">{event.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8BA3B9] text-sm">Estado</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    projectData.status === 'active' ? 'bg-green-500' : 
                    projectData.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}>
                    {projectData.status}
                  </span>
                </div>
                <div>
                  <p className="text-[#8BA3B9] text-sm">Fecha Inicio</p>
                  <p className="text-white">{formatDateShort(projectData.start_date)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[#8BA3B9] text-sm">Fecha Fin</p>
                <p className="text-white">{formatDateShort(projectData.end_date)}</p>
              </div>

              {projectData.description && (
                <div>
                  <p className="text-[#8BA3B9] text-sm">Descripción</p>
                  <p className="text-white">{projectData.description}</p>
                </div>
              )}
            </>
          )}

          {/* EQUIPOS */}
          {!isProject && !isTask && equipmentData && (
            <>
              <div>
                <h3 className="text-[#4CAAF2] text-lg font-semibold">{event.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8BA3B9] text-sm">ID</p>
                  <p className="text-white font-mono">{equipmentData.external_id}</p>
                </div>
                <div>
                  <p className="text-[#8BA3B9] text-sm">Ubicación</p>
                  <p className="text-white">{equipmentData.location || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-[#8BA3B9] text-sm">Última Calibración</p>
                <p className="text-white">{formatDateShort(equipmentData.calibration_date)}</p>
              </div>

              <div>
                <p className="text-[#8BA3B9] text-sm">Vencimiento</p>
                <p className="text-white">{formatDateShort(equipmentData.expiration_date)}</p>
                <span 
                  className="px-2 py-1 rounded text-xs"
                  style={{backgroundColor: getExpirationStatus(equipmentData.expiration_date).color}}
                >
                  {getExpirationStatus(equipmentData.expiration_date).text}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8BA3B9] text-sm">Estado</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    equipmentData.status === 'calibrated' ? 'bg-green-500' : 
                    equipmentData.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {equipmentData.status}
                  </span>
                </div>
                <div>
                  <p className="text-[#8BA3B9] text-sm">Norma</p>
                  <p className="text-white">{equipmentData.norm || '-'}</p>
                </div>
              </div>

              {equipmentData.notes && (
                <div>
                  <p className="text-[#8BA3B9] text-sm">Notas</p>
                  <p className="text-white text-sm">{equipmentData.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de pie */}
        <div className="mt-6 pt-4 border-t border-[#2a3f5a]">
          {isTask && taskData && !isEditing && (
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-[#4CAAF2] text-white py-2 rounded-lg hover:bg-[#3a8ecc]"
              >
                ✏️ Editar
              </button>
            </div>
          )}
          <button 
            onClick={onClose}
            className="w-full bg-[#4CAAF2] text-white py-2 rounded-lg hover:bg-[#3a8ecc]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}