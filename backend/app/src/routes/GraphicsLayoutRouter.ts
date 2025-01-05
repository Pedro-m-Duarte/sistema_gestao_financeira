import express, { Request, Response, Router } from 'express';
import { Op } from 'sequelize';
import LayoutTable from '../db/models/LayoutTable';
import Graphic from '../db/models/Graphic';
import Item from '../db/models/Item';
import TemplateOrServer from '../db/models/TemplateOrServer';

// Rota para criar um novo layout
export default Router()
  .post('/createLayout', async (req: Request, res: Response) => {
    const { templateOrServerId, templateOrServerName, layoutName, graphics, isServer, createdByAdminPage } = req.body;

    // Verifica se TemplateOrServer já existe, caso contrário, cria
    let templateOrServer = await TemplateOrServer.findByPk(templateOrServerId);
    if (!templateOrServer) {
      templateOrServer = await TemplateOrServer.create({ templateId: templateOrServerId, name: templateOrServerName, isServer: isServer });
    }

    // Cria Layout
    const layout = await LayoutTable.create({ templateOrServerId, layoutName, createdByAdminPage });

    // Cria Gráficos e Itens
    for (const graphicData of graphics) {
      const { name, chartType, items, width, height } = graphicData;
      const graphic = await Graphic.create({ name, chartType, layoutId: layout.id, width, height });
      
      console.log("Grafico Criado router(): /createLayout : " + JSON.stringify(graphic,null,2))
      
      for (const itemData of items) {
        const { name, itemId, colorLine, key, isDicoveryItem} = itemData;
        const item = await Item.create({ name, itemId, colorLine, graphicId: graphic.id, key, isDicoveryItem});
        console.log("Item Criado router(): /createLayout : " + JSON.stringify(item,null,2))
      }
    }

    res.status(201).json({ message: 'Layout created successfully', layout });
  })

  .post('/deleteLayout', async (req: Request, res: Response) => {
    const { layoutId } = req.body;
  
    try {
      // Verifica se o layout existe
      const layout = await LayoutTable.findByPk(layoutId);
      if (!layout) {
        return res.status(404).json({ message: 'Layout not found' });
      }
  
      // Encontra todos os gráficos relacionados a este layout
      const graphics = await Graphic.findAll({ where: { layoutId: layoutId } });
  
      for (const graphic of graphics) {
        // Encontra todos os itens relacionados a este gráfico
        const items = await Item.findAll({ where: { graphicId: graphic.id } });
  
        // Exclui todos os itens relacionados a este gráfico
        for (const item of items) {
          await item.destroy();
          console.log("Item Excluído router(): /deleteLayout : " + JSON.stringify(item, null, 2));
        }
  
        // Exclui o gráfico
        await graphic.destroy();
        console.log("Gráfico Excluído router(): /deleteLayout : " + JSON.stringify(graphic, null, 2));
      }
  
      // Exclui o layout
      await layout.destroy();
      console.log("Layout Excluído router(): /deleteLayout : " + JSON.stringify(layout, null, 2));
      
      const resultOfLayoutsTable = await LayoutTable.findAll({
        include: {
          model: TemplateOrServer,
          as: 'templateOrServer',
        },
      });

      if (!resultOfLayoutsTable) {
        return res.status(404).json({ message: 'Layouts not found' });
      }
  
      const response = resultOfLayoutsTable.map((layout) => ({
        serverName: layout.templateOrServer.name,
        layoutId: layout.id,
        layoutName: layout.layoutName,
        message: 'Layout deleted successfully'
      }));

      res.status(200).json(response);
    } catch (error) {
      console.error("Erro router(): /deleteLayout : " + error);
      res.status(500).json({ message: 'Internal server error' });
    }
  })

  .post('/getLayoutByServer', async (req: Request, res: Response) => {
    const { templateOrServerIds } = req.body;

    if (!templateOrServerIds || !Array.isArray(templateOrServerIds)) {
      return res.status(400).json({ message: 'Invalid templateOrServerIds' });
    }
  
    try {
      // Verifica se os servidores ou templates existem
      const templateOrServers = await TemplateOrServer.findAll({
        where: {
          templateId: {
            [Op.in]: templateOrServerIds.map((id) => parseInt(id, 10)),
          },
        },
      });
  
      if (!templateOrServers.length) {
        return res.status(404).json({ message: 'Servers or templates not found' });
      }
  
      const templateIds = templateOrServers.map((tos) => tos.templateId);
  
      // Busca todos os layouts associados a esses servidores ou templates
      const layouts = await LayoutTable.findAll({
        where: {
          templateOrServerId: {
            [Op.in]: templateIds,
          },
        },
      });
  
      const response = [];
  
      for (const layout of layouts) {
        const layoutData: any = {
          serverID: layout.templateOrServerId,
          layoutId: layout.id,
          name: layout.layoutName,
          graphics: [],
        };
  
        // Busca todos os gráficos relacionados a este layout
        const graphics = await Graphic.findAll({ where: { layoutId: layout.id } });
  
        for (const graphic of graphics) {
          const graphicData: any = {
            graphicId: graphic.id,
            name: graphic.name,
            width: graphic.width,
            height: graphic.height,
            chartType: graphic.chartType,
            items: [],
          };
  
          // Busca todos os itens relacionados a este gráfico
          const items = await Item.findAll({ where: { graphicId: graphic.id } });
  
          for (const item of items) {
            graphicData.items.push({
              itemId: item.itemId,
              name: item.name,
              key: item.key,
              colorLine: item.colorLine,
              isDicoveryItem: item.isDicoveryItem
            });
          }
  
          layoutData.graphics.push(graphicData);
        }
  
        response.push(layoutData);
      }
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Erro router(): /getLayoutByServer : " + error);
      res.status(500).json({ message: 'Internal server error' });
    }
  })

  .get('/getAllLayouts', async (req: Request, res: Response) => {
    try {
      // Inclua a associação com TemplateOrServer na consulta
      const layouts = await LayoutTable.findAll({
        include: {
          model: TemplateOrServer,
          as: 'templateOrServer',
        },
      });

      if (!layouts) {
        return res.status(404).json({ message: 'Layouts not found' });
      }
  
      const response = layouts.map((layout) => ({
        serverName: layout.templateOrServer.name,
        layoutId: layout.id,
        layoutName: layout.layoutName,
      }));
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Erro router(): /getAllLayouts : " + error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  