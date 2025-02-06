import React, { useState, useEffect } from 'react';

const expensesData = [
  { name: 'Compra de supermercado', description: 'Compra mensal de alimentos', value: 200, category: 'Alimentação', date: '2025-02-01' },
  { name: 'Aluguel', description: 'Pagamento do aluguel', value: 800, category: 'Casa', date: '2025-02-05' },
  { name: 'Mensalidade faculdade', description: 'Pagamento da mensalidade', value: 500, category: 'Educação', date: '2025-02-10' },
  { name: 'Cinema', description: 'Ida ao cinema', value: 50, category: 'Lazer', date: '2025-02-15' },
];

export default function ExpenseLists({ startDate, endDate }) {
  const [expenses, setExpenses] = useState(expensesData);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      const filteredExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
      });
      setExpenses(filteredExpenses);
    } else {
      setExpenses(expensesData);
    }
  }, [startDate, endDate]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = (index) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(newExpenses);
  };

  // Ordena a lista de gastos por data
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <h2>Lista de Gastos</h2>
      <button onClick={handleEditClick}>
        {isEditing ? 'Ok' : 'Editar'}
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
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.name}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.description}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.value}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.category}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{expense.date}</td>
              {isEditing && (
                <td style={{ border: '1px solid black', padding: '8px' }}>
                  <button onClick={() => handleDelete(index)}>Excluir</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}