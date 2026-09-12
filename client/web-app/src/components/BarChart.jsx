import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = (props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = isDark ? {
    ...props.data,
    datasets: props.data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: [
        'rgba(179, 91, 55, 0.8)',
        'rgba(11, 107, 70, 0.8)',
        'rgba(156, 163, 175, 0.8)',
      ],
      borderColor: '#374151',
    })),
  } : props.data;
    const options = {
            responsive: true,
            aspectRatio: 0.75,
            plugins: {
              legend: { display: false },
              title: { display: true, text: props.title, color: isDark ? "#f3f4f6" : "#334155", font: {
                size: 16
              } },
            },
            scales: {
              x: {
                ticks: {
                  color: isDark ? "#9ca3af" : "#334155"
                },
                grid: {
                  color: isDark ? "#1f2937" : "#e2e8f0"
                }
              },
              y: {
                ticks: {
                  color: isDark ? "#9ca3af" : "#334155"
                },
                grid: {
                  color: isDark ? "#1f2937" : "#e2e8f0"
                }
              }
            }
    };

    return (<Bar data={chartData} options={options} role="img" aria-label={props.title}/>);
};

export default BarChart;
