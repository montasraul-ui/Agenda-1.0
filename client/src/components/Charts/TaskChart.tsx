import {useMemo, useState} from 'react';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import DetailModal from './DetailModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}

interface TaskChartProps {
  tasks: Task[];
}

export default function TaskChart({tasks}: TaskChartProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<{id: number; name: string; description: string; date: string; priority?: string}[]>([]);

  const {high, medium, low, completed, pending} = useMemo(() => {
    return {
      high: tasks.filter(t => t.priority === 'high'),
      medium: tasks.filter(t => t.priority === 'medium'),
      low: tasks.filter(t => t.priority === 'low'),
      completed: tasks.filter(t => t.status === 'completed'),
      pending: tasks.filter(t => t.status !== 'completed'),
    };
  }, [tasks]);

  const barData = {
    labels: ['Alta', 'Media', 'Baja', 'Completadas', 'Pendientes'],
    datasets: [{
      label: 'Tareas',
      data: [high.length, medium.length, low.length, completed.length, pending.length],
      backgroundColor: ['#F87171', '#FBBF24', '#4ADE80', '#4ADE80', '#4CAAF2'],
      borderColor: ['#ef4444', '#eab308', '#22c55e', '#22c55e', '#3a8ecc'],
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {display: false},
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw} tareas`,
        },
      },
    },
    scales: {
      x: {
        ticks: {color: '#8BA3B9'},
        grid: {color: '#2a3f5a'},
        beginAtZero: true,
      },
      y: {
        ticks: {color: '#8BA3B9'},
        grid: {display: false},
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        let items: Task[] = [];
        let title = '';

        if (idx === 0) { items = high; title = 'Tareas de Alta Prioridad'; }
        else if (idx === 1) { items = medium; title = 'Tareas de Media Prioridad'; }
        else if (idx === 2) { items = low; title = 'Tareas de Baja Prioridad'; }
        else if (idx === 3) { items = completed; title = 'Tareas Completadas'; }
        else { items = pending; title = 'Tareas Pendientes'; }

        setModalItems(items.map(t => ({
          id: t.id,
          name: t.title,
          description: t.description || '',
          date: t.due_date,
          priority: t.priority,
        })));
        setModalTitle(title);
        setModalOpen(true);
      }
    },
  };

  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  return (
    <div className="bg-[#1A2D44] p-4 rounded-xl">
      <h3 className="text-lg font-bold text-[#F87171] mb-4">Tareas</h3>
      <div className="h-40">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="mt-4 flex justify-around text-sm">
        <div className="text-center">
          <span className="block text-[#F87171] font-bold text-lg">{high.length}</span>
          <span className="text-[#8BA3B9]">Alta</span>
        </div>
        <div className="text-center">
          <span className="block text-[#FBBF24] font-bold text-lg">{medium.length}</span>
          <span className="text-[#8BA3B9]">Media</span>
        </div>
        <div className="text-center">
          <span className="block text-[#4ADE80] font-bold text-lg">{low.length}</span>
          <span className="text-[#8BA3B9]">Baja</span>
        </div>
        <div className="text-center">
          <span className="block text-[#4CAAF2] font-bold text-lg">{completionRate}%</span>
          <span className="text-[#8BA3B9]">Completado</span>
        </div>
      </div>

      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        items={modalItems}
        color="#F87171"
      />
    </div>
  );
}