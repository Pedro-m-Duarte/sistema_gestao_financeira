import React, { useState } from 'react';

export default function PainelControl() {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    valor: '',
    data: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dados inseridos:', formData);
    // Aqui você pode adicionar a lógica para enviar os dados para o backend
  };

  console.log('Rendering PainelControl component');

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