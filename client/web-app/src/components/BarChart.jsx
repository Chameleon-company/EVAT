import React from 'react';
import { Bar } from 'react-chartjs-2';
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
    const options = {
            responsive: true,
            aspectRatio: 0.75,
            plugins: {
              legend: { display: false },
              title: { display: true, text: props.title, color: "#334155", font: {
                size: 16
              } },
            },
            scales: {
              x: {
                ticks: {
                  color: "#334155"
                },
                grid: {
                  color: "#e2e8f0"
                }
              },
              y: {
                ticks: {
                  color: "#334155"
                },
                grid: {
                  color: "#e2e8f0"
                }
              }
            }
    };

    return (<Bar data={props.data} options={options} role="img" aria-label={props.title}/>);
};

export default BarChart;
