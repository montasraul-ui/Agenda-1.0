import {useMemo, useState} from 'react';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import DetailModal from './DetailModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface ProjectChartProps {
  projects: Project[];
}

export default function ProjectChart({projects}: ProjectChartProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<{id: number; name: string; description: string; date: string; status?: string}[]>([]);

  const {active, completed, onHold} = useMemo(() => {
    const safeProjects = projects || [];
    return {
      active: safeProjects.filter(p => p.status === 'active'),
      completed: safeProjects.filter(p => p.status === 'completed'),
      onHold: safeProjects.filter(p => p.status === 'on_hold'),
    };
  }, [projects]);

  const barData = {
    labels: ['Activos', 'Completados', 'En Pausa'],
    datasets: [{
      label: 'Proyectos',
      data: [active.length, completed.length, onHold.length],
      backgroundColor: ['#4CAAF2', '#4ADE80', '#FBBF24'],
      borderColor: ['#3a8ecc', '#22c55e', '#eab308'],
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {display: false},
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw} proyectos`,
        },
      },
    },
    scales: {
      x: {
        ticks: {color: '#8BA3B9'},
        grid: {display: false},
      },
      y: {
        ticks: {color: '#8BA3B9'},
        grid: {color: '#2a3f5a'},
        beginAtZero: true,
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        let items: Project[] = [];
        let title = '';

        if (idx === 0) { items = active; title = 'Proyectos Activos'; }
        else if (idx === 1) { items = completed; title = 'Proyectos Completados'; }
        else { items = onHold; title = 'Proyectos en Pausa'; }

        setModalItems(items.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          date: p.end_date || p.start_date,
          status: p.status,
        })));
        setModalTitle(title);
        setModalOpen(true);
      }
    },
  };

  return (
    <div className="bg-[#1A2D44] p-4 rounded-xl">
      <h3 className="text-lg font-bold text-[#4ADE80] mb-4">Proyectos</h3>
      <div className="h-48">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="mt-4 flex justify-around text-sm">
        <div className="text-center">
          <span className="block text-[#4CAAF2] font-bold text-lg">{active.length}</span>
          <span className="text-[#8BA3B9]">Activos</span>
        </div>
        <div className="text-center">
          <span className="block text-[#4ADE80] font-bold text-lg">{completed.length}</span>
          <span className="text-[#8BA3B9]">Completados</span>
        </div>
        <div className="text-center">
          <span className="block text-[#FBBF24] font-bold text-lg">{onHold.length}</span>
          <span className="text-[#8BA3B9]">En Pausa</span>
        </div>
      </div>

      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        items={modalItems}
        color="#4ADE80"
      />
    </div>
  );
}