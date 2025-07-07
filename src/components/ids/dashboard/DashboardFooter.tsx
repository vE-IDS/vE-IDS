import FooterButton from "./FooterButton"

const DashboardFooter: React.FC = () => {
    return (
        <table className="w-max border-t-2 border-dark-gray bg-dark-gray h-20 z-30">
            <tbody>
                <tr className="overflow-x-scroll">
                    <FooterButton text='Dashboard' href='/ids'/>
                    <FooterButton text='Chart Viewer' href='/ids/charts'/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                </tr>
                <tr className="overflow-x-scroll h-10">
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton disabled/>
                    <FooterButton text='Info Test' href='/ids/info/kmco'/>
                </tr>
            </tbody>
        </table>
    )
}

export default DashboardFooter