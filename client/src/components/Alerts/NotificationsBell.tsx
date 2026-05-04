import {useState, useEffect} from 'react';
import type {Alert, EquipmentEvent} from './alertsUtils';
import {generateAlerts, getAlertLevelColor, getAlertLevelLabel, formatDaysUntil} from './alertsUtils';
import {API_URL} from '../../config';

interface NotificationsBellProps {
  onNavigate?: (path: string) => void;
}

export default function NotificationsBell({onNavigate}: NotificationsBellProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/equipment`);
      const equipment: EquipmentEvent[] = await res.json();
      const generatedAlerts = generateAlerts(equipment);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = alerts.filter(a => a.alertLevel === 'critical').length;
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;
  const totalCount = alerts.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#8BA3B9] hover:text-white transition-colors"
        title="Notificaciones"
      >
        <span className="text-2xl">🔔</span>
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#F87171] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A2D44] rounded-xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2a3f5a]">
              <h3 className="font-bold text-white">Alertas de Calibración</h3>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F87171]"></span>
                  {criticalCount} Crítico
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FBBF24]"></span>
                  {warningCount} Advertencia
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-[#8BA3B9] text-center">Cargando...</div>
              ) : alerts.length === 0 ? (
                <div className="p-4 text-[#8BA3B9] text-center">
                  ✓ No hay alertas pendientes
                </div>
              ) : (
                <div className="divide-y divide-[#2a3f5a]">
                  {alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className="p-3 hover:bg-[#2a3f5a] cursor-pointer transition-colors"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate?.('/equipment');
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {alert.externalId}
                          </p>
                          <p className="text-[#8BA3B9] text-xs truncate">
                            {alert.description}
                          </p>
                          <p className="text-[#8BA3B9] text-xs mt-1">
                            {alert.location}
                          </p>
                        </div>
                        <span 
                          className="px-2 py-1 rounded text-xs text-white whitespace-nowrap ml-2"
                          style={{backgroundColor: getAlertLevelColor(alert.alertLevel)}}
                        >
                          {getAlertLevelLabel(alert.alertLevel)}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{color: getAlertLevelColor(alert.alertLevel)}}>
                        {formatDaysUntil(alert.daysUntilExpiration)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#2a3f5a]">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.('/equipment');
                }}
                className="w-full text-center text-[#4CAAF2] text-sm hover:underline"
              >
                Ver todos los equipos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}