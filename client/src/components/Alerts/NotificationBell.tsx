import {useState, useEffect, useRef} from 'react';
import {API_URL} from '../../config';

interface Equipment {
  id: number;
  external_id: string;
  description: string;
  expiration_date: string;
}

interface Task {
  id: number;
  title: string;
  due_date: string;
  priority: string;
  status: string;
  project_id: number;
}

interface AlertItem {
  type: string;
  category: 'equipment' | 'task';
  label: string;
  icon: string;
  color: string;
  items: (Equipment | Task)[];
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const [equipmentRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/equipment/alerts`),
        fetch(`${API_URL}/tasks`)
      ]);

      const equipmentData = await equipmentRes.json();
      const tasksData: Task[] = await tasksRes.json();

      const newAlerts: AlertItem[] = [];

      // Equipos Vencidos
      if (equipmentData.expiredCount > 0) {
        newAlerts.push({
          type: 'expired',
          category: 'equipment',
          label: 'Equipos Vencidos',
          icon: '🔴',
          color: 'text-red-400',
          items: equipmentData.expired
        });
      }

      // Equipos por Vencer (30 días)
      if (equipmentData.upcomingCount > 0) {
        newAlerts.push({
          type: 'upcoming',
          category: 'equipment',
          label: 'Por Vencer (30 días)',
          icon: '🟡',
          color: 'text-yellow-400',
          items: equipmentData.upcoming
        });
      }

      // Tareas atrasadas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdueTasks = tasksData.filter((t: Task) => {
        if (t.status === 'completed' || !t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      if (overdueTasks.length > 0) {
        newAlerts.push({
          type: 'tasks_overdue',
          category: 'task',
          label: 'Tareas Atrasadas',
          icon: '⚠️',
          color: 'text-red-400',
          items: overdueTasks
        });
      }

      // Tareas esta semana (próximos 7 días)
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const weekTasks = tasksData.filter((t: Task) => {
        if (t.status === 'completed' || !t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      });

      if (weekTasks.length > 0) {
        newAlerts.push({
          type: 'tasks_week',
          category: 'task',
          label: 'Tareas Esta Semana',
          icon: '📋',
          color: 'text-blue-400',
          items: weekTasks
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const totalCategories = alerts.length;

  const toggleCategory = (type: string) => {
    setExpandedCategory(expandedCategory === type ? null : type);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#2a3f5a] transition-colors"
        title="Notificaciones"
      >
        <span className="text-xl">🔔</span>
        {totalCategories > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#F87171] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {totalCategories}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-[#1A2D44] rounded-xl shadow-lg border border-[#2a3f5a] z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-[#2a3f5a] flex justify-between items-center">
            <span className="font-bold text-white">Alarmas</span>
            <button
              onClick={fetchAlerts}
              className="text-[#4CAAF2] text-sm hover:underline"
            >
              Actualizar
            </button>
          </div>

          <div className="overflow-y-auto max-h-80">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-[#8BA3B9]">
                Sin alarmas
              </div>
            ) : (
              <div>
                {alerts.map((category) => (
                  <div key={category.type} className="border-b border-[#2a3f5a]">
                    <button
                      onClick={() => toggleCategory(category.type)}
                      className="w-full p-3 flex items-center justify-between hover:bg-[#2a3f5a] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className={`font-medium ${category.color}`}>
                          {category.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#0F1C2E] px-2 py-1 rounded text-sm text-[#8BA3B9]">
                          {category.items.length}
                        </span>
                        <span className="text-[#8BA3B9]">
                          {expandedCategory === category.type ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {expandedCategory === category.type && (
                      <div className="bg-[#0F1C2E] p-2 space-y-1">
                        {category.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="p-2 rounded bg-[#1A2D44] flex justify-between items-center text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-white">
                                {category.category === 'equipment' 
                                  ? (item as Equipment).external_id 
                                  : (item as Task).title}
                              </span>
                              <span className="text-[#8BA3B9] ml-2 text-xs truncate">
                                {category.category === 'equipment' 
                                  ? (item as Equipment).description.substring(0, 15)
                                  : (item as Task).priority}
                              </span>
                            </div>
                            <span className={`ml-2 ${category.color}`}>
                              {formatDate(category.category === 'equipment' 
                                ? (item as Equipment).expiration_date 
                                : (item as Task).due_date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}