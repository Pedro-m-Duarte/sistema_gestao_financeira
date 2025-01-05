import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import { Graphic, Item, HistoryData, DiscoveryItemData, GraphicDesignProps, ChartDataResults, LabelProps } from './interfaces';
import { zabbixApiUrl } from '../../App';
import axios from 'axios';

const GraphicDesign: React.FC<GraphicDesignProps> = ({ graphic, templateOrServerId }) => {
  const isPieChart = graphic.chartType === "pieChart";
  const isBarChart = graphic.chartType === "barChart";
  const isLineChart = graphic.chartType === "lineChart";
  const [itemData, setItemData] = useState<ChartDataResults[]>([]);
  const [discoveryItemData, setDiscoveryItemData] = useState<ChartDataResults[]>([]);

  // console.log("graphic graphic:\n" + JSON.stringify(graphic, null, 2));

  async function getItensFromDiscovery(item: Item): Promise<ChartDataResults | null> {
    try {
      const requestData = {
        "jsonrpc": "2.0",
        "method": "item.get",
        "params": {
          "output": ["name", "hostid", "key_", "filter"],
          "selectItemDiscovery": "extend",
          "hostids": templateOrServerId,
          "sortfield": "name"
        },
        "id": 1,
        "auth": sessionStorage.getItem('session_token')
      };
      const response = await axios.post(zabbixApiUrl, requestData);

      if (response.data) {
        for (const d of response.data.result) {
          if (d.itemDiscovery && d.itemDiscovery.key_ === item.key) {
            try {
              const requestDataHistory = {
                jsonrpc: '2.0',
                method: 'history.get',
                params: {
                  output: 'extend',
                  history: 0,
                  itemids: d.itemid,
                  hostids: templateOrServerId,
                  limit: 10,
                },
                id: 5,
                auth: sessionStorage.getItem('session_token'),
              };
              let responseHistory = await axios.post(zabbixApiUrl, requestDataHistory);

              if (!responseHistory.data || responseHistory.data.result.length <= 0) {
                requestDataHistory.params.history = 3;
                responseHistory = await axios.post(zabbixApiUrl, requestDataHistory);
              }

              if (responseHistory.data) {
                const historyData: HistoryData[] = responseHistory.data.result.map((entry: any) => ({
                  clock: entry.clock,
                  value: entry.value,
                  ns: entry.ns,
                }));

                if(historyData.length > 0) {
                  console.log("getItensFromDiscovery historyData.length > 0", historyData.length > 0);
                  setDiscoveryItemData(prevState => {

                    const itemExists = prevState.some(prev => prev.itemid === d.itemid);
                    if (itemExists) {
                      console.log("getItensFromDiscovery return prevState:", prevState);
                      return prevState;
                    }
                  
                    const updatedState = [
                      ...prevState,
                      {
                        itemid: d.itemid,
                        itemName: d.name,
                        color: item.colorLine ? item.colorLine : '#212121',
                        history: historyData,
                        isDicoveryItem: item.isDicoveryItem,
                      },
                    ];
                  
                    console.log("getItensFromDiscovery return updatedState:", updatedState);
                    return updatedState;
                  });
                }
              }
            } catch (error) {
              console.error('Erro ao pegar o valor de um item:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar itens da API do Zabbix:', error);
    }

    return null;
  }

  const getDataItems = useCallback(async (graphicData: Graphic) => {
    if (!graphicData) return;

    for (const item of graphicData.items) {
      if (item.isDicoveryItem) {
        await getItensFromDiscovery(item);
        console.log("terminei o await discoveryItemData: ", discoveryItemData);
        // buildDiscoveryItemChart(discoveryItemData);
      } else {

        if (itemData.some(i => i.itemid == item.itemId)) continue;
        const requestData = {
          jsonrpc: '2.0',
          method: 'history.get',
          params: {
            output: 'extend',
            history: 0,
            itemids: item.itemId,
            hostids: templateOrServerId,
            limit: 10,
          },
          id: 5,
          auth: sessionStorage.getItem('session_token'),
        };

        try {
          let response = await axios.post(zabbixApiUrl, requestData);

          if (!response.data || response.data.result.length <= 0) {
            // console.log("getDataItems requestData - dentro do if:\n" + JSON.stringify(requestData, null, 2));
            requestData.params.history = 3;
            response = await axios.post(zabbixApiUrl, requestData);
          }

          if (response.data) {
            // console.log("getDataItems response:\n" + JSON.stringify(response.data, null, 2));
            const historyData: HistoryData[] = response.data.result.map((entry: any) => ({
              clock: entry.clock,
              value: entry.value,
              ns: entry.ns,
            }));

            setItemData(prevState => {
              const updatedState = [
                ...prevState,
                {
                  itemid: item.itemId,
                  itemName: item.name,
                  color: item.colorLine ? item.colorLine : '#212121',
                  history: historyData,
                  isDicoveryItem: item.isDicoveryItem
                },
              ];
              if (item.itemId === prevState[prevState.length - 1]?.itemid) return prevState;

              return updatedState;
            });
          }

        } catch (error) {
          console.error('Erro ao pegar o valor de um item:', error);
        }
      }

    }
  }, [itemData]);

  const renderCustomizedLabel = ({
    percent,
  }: LabelProps): string => {
    const percentage = (percent * 100).toFixed(2);
    return `${percentage}%`;
  };

  const buildPieChart = (items: ChartDataResults[]) => {
    //Parametrers pieChart
    const cx = 150;
    const cy = 200;
    const iR = 50;
    const oR = 100;

    const formattedData = items.map(item => ({
      name: item.itemName,
      value: parseFloat((item.history.reduce((sum, history) => sum + parseFloat(history.value), 0) / item.history.length).toFixed(2)), // Formatar para 2 casas decimais
      color: item.color ? item.color : '#212121',
    }));
    const totalValue = formattedData.reduce((sum, item) => sum + item.value, 0);
    const totalPercentage = 100;
    const remainingValue = parseFloat((totalPercentage - totalValue).toFixed(2));
    const width = Number(graphic.width);
    const height = Number(graphic.height);
    const finalData = [
      ...formattedData,
      { name: 'Total', value: remainingValue, color: '#919191' }
    ];

    return (
      <ResponsiveContainer width={width} height={height} max-height={291} max-width={300}>
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={finalData}
            cx={cx}
            cy={cy}
            innerRadius={iR}
            outerRadius={oR}
            fill="#8884d7"
            stroke="none"
            label={renderCustomizedLabel}
          >
            {finalData.map((entry, index) => (
              <Cell key={`cell-${index} %%`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const buildBarChart = (items: ChartDataResults[]) => {
    // console.log("graphic", graphic)
    // Combina os dados históricos em um único array de objetos
    const formattedData = items.flatMap(item => {
      return item.history.map(history => ({
        clock: changeClockToTime(history.clock),
        [item.itemName]: parseFloat(history.value),
      }));
    });

    // Define o tipo para o array acumulador
    type FormattedDataItem = {
      clock: string;
      [key: string]: string | number;
    };

    // Agrupa por clock
    const groupedData = formattedData.reduce<FormattedDataItem[]>((acc, currentItem) => {
      const existingItem = acc.find(item => item.clock === currentItem.clock);
      if (existingItem) {
        Object.assign(existingItem, currentItem);
      } else {
        acc.push(currentItem);
      }
      return acc;
    }, []);

    const sortedFormattedData = groupedData.sort((a, b) => a.clock.localeCompare(b.clock));
    // console.log("sortedFormattedData", sortedFormattedData);
    const width = Number(graphic.width);
    const height = Number(graphic.height);
    return (
      <BarChart
        data={groupedData}
        width={width}
        height={height}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="clock" />
        <YAxis />
        <Tooltip />
        <Legend />
        {items.map((item) => (
          <Bar key={item.itemid} dataKey={item.itemName} fill={item.color ? item.color : '#212121'} activeBar={<Rectangle fill="pink" stroke="blue" />} />
        ))}
      </BarChart>
    );
  };

  const changeClockToTime = (clock: string) => {
    const timestampInSeconds = parseInt(clock, 10);
    const date = new Date(timestampInSeconds * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const formattedTime = `${hours}:${minutes}`;

    return formattedTime;
  };

  const buildLineChart = (items: ChartDataResults[]) => {
    const formattedData = items.map((item) => {
      return item.history.map((history) => ({
        clock: changeClockToTime(history.clock),
        [item.itemName]: history.value,
        value: history.value
      }));
    }).flat();
    // console.log(graphic)
    const width = Number(graphic.width);
    const height = Number(graphic.height);
    // console.log(formattedData)
    // Encontrar o maior valor no formattedData
    const maxValue = Math.max(...formattedData.map(item => parseFloat(item.value)));
    // const sortedFormattedData = formattedData.sort((a, b) => a.clock.localeCompare(b.clock));

    return (
      <LineChart
        width={width}
        height={height}
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="clock" />
        <YAxis domain={[0, (maxValue / 2) + maxValue]} />
        <Tooltip />
        <Legend />
        {items.map((item) => (
          <Line
            key={item.itemid}
            type="monotone"
            dataKey={item.itemName}
            stroke={item.color ? item.color : '#212121'}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    );
  };

  useEffect(() => {
    const obterDados = async () => {
      setItemData([]);
      await getDataItems(graphic);
    }
    obterDados();
    // console.log("setDiscoveryItemData d\n" + JSON.stringify(discoveryItemData, null, 2));

  }, [graphic, templateOrServerId]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {discoveryItemData.length > 0 && discoveryItemData.map((item, index) => {
          return (
            <div key={`${item.itemid}-${index}`}>
              {isPieChart && <div>{buildPieChart([item])}</div>}
              {isBarChart && <div>{buildBarChart([item])}</div>}
              {isLineChart && <div>{buildLineChart([item])}</div>}
            </div>
          );
        })}
      </div>

      {isPieChart ? buildPieChart(itemData) :
        isBarChart ? buildBarChart(itemData) :
          isLineChart ? buildLineChart(itemData) : <div></div>}
    </>
  );
};

export default GraphicDesign;
