import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const dataByYear = {
  2022: [
    { name: 'Janeiro', valor: 2400, amt: 2400 },
    { name: 'Fevereiro', valor: 1398, amt: 2210 },
    { name: 'Março', valor: 9800, amt: 2290 },
    { name: 'Abril', valor: 3908, amt: 2000 },
    { name: 'Maio', valor: 4800, amt: 2181 },
    { name: 'Junho', valor: 3800, amt: 2500 },
    { name: 'Julho', valor: 4300, amt: 2100 },
    { name: 'Agosto', valor: 4300, amt: 2100 },
    { name: 'Setembro', valor: 4300, amt: 2100 },
    { name: 'Outubro', valor: 9110, amt: 2100 },
    { name: 'Novembro', valor: 4300, amt: 2100 },
    { name: 'Dezembro', valor: 9800, amt: 2100 }
  ],
  2023: [
    { name: 'Janeiro', valor: 3000, amt: 2400 },
    { name: 'Fevereiro', valor: 2000, amt: 2210 },
    { name: 'Março', valor: 9000, amt: 2290 },
    { name: 'Abril', valor: 4000, amt: 2000 },
    { name: 'Maio', valor: 5000, amt: 2181 },
    { name: 'Junho', valor: 3500, amt: 2500 },
    { name: 'Julho', valor: 4500, amt: 2100 },
    { name: 'Agosto', valor: 4500, amt: 2100 },
    { name: 'Setembro', valor: 4500, amt: 2100 },
    { name: 'Outubro', valor: 9200, amt: 2100 },
    { name: 'Novembro', valor: 4500, amt: 2100 },
    { name: 'Dezembro', valor: 0, amt: 2100 }
  ]
};

export default function GraphicBarDesign() {
  const [selectedYear, setSelectedYear] = useState(2023);

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Gastos Totais Mensais</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Selecione o Ano:
          <select value={selectedYear} onChange={handleYearChange} style={{ marginLeft: '10px' }}>
            {Object.keys(dataByYear).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>
      <BarChart
        width={600}
        height={300}
        data={dataByYear[selectedYear]}
        margin={{
          top: 20, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="valor" fill="#8884d8" />
      </BarChart>
    </div>
  );
}