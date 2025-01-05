import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Form, Button, Table, Row, Col, Modal } from 'react-bootstrap';
import { backendUrl, zabbixApiUrl } from '../../App';
import axios from 'axios';
import GraphicDesign from './GraphicDesign';
import withReactContent from 'sweetalert2-react-content';
import ReactDOM from 'react-dom';
import { Layout, Graphic, TemplateOrServer, Item, GraphicFormProps, SavedLayouts } from './interfaces';
import '../../css/Templates.css';

const GraphicForm: React.FC<GraphicFormProps> = ({ serverId, serverName, isAdmPage, onSubmit }) => {
  const [showDashGraphics, setShowDashGraphics] = useState(true);
  const [selectedGraphic, setSelectedGraphic] = useState<Graphic | null>(null);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateOrServer[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayouts[]>([]);
  const [showGraphicPreview, setShowGraphicPreview] = useState(false);

  const MySwal = withReactContent(Swal);

  const [newGraphic, setNewGraphic] = useState<Graphic>({
    id: 1,
    name: '',
    items: [],
    width: 300,
    height: 300,
    chartType: 'lineChart',
  });

  const [newLayout, setNewLayout] = useState<Layout>({
    id: 1,
    layoutName: '',
    graphics: [],
    templateOrServer: { templateId: '', name: '' }
  });

  const [newItem, setNewItem] = useState<Item>({
    id: 1,
    name: '',
    itemId: '',
    key: '',
    colorLine: '#212121',
    isDicoveryItem: false,
  });

  const handleSubmitGraphic = async (event: FormEvent) => {
    event.preventDefault();
    setNewLayout((prev) => ({
      ...prev,
      graphics: [...prev.graphics, { ...newGraphic, id: prev.graphics.length + 1 }],
    }));
    setNewGraphic((prev) => ({
      ...prev,
      id: prev.id + 1,
      name: '',
      width: 300,
      height: 300,
      chartType: 'lineChart',
      items: [],
    }));
    setNewItem({
      id: 1,
      name: '',
      itemId: '',
      key: '',
      colorLine: '#212121',
      isDicoveryItem: false
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setNewGraphic((prev) => ({
        ...prev,
        [name]: isChecked,
      }));
    } else {
      setNewGraphic((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleChangeSelectedTemplate = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = availableTemplates.find(template => template.templateId === e.target.value);
    if (selectedTemplate) {
      setNewLayout((prev) => ({
        ...prev,
        templateOrServer: { ...selectedTemplate },
      }));
      getItens(selectedTemplate.templateId);
      newGraphic.items = [];
    }
  }

  const handleItemChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedItem = availableItems.find(item => item.itemId === e.target.value);
    if (selectedItem) {
      setNewItem(selectedItem);
    }
  };

  const handleItemColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItem((prev) => ({ ...prev, colorLine: e.target.value }));
  };

  const handleAddItem = () => {
    if (selectedGraphic) {
      setSelectedGraphic(
        (prev) => ({
          ...prev!,
          items: [...prev!.items, { ...newItem, id: prev!.items.length + 1 }],
        }));
    } else {
      setNewGraphic((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem, id: prev.items.length + 1 }],
      }));
    }

    setNewItem({
      id: newItem.id + 1,
      name: availableItems[0].name,
      itemId: availableItems[0].itemId,
      key: availableItems[0].key,
      colorLine: '#212121',
      isDicoveryItem: false
    });
  };

  const handlePreviewGraphic = async (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isAdmPage) {
      await MySwal.fire({
        title: 'MOSTRAR GRÁFICO',
        html: '<div id="graphic-container"></div>',
        showConfirmButton: true,
        confirmButtonText: 'OK',
        didOpen: () => {
          const container = document.getElementById('graphic-container');
          ReactDOM.render(<GraphicDesign graphic={newGraphic} templateOrServerId={newLayout.templateOrServer.templateId} />, container);
        },
        willClose: () => {
          const container = document.getElementById('graphic-container');
          if (container) {
            ReactDOM.unmountComponentAtNode(container);
          }
        }
      });
    } else {
      setShowGraphicPreview(true);
    }
  };

  const closeGraphicPreview = () => {
    setShowGraphicPreview(false);
  };

  const handleRemoveGraphic = (id: number) => {
    const updatedGraphics = newLayout.graphics.filter((graphic) => graphic.id !== id);
    setNewLayout((prev) => ({
      ...prev,
      graphics: updatedGraphics,
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    if (selectedGraphic) {
      setSelectedGraphic((prev) => ({
        ...prev!,
        items: prev!.items.filter((item) => item.id !== itemId),
      }));
    } else {
      setNewGraphic((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    }

    setNewItem({
      id: newItem.id + 1,
      name: availableItems[0].name,
      itemId: availableItems[0].itemId,
      key: availableItems[0].key,
      colorLine: '#212121',
      isDicoveryItem: false      
    })
  };

  const handleDeleteLayout = async (layoutId: number) => {
    try {
      const response = await axios.post(`${backendUrl}/graphicLayouts/deleteLayout`, {
        layoutId: layoutId
      });

      // if(response.data?.length > 0) {
      setSavedLayouts(response.data)
      // }

    } catch (error) {
      console.error('Erro ao deletar Layout:', error);
    }
  };

  const handleChangeShowDashGraphics = () => {
    setShowDashGraphics(true);
    setNewLayout({
      id: 1,
      layoutName: '',
      graphics: [],
      templateOrServer: { templateId: '', name: '' }
    });
    setNewGraphic((prev) => ({
      ...prev,
      id: prev.id + 1,
      name: '',
      chartType: 'lineChart',
      width: 300,
      height: 300,
      items: [],
    }));
    setNewItem({
      id: 1,
      name: '',
      itemId: '',
      key: '',
      colorLine: '#212121',
      isDicoveryItem: false
    });
  };

  const handleSaveLayout = async () => {
    try {
      console.log("graphics", newLayout.graphics)
      const response = await axios.post(`${backendUrl}/graphicLayouts/createLayout`, {
        templateOrServerId: isAdmPage ? newLayout.templateOrServer.templateId : serverId,
        layoutName: newLayout.layoutName,
        graphics: newLayout.graphics,
        templateOrServerName: isAdmPage ? newLayout.templateOrServer.name : serverName,
        createdByAdminPage: isAdmPage,
        isServer: !isAdmPage //Se nao for criado na tela do admin significa que é um servidor
      });

      // console.log('Layout salvo:', response.data);
      setSavedLayouts([...savedLayouts,{ 
        serverName: isAdmPage ? newLayout.templateOrServer.name : serverName,
        layoutId: response.data.layout.id,
        layoutName: response.data.layout.layoutName,
      }]);
      setNewLayout({
        id: 1,
        layoutName: '',
        graphics: [],
        templateOrServer: { templateId: '', name: '' }
      });
      setShowDashGraphics(true);
    } catch (error) {
      console.error('Erro ao salvar o layout:', error);
    }
  };

  const handleGetSavedLayouts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/graphicLayouts/getAllLayouts`, {
      });

      // console.log('Layout salvo:', response.data);
      if (response.data?.length > 0) {

        setSavedLayouts(response.data)
      }

      setShowDashGraphics(true);
    } catch (error) {
      console.error('Erro ao salvar o layout:', error);
    }
  }

  useEffect(() => {
    handleGetSavedLayouts();
  }, []); // O array vazio garante que o efeito só execute uma vez, quando o componente for montado


  const handleChangeCreateNewLayout = () => {
    setShowDashGraphics(false);
  }

  const handleOpenItemsModal = (graphic: Graphic) => {
    setSelectedGraphic(graphic);
  };

  const handleCloseItemsModal = () => {
    if (selectedGraphic) {
      // Atualiza o newGraphic com os items do selectedGraphic
      setNewGraphic((prev) => ({
        ...prev,
        items: selectedGraphic.items.map((item) => ({ ...item })),
      }));
    }

    // Fecha o modal
    setSelectedGraphic(null);
  };

  const handleCloseItemsObserverModal = () => {
    // Fecha o modal
    setSelectedGraphic(null);
  };

  async function getAvailbleTemplatesOrServidor() {
    if (!isAdmPage) return;

    try {

      const requestData = {
        jsonrpc: "2.0",
        method: "template.get",
        params: {
          output: ["templateid", "name"],
          filter: {
            hostids: isAdmPage ? null : serverId
          }
        },
        id: 1,
        auth: sessionStorage.getItem('session_token')
      };

      // console.log("getAvailbleTemplates - requestData\n", requestData);

      // Faz a requisição para a API do Zabbix
      const response = await axios.post(zabbixApiUrl, requestData);
      const data = response.data;
      // console.log("GraphicForm - getAvailbleTemplates\n" + JSON.stringify(data, null, 2));
      // Extrair e formatar as opções da resposta filtrada
      const templateData = data.result.map((template: { name: string, templateid: number, }) => ({
        templateId: template.templateid,
        name: template.name,
      }));
      setAvailableTemplates(templateData);

      if (isAdmPage && templateData.length > 0) {
        newLayout.templateOrServer.templateId = templateData[0].templateId;
        newLayout.templateOrServer.name = templateData[0].name;
        getItens(templateData[0].templateId.toString()); // Buscar items do primeiro template
      }

    } catch (error) {
      console.error('Erro ao buscar itens da API do Zabbix:', error);
    }
  }

  async function getItens(templateId: string) {
    try {
      const requestData = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
          "output": "extend",
          "hostids": isAdmPage ? null : templateId,
          "templateids": isAdmPage ? templateId : null,
          "sortfield": "name"
        },
        "id": 1,
        "auth": sessionStorage.getItem('session_token')
      };

      const response = await axios.post(zabbixApiUrl, requestData);
      const data = response.data.result;
      // console.log("getItens item.get:\n" + JSON.stringify(data, null, 2));

      const hostsData = data.map((item: { name: string, itemid: string, key_: string  }) => ({
        name: item.name,
        itemId: item.itemid,
        key: item.key_,
        isDicoveryItem: false
      }));
      
      setAvailableItems(hostsData);

      if(isAdmPage) {
        getAvailbleDiscoveryItems(templateId);
      }
      
      if (hostsData.length > 0) {
          setNewItem({ 
            name: hostsData[0].name, 
            itemId: hostsData[0].itemId,
            key: hostsData[0].key,
            isDicoveryItem: hostsData[0].isDicoveryItem,
            colorLine: '#212121',
            id: 1,
          });
      }
    } catch (error) {
      console.error('Erro ao buscar itens da API do Zabbix:', error);
    }
  }


  async function getAvailbleDiscoveryItems(templateId: string) {
    try {

      const requestData = {
        "jsonrpc": "2.0",
        "method": "discoveryrule.get",
        "params": {
          "output": ["extend"],
          "selectItems": ["name", "itemid", "key_"],
          "hostids": isAdmPage ? null : templateId,
          "templateids": isAdmPage ? templateId : null,
          "sortfield": "name"
        },
        "id": 1,
        "auth": sessionStorage.getItem('session_token')
      };
      
      const response = await axios.post(zabbixApiUrl, requestData);
      const data = response.data.result;
      
      const result = data.flatMap((group: any) => 
        group.items.map((item: { name: string, itemid: string, key_: string }) => ({
          itemId: item.itemid,
          key: item.key_,
          name: item.name,
          isDicoveryItem: true,
          colorLine: '#212121'
        }))
      );
      
      // console.log("getAvailbleDiscoveryItems result:\n" + JSON.stringify(result, null, 2));
      setAvailableItems(prevItems => [...prevItems, ...result]);

    } catch (error) {
      console.error('Erro ao buscar itens da API do Zabbix:', error);
    }
  }

  useEffect(() => {
    getAvailbleTemplatesOrServidor();
    if (!isAdmPage) {
      const serverTemplate = {
        templateId: serverId,
        name: serverName,
      }

      setNewGraphic((prev) => ({
        ...prev,
        template: { ...serverTemplate },
      }));

      getItens(serverId);
    }
    // console.log("useEffect:\n" + JSON.stringify(newGraphic, null, 2));
  }, []);

  return (
    <>
      {/* Criacao de layouts na tela do admin */}
      {((isAdmPage && !showDashGraphics) || (!showGraphicPreview && !isAdmPage)) && (
        <>
          {/* Nome geral do layout */}
          <Row className="mb-3">
            <Col>
              <Form.Control
                type="text"
                placeholder="Nome do Layout"
                value={newLayout.layoutName}
                onChange={(e) => setNewLayout({ ...newLayout, layoutName: e.target.value })}
              />
            </Col>
            <Col>
              {isAdmPage ? (
                <Form.Select
                  name="template"
                  value={newLayout.templateOrServer.templateId || ""}
                  disabled={newLayout.graphics.length > 0}
                  onChange={handleChangeSelectedTemplate}
                >
                  {availableTemplates.map(template => (
                    <option key={template.templateId} value={template.templateId}>
                      {template.name}
                    </option>
                  ))}
                </Form.Select>
              ) : (

                <>
                  <Form.Label>Servidor: {serverName}</Form.Label>
                </>
              )
              }
            </Col>
          </Row>

          {/* Tabela de montar gráficos*/}
          <Table striped bordered hover>
            <thead>
              <tr>

                <th>Tipo de Gráfico</th>
                <th>Largura</th>
                <th>Altura</th>
                <th>Itens do gráfico</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {newLayout.graphics.map((graphic) => (
                <tr key={graphic.id}>
                  <td>{
                    (() => {
                      if (graphic.chartType === "lineChart") return "Linha";
                      if (graphic.chartType === "barChart") return "Barra";
                      if (graphic.chartType === "pieChart") return "Circular";
                      return null;
                    })()
                  }</td>
                  <td>
                    {graphic.width}
                  </td>
                  <td>
                    {graphic.height}
                  </td>
                  <td>
                    <Button variant="info" size="sm" onClick={() => handleOpenItemsModal(graphic)}>
                      Itens
                    </Button>
                  </td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleRemoveGraphic(graphic.id)}>
                      Remover
                    </Button>
                    <Button variant="info" size="sm" onClick={handlePreviewGraphic}>
                      Preview
                    </Button>
                  </td>
                </tr>
              ))}
              <tr>

                <td>
                  <Form.Select
                    name="chartType"
                    value={newGraphic.chartType}
                    onChange={handleChange}
                  >
                    <option value="lineChart">Linha</option>
                    <option value="barChart">Barra</option>
                    <option value="pieChart">Circular</option>
                  </Form.Select>
                </td>
                <td>
                  <Form.Control
                    type="number"
                    name="width"
                    value={newGraphic.width}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    name="height"
                    value={newGraphic.height}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => handleOpenItemsModal(newGraphic)}
                  >
                    Itens
                  </Button>
                </td>
                <td>
                  <Button variant="success" size="sm" disabled={!(newGraphic.chartType && newGraphic.items.length > 0)} onClick={handleSubmitGraphic}>
                    Adicionar Gráfico
                  </Button>
                  <Button variant="info" size="sm" onClick={handlePreviewGraphic}>
                    Preview
                  </Button>
                </td>
              </tr>
            </tbody>
          </Table>

          {<Row className="mb-3">
            <Col>
              <Button variant="primary" disabled={!(newLayout.graphics.length > 0)} onClick={handleSaveLayout}>
                Salvar Layout
              </Button>
            </Col>
          </Row>}

          {isAdmPage && <Row className="mb-3">
            <Col>
              <Button variant="primary" onClick={handleChangeShowDashGraphics}>
                Voltar
              </Button>
            </Col>
          </Row>}

          {/* Adição de itens no gráfico atual */}
          <Modal className="custom-bootstrap-modal" show={selectedGraphic !== null && newGraphic.id === selectedGraphic.id} onHide={handleCloseItemsModal}>
            <Modal.Header closeButton>
              <Modal.Title>Itens do Gráfico</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGraphic?.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td><div style={{ width: '20px', height: '20px', backgroundColor: item.colorLine ? item.colorLine : '#212121' }}></div></td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveItem(item.id)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <Form.Select
                        name="item"
                        value={newItem.itemId || ""}
                        onChange={handleItemChange}
                      >
                        {availableItems.map(item => (
                          <option key={item.itemId} value={item.itemId}>{item.name}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        type="color"
                        name="colorLine"
                        defaultValue="#212121"
                        value={newItem.colorLine}
                        onChange={handleItemColorChange}
                      />
                    </td>
                    <td>
                      <Button variant="success" size="sm" disabled={!newItem.colorLine && !newItem.itemId} onClick={handleAddItem}>
                        Adicionar Item
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseItemsModal}>
                Fechar
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Itens após gráficos já adicionados */}
          <Modal className="custom-bootstrap-modal" show={selectedGraphic !== null && newGraphic.id !== selectedGraphic.id} onHide={handleCloseItemsObserverModal}>
            <Modal.Header closeButton>
              <Modal.Title>Itens do Gráfico</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGraphic?.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        <div style={{ width: '20px', height: '20px', backgroundColor: item.colorLine ? item.colorLine : '#212121' }}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseItemsModal}>
                Fechar
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}

      {/* Preview do gráfico dentro do from */}
      {showGraphicPreview && (
        <div>
          <GraphicDesign graphic={newGraphic} templateOrServerId={isAdmPage ? newLayout.templateOrServer.templateId : serverId}></GraphicDesign>
          <div>
            <Button variant="primary" onClick={closeGraphicPreview}>Voltar</Button>
          </div>
        </div>
      )}

      {/* Tabela de gestão de gráficos */}
      {(showDashGraphics && isAdmPage && savedLayouts) && (
        <>
          <h2 className='stats-title'>Layouts Salvos</h2>
          {/* Tabela de gerenciamento de layouts */}
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Layout</th>
                <th>Template</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {savedLayouts?.map((layout) => (
                <tr key={layout.layoutId}>
                  <td>{layout.layoutId}</td>
                  <td>{layout.layoutName}</td>
                  <td>{layout.serverName}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteLayout(layout.layoutId)}>
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>


          {isAdmPage && <Row className="mb-3">
            <Col>
              <Button variant="primary" onClick={handleChangeCreateNewLayout}>
                Criar novo layout
              </Button>
            </Col>
          </Row>}
        </>
      )}
    </>
  );

};

export default GraphicForm;
