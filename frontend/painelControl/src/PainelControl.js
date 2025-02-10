import React, { useState } from 'react';

export default function PainelControl() {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    categoria: '',
    data: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevState => {
        const updatedData = { ...prevState, 
          [name]: name === 'valor' ? Number(value) : value // Converte `valor` para número
        };
        console.log("Novo estado atualizado:", updatedData);
        return updatedData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Pegando os dados mais recentes do estado
    const newFormData = { ...formData };

    console.log('Dados a serem enviados:', newFormData);

    fetch('http://localhost:5000/api/fatura/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify(newFormData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        // Limpa o formulário após o envio bem-sucedido
        setFormData({
            nome: '',
            descricao: '',
            valor: '',
            categoria: '',
            data: ''
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#013024' }}>Adicione seus gastos</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nome:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Descrição:</label>
          <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Categoria:</label>
          <select name="categoria" value={formData.categoria} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Selecione uma categoria</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte">Transporte</option>
            <option value="Faculdade">Faculdade</option>
            <option value="Saúde">Saúde</option>
            <option value="Lazer">Lazer</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Valor Gasto:</label>
          <input type="number" name="valor" value={formData.valor} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Data:</label>
          <input type="date" name="data" value={formData.data} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#013024', color: 'white', fontSize: '16px' }}>Inserir Dados</button>
      </form>
    </div>
  );
}