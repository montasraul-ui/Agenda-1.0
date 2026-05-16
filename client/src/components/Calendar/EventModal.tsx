import {useEffect, useState} from 'react';
import type {CalendarEvent, EquipmentEvent, ProjectEvent, TaskEvent} from './calendarUtils';
import {formatDateShort, getExpirationStatus} from './calendarUtils';
import {API_URL} from '../../config';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onTaskCompleted?: () => void;
}

export default function EventModal({event, onClose, onTaskCompleted}: EventModalProps) {
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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
            {isProject ? 'Proyecto' : 'Equipo de Calibración'}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#8BA3B9] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <h3 className="text-[#4CAAF2] text-lg font-semibold">{event.title}</h3>
          </div>

          {isProject && projectData && (
            <>
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

          {!isProject && !isTask && equipmentData && (
            <>
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

          {isTask && taskData && (
            <>
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
                  <p className="text-white">{formatDateShort(taskData.due_date)}</p>
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
        </div>

        <div className="mt-6 pt-4 border-t border-[#2a3f5a]">
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