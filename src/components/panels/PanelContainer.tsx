import TimerPanel from "../ids/timer/TimerPanel"
import Panel from "./Panel"

const PanelContainer: React.FC = () => {
    return (
        <div className='panel p-1 grid-container grid-flow-row grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 grid-rows-3 gap-x-1 gap-y-1'>
            <TimerPanel/>
            
            <Panel title='test'>
                <h2>2</h2>
            </Panel>
            <Panel title='test' rowspan={1}>
                <h2>3</h2>
            </Panel>
            <Panel title='test'>
                <h2>4</h2>
            </Panel>
        </div>
    )
}

export default PanelContainer