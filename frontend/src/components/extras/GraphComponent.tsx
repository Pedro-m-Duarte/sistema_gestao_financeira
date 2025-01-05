import { ServerReportGraph } from "../ReportsPage";

const GraphComponent: React.FC<ServerReportGraph> = ({ graphDisplay, graphDescription, graphImage }) => (
    <div className='graph-container'>
        <br />
        <h3>{graphDisplay}</h3>
        <img src={`data:image/png;base64, ${graphImage}`} alt='Graph' />
        {
            graphDescription ?
                <p
                    style={{
                        marginLeft: '25%',
                        marginRight: '25%'
                    }}
                >
                    {`${graphDisplay}: ${graphDescription}`}
                </p> : <br />
        }
        <br />
    </div>
);

export default GraphComponent;