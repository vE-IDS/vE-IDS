const AtisDivider: React.FC<Props> = ({label}: Props) => {
    return (
        <div className="w-full bg-dark-gray">
            <h4 className="text-center">{label}</h4>
        </div>
    )
}

export default AtisDivider

type Props = {
    label: string
}