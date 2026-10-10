import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
ChartJS.defaults.font.family = 'Outfit, sans-serif';
ChartJS.defaults.color = '#6d6458';
ChartJS.defaults.plugins.legend.labels.boxWidth = 12;
