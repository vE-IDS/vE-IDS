import Panel from "@/components/panels/Panel";
import TimerButton from "./TimerButton";

export default function TimerPanel() {
    return (
        <Panel title='Timers' rowspan={1} colspan={.5}>
            <div className='grid grid-cols-2 grid-rows-2 gap-2 h-full'>
                <TimerButton time={120}/>
                <TimerButton time={60}/>
                <TimerButton time={45}/>
                <TimerButton time={30}/>
            </div>
        </Panel>
    )
}
