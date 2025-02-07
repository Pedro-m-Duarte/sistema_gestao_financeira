import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import ExpenseLists from './ExpenseLists';

export default function GraphicPieDesign() {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getTotalValueByCategory = (startDate, endDate) => {
    fetch(`http://localhost:5000/api/fatura/getTotalAmountByCartegory?data_inicio=${startDate}&data_fim=${endDate}`)
      .then(response => response.json())
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
    getTotalValueByCategory(startDate, endDate);
  }, [startDate, endDate]);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    if (endDate && e.target.value >= endDate) {
      setError('A data de início deve ser menor que a data de fim.');
    } else {
      setError('');
    }
  };

  const handleEndDateChange = (e) => {
    if (startDate && e.target.value <= startDate) {
      setError('A data de fim deve ser maior que a data de início.');
    } else {
      setError('');
      setEndDate(e.target.value);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Escolha o intervalo de datas</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Data de início:
          <input type="date" value={startDate} onChange={handleStartDateChange} />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Data de fim:
          <input type="date" value={endDate} onChange={handleEndDateChange} />
        </label>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PieChart width={400} height={400}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total_valor"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend formatter={(value, entry) => `${entry.payload.categoria}: R$ ${entry.payload.total_valor}`} /> {/* Modifique esta linha */}
        </PieChart>
      </div>
      <ExpenseLists startDate={startDate} endDate={endDate} />
    </div>
  );
}