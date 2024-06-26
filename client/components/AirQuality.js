import React, { useEffect, useState } from 'react';
import Draggable from './Draggable';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AirQuality() {
    const [airQualityData, setAirQualityData] = useState(null);
    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartOrder, setChartOrder] = useState([0, 1, 2, 3]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);

    const onDragStart = (index) => {
        setDraggedIndex(index);
    };

    const onDragEnd = () => {
        setDraggedIndex(null);
        setDropIndex(null);
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        setDropIndex(index);
    };

    const onDrop = () => {
        const newOrder = [...chartOrder];
        newOrder.splice(dropIndex, 0, newOrder.splice(draggedIndex, 1)[0]);
        setChartOrder(newOrder);
    };
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/latest-air-quality/');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                if (typeof data !== 'object' || data === null) {
                    throw new Error('Data is not a valid JSON object');
                }
        
                const dataArray = Array.isArray(data) ? data : Object.values(data);

                const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
                const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    
                const co2Values = data.map(item => item.co2);
                const pm25 = data.map(item => item.pm25)
                const temperature = data.map(item => item.temp)
                const humid = data.map(item => item.humid)

                const time = dataArray.map(item => {
                    const date = new Date(item.timestamp);
                    return date.toLocaleTimeString([], timeOptions); 
                });
                const dateLabel = dataArray.map(item => {
                    return new Date(item.timestamp).toLocaleDateString([], dateOptions);
                });
    
                setAirQualityData(data);
                setChartData({
                    labels: Object.keys(data), 
                    datasets: [
                        {
                            label: `CO2 level - ${co2Values[co2Values.length - 1]} ppm`,
                            data: co2Values, 
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        },
                        {
                            label: `Temperature level - ${temperature[temperature.length - 1]}°C`,
                            data: temperature, 
                            borderColor: 'rgb(192, 75, 192)',
                            tension: 0.1
                        },
                        {
                            label: `PM2.5 level - ${pm25[pm25.length - 1]} ug/m³`,
                            data: pm25, 
                            borderColor: 'rgb(192, 192, 75)',
                            tension: 0.1
                        },
                        {
                            label: `Humidity level - ${humid[humid.length - 1]}%`,
                            data: humid, 
                            borderColor: 'rgb(192, 75, 75)',
                            tension: 0.1
                        }
                    ]
                });
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };
    
        fetchData();
        const intervalId = setInterval(fetchData, 10000);

        return () => clearInterval(intervalId);
    }, []);
    

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    

    return (
        <div className="chart-container">
            <h1>Air Quality Data</h1>
            {chartOrder.map((chartIndex, index) => (
                <div
                    key={chartIndex}
                    className="chart"
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={onDrop}
                >
                    <Draggable
                        index={index}
                        onDragStart={() => onDragStart(index)}
                        onDragEnd={onDragEnd}
                    >
                        <Line
                            data={{
                                labels: chartData.labels,
                                datasets: [chartData.datasets[chartIndex]]
                            }}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true, 
                                height: 400, 
                            }}
                        />
                    </Draggable>
                </div>
            ))}
        </div>
    );
    
}

export default AirQuality;
