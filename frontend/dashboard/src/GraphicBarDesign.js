import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function GraphicBarDesign() {
  const [dataByYear, setDataByYear] = useState({});
  const [selectedYear, setSelectedYear] = useState(2023);

  const getDataByYear = (year) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    fetch(`http://localhost:5000/api/fatura/?data_beg=${startDate}&data_end=${endDate}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        const monthlyData = Array(12).fill(0).map((_, index) => ({
          name: new Date(0, index).toLocaleString('default', { month: 'long' }),
          valor: 0
        }));

        data.forEach(expense => {
          const month = new Date(expense.date).getMonth();
          monthlyData[month].valor += expense.value;
        });

        setDataByYear(prevData => ({ ...prevData, [year]: monthlyData }));
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
    getDataByYear(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (e) => {
    const year = Number(e.target.value);
    setSelectedYear(year);
    if (!dataByYear[year]) {
      getDataByYear(year);
    }
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
      {dataByYear[selectedYear] && (
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
      )}
    </div>
  );
}