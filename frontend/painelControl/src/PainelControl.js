import React, { useState } from 'react';

export default function PainelControl() {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: 0,
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
            valor: 0,
            categoria: '',
            data: ''
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
};


  return (
    <div>
      <h1>Painel de Controle Financeiro</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} />
        </div>
        <div>
          <label>Descrição:</label>
          <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} />
        </div>
        <div>
          <label>Categoria:</label>
          <select name="categoria" value={formData.categoria} onChange={handleChange}>
            <option value="">Selecione uma categoria</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte">Transporte</option>
            <option value="Faculdade">Faculdade</option>
            <option value="Saúde">Saúde</option>
            <option value="Lazer">Lazer</option>
          </select>
        </div>
        <div>
          <label>Valor Gasto:</label>
          <input type="number" name="valor" value={formData.valor} onChange={handleChange} />
        </div>
        <div>
          <label>Data:</label>
          <input type="date" name="data" value={formData.data} onChange={handleChange} />
        </div>
        <button type="submit">Inserir Dados</button>
      </form>
    </div>
  );
}