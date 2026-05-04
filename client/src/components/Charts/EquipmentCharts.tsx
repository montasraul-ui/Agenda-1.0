import {useMemo, useState} from 'react';
import {Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement} from 'chart.js';
import {Doughnut, Bar} from 'react-chartjs-2';
import DetailModal from './DetailModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Equipment {
  id: number;
  external_id: string;
  description: string;
  expiration_date: string;
  status: string;
}

interface EquipmentChartsProps {
  equipment: Equipment[];
}

export default function EquipmentCharts({equipment}: EquipmentChartsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<{id: number; name: string; description: string; date: string; status?: string}[]>([]);
  const [modalColor, setModalColor] = useState('#4CAAF2');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    const expDate = new Date(dateStr);
    expDate.setHours(0, 0, 0, 0);
    return expDate < now;
  };

  const {calibrated, expired, pending} = useMemo(() => {
    const calibrated: Equipment[] = [];
    const expired: Equipment[] = [];
    const pending: Equipment[] = [];

    equipment.forEach(e => {
      if (e.status === 'out_of_service' || isExpired(e.expiration_date)) {
        expired.push(e);
      } else if (e.status === 'calibrated' || (!e.status && e.expiration_date)) {
        calibrated.push(e);
      } else {
        pending.push(e);
      }
    });

    return {calibrated, expired, pending};
  }, [equipment]);

  const donutData = {
    labels: ['Calibrados', 'Vencidos', 'Pendientes'],
    datasets: [{
      data: [calibrated.length, expired.length, pending.length],
      backgroundColor: ['#4ADE80', '#F87171', '#FBBF24'],
      borderColor: ['#22c55e', '#ef4444', '#eab308'],
      borderWidth: 2,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#8BA3B9',
          padding: 15,
          font: {size: 12},
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        let items: Equipment[] = [];
        let title = '';
        let color = '#4CAAF2';

        if (idx === 0) { items = calibrated; title = 'Equipos Calibrados'; color = '#4ADE80'; }
        else if (idx === 1) { items = expired; title = 'Equipos Vencidos'; color = '#F87171'; }
        else { items = pending; title = 'Equipos Pendientes'; color = '#FBBF24'; }

        setModalItems(items.map(e => ({id: e.id, name: e.external_id, description: e.description, date: e.expiration_date, status: e.status})));
        setModalTitle(title);
        setModalColor(color);
        setModalOpen(true);
      }
    },
  };

  const monthlyData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = now.getFullYear();
    const counts = new Array(12).fill(0);

    equipment.forEach(e => {
      if (!e.expiration_date) return;
      const expDate = new Date(e.expiration_date);
      if (expDate.getFullYear() === currentYear) {
        const month = expDate.getMonth();
        if (month >= 0 && month < 12) {
          counts[month]++;
        }
      }
    });

    return {months, counts};
  }, [equipment]);

  const barData = {
    labels: monthlyData.months,
    datasets: [{
      label: 'Equipos por vencer',
      data: monthlyData.counts,
      backgroundColor: '#4CAAF2',
      borderColor: '#3a8ecc',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {display: false},
    },
    scales: {
      x: {
        ticks: {color: '#8BA3B9'},
        grid: {color: '#2a3f5a'},
      },
      y: {
        ticks: {color: '#8BA3B9'},
        grid: {color: '#2a3f5a'},
        beginAtZero: true,
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const monthIdx = elements[0].index;
        const currentYear = now.getFullYear();
        
        const items = equipment.filter(e => {
          if (!e.expiration_date) return false;
          const d = new Date(e.expiration_date);
          return d.getFullYear() === currentYear && d.getMonth() === monthIdx;
        });

        setModalItems(items.map(e => ({id: e.id, name: e.external_id, description: e.description, date: e.expiration_date})));
        setModalTitle(`Equipos - ${monthlyData.months[monthIdx]} ${currentYear}`);
        setModalColor('#4CAAF2');
        setModalOpen(true);
      }
    },
  };

  return (
    <div className="bg-[#1A2D44] p-4 rounded-xl">
      <h3 className="text-lg font-bold text-[#4CAAF2] mb-4">Equipos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <h4 className="text-sm text-[#8BA3B9] mb-2 text-center">Por Estado</h4>
          <div className="h-48">
            <Doughnut data={donutData} options={donutOptions} />
          </div>
          <div className="text-center mt-2 text-[#8BA3B9] text-sm">
            Total: {equipment.length}
          </div>
        </div>
        <div>
          <h4 className="text-sm text-[#8BA3B9] mb-2 text-center">Vencimientos {now.getFullYear()}</h4>
          <div className="h-48">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        items={modalItems}
        color={modalColor}
      />
    </div>
  );
}