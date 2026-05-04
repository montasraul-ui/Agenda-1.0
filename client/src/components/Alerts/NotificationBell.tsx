import {useState, useEffect, useRef} from 'react';
import {API_URL} from '../../config';

interface Equipment {
  id: number;
  external_id: string;
  description: string;
  expiration_date: string;
}

interface AlertsByCategory {
  type: 'expired' | 'upcoming' | 'calibrating';
  label: string;
  icon: string;
  color: string;
  equipment: Equipment[];
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertsByCategory[]>([]);
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
      const res = await fetch(`${API_URL}/equipment/alerts`);
      const data = await res.json();

      const categories: AlertsByCategory[] = [];

      if (data.expiredCount > 0) {
        categories.push({
          type: 'expired',
          label: 'Equipos Vencidos',
          icon: '🔴',
          color: 'text-red-400',
          equipment: data.expired
        });
      }

      if (data.upcomingCount > 0) {
        categories.push({
          type: 'upcoming',
          label: 'Por Vencer (30 días)',
          icon: '🟡',
          color: 'text-yellow-400',
          equipment: data.upcoming
        });
      }

      setAlerts(categories);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const totalCategories = alerts.length;

  const toggleCategory = (type: string) => {
    setExpandedCategory(expandedCategory === type ? null : type);
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
                          {category.equipment.length}
                        </span>
                        <span className="text-[#8BA3B9]">
                          {expandedCategory === category.type ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {expandedCategory === category.type && (
                      <div className="bg-[#0F1C2E] p-2 space-y-1">
                        {category.equipment.map((eq) => (
                          <div
                            key={eq.id}
                            className="p-2 rounded bg-[#1A2D44] flex justify-between items-center text-sm"
                          >
                            <div>
                              <span className="font-medium text-white">{eq.external_id}</span>
                              <span className="text-[#8BA3B9] ml-2 text-xs">
                                {eq.description.substring(0, 20)}
                                {eq.description.length > 20 ? '...' : ''}
                              </span>
                            </div>
                            <span className={category.type === 'expired' ? 'text-red-400' : 'text-yellow-400'}>
                              {eq.expiration_date}
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