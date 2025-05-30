import Panel from "@/components/panels/Panel";
import TimerButton from "./TimerButton";

export default function TimerPanel() {
    return (
        <Panel title='Timers' rowspan={1} colspan={.5}>
            <div className='flex flex-col gap-y-2'>
                <TimerButton time={120}/>
                <TimerButton time={60}/>
                <TimerButton time={45}/>
            </div>
        </Panel>
    )
}
