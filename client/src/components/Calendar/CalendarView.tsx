import {useState, useEffect, useCallback} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import type {CalendarEvent, EquipmentEvent, TaskEvent} from './calendarUtils';
import {mergeEvents} from './calendarUtils';
import {API_URL} from '../../config';

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const [equipmentRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/equipment`),
        fetch(`${API_URL}/tasks`),
      ]);
      
      const equipment: EquipmentEvent[] = await equipmentRes.json();
      const tasks: TaskEvent[] = await tasksRes.json();
      
      const mergedEvents = mergeEvents(equipment, tasks);
      setEvents(mergedEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleTaskCompleted = () => {
    loadEvents();
  };

  const renderEventContent = (info: any) => {
    const eventType = info.event.extendedProps.type;
    const data = info.event.extendedProps.data;
    let badgeLabel = 'E';
    let badgeColor = '#F87171';

    if (eventType === 'task') {
      const taskData = data as TaskEvent;
      if (taskData.project_id) {
        badgeLabel = 'P';
        badgeColor = '#4CAAF2';
      } else {
        badgeLabel = 'T';
        badgeColor = '#A78BFA';
      }
    } else if (eventType === 'equipment') {
      const eqData = data as EquipmentEvent;
      const days = Math.ceil((new Date(eqData.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days < 0) badgeColor = '#F87171';
      else if (days <= 30) badgeColor = '#FBBF24';
      else badgeColor = '#4ADE80';
    }

    return (
      <div className="flex items-center gap-1 w-full overflow-hidden">
        <span 
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
          style={{backgroundColor: badgeColor}}
        >
          {badgeLabel}
        </span>
        <span className="truncate text-white text-xs">{info.event.title}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8BA3B9]">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendario</h1>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: '#4CAAF2'}}>P</span>
            <span className="text-[#8BA3B9]">Tarea Proyecto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: '#A78BFA'}}>T</span>
            <span className="text-[#8BA3B9]">Tarea Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: '#4ADE80'}}>E</span>
            <span className="text-[#8BA3B9]">&gt;30 días</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: '#FBBF24'}}>E</span>
            <span className="text-[#8BA3B9]">≤30 días</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: '#F87171'}}>E</span>
            <span className="text-[#8BA3B9]">Vencido</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1A2D44] rounded-xl p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          editable={false}
          selectable={true}
          height="auto"
          eventDisplay="block"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={true}
          dayMaxEvents={3}
          moreLinkClick="popover"
          locale="es"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            prev: 'Anterior',
            next: 'Siguiente',
          }}
          eventClassNames="cursor-pointer hover:opacity-80"
          eventContent={renderEventContent}
        />
      </div>

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={handleCloseModal} onTaskCompleted={handleTaskCompleted} />
      )}
    </div>
  );
}