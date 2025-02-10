import React, { useState, useEffect } from 'react';

export default function ExpenseLists({ startDate, endDate }) {
  const [expenses, setExpenses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const getListByDate = (startDate, endDate) => {
    fetch(`http://localhost:5000/api/fatura/?data_beg=${startDate}&data_end=${endDate}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        setExpenses(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
    if (startDate && endDate) {
      getListByDate(startDate, endDate);
    }
  }, [startDate, endDate]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/fatura/${id}`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao excluir a fatura');
      }
      // Remove o item do estado apenas se a exclusão for bem-sucedida
      setExpenses(expenses.filter(expense => expense.id !== id));
    })
    .catch(error => {
      console.error('Erro ao excluir:', error);
    });
  };
  
  const formatData = (data) => {
    const date = new Date(data);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  // Ordena a lista de gastos por data
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <h2>Lista de Gastos</h2>
      <button onClick={handleEditClick}>
        {isEditing ? 'Cancelar' : 'Editar'}
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>Nome</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Descrição</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Valor</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Categoria</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Data</th>
            {isEditing && <th style={{ border: '1px solid black', padding: '8px' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {sortedExpenses.map((expense, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.nome}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.descricao}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.valor}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.categoria}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{formatData(expense.data)}</td>
              {isEditing && (
                <td style={{ border: '1px solid black', padding: '8px' }}>
                <button onClick={() => handleDelete(expense.id)}>Excluir</button>
              </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}