import type {TaskEvent} from '../Calendar/calendarUtils';

interface KanbanCardProps {
  task: TaskEvent;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
}

export default function KanbanCard({task, onClick, onDragStart}: KanbanCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const dueTime = task.due_time ? task.due_time.substring(0, 5) : '';
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F87171';
      case 'medium': return '#FBBF24';
      case 'low': return '#4ADE80';
      default: return '#A78BFA';
    }
  };

  const projectColor = task.project_color || '#A78BFA';
  const isProjectTask = task.project_id !== null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id.toString());
        onDragStart(e, task.id);
      }}
      onClick={onClick}
      className={`bg-[#0F1C2E] p-3 rounded-lg cursor-move hover:bg-[#152538] transition-colors border-l-4 ${
        isOverdue ? 'border-red-500' : 'border-transparent'
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        {isOverdue && <span className="text-yellow-500 text-sm">⚠️</span>}
        <div 
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{backgroundColor: isProjectTask ? projectColor : '#A78BFA'}}
        >
          {isProjectTask ? 'P' : 'T'}
        </div>
        <span className="text-white text-sm font-medium truncate">{task.title}</span>
      </div>
      
      <div className="text-[#8BA3B9] text-xs">
        {task.project_name && <span>{task.project_name}</span>}
      </div>
      
      <div className="flex items-center gap-2 mt-2 text-xs">
        <span className={isOverdue ? 'text-red-400' : 'text-white'}>
          {formatDate(task.due_date)} {dueTime && ` ${dueTime}`}
        </span>
        <span 
          className="px-1.5 py-0.5 rounded text-white"
          style={{backgroundColor: getPriorityColor(task.priority)}}
        >
          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
        </span>
      </div>
    </div>
  );
}