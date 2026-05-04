import {useEffect, useRef} from 'react';

interface DetailItem {
  id: number;
  name: string;
  description: string;
  date: string;
  status?: string;
  priority?: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: DetailItem[];
  color?: string;
}

export default function DetailModal({isOpen, onClose, title, items, color = '#4CAAF2'}: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-[#1A2D44] rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-[#2a3f5a] pb-3">
          <h2 className="text-xl font-bold" style={{color}}>{title}</h2>
          <button
            onClick={onClose}
            className="text-[#8BA3B9] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <p className="text-[#8BA3B9] text-center py-8">No hay elementos</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0F1C2E] p-3 rounded-lg flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{item.name}</span>
                      {item.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      )}
                      {item.status && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'active' ? 'bg-blue-500' :
                          item.status === 'on_hold' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}>
                          {item.status === 'completed' ? 'Completado' : 
                           item.status === 'active' ? 'Activo' : 
                           item.status === 'on_hold' ? 'Pausa' : item.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[#8BA3B9] text-sm block truncate">
                      {item.description}
                    </span>
                  </div>
                  <span className="text-[#8BA3B9] text-sm ml-4 whitespace-nowrap">
                    {formatDate(item.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#2a3f5a] text-center">
          <span className="text-[#8BA3B9] text-sm">Total: {items.length} elementos</span>
        </div>
      </div>
    </div>
  );
}