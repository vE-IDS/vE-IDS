const AtisDivider: React.FC<Props> = ({facility}: Props) => {
    return (
        <div className="w-full bg-dark-gray">
            <h4 className="text-center">{facility.toUpperCase()} Facilities</h4>
        </div>
    )
}

export default AtisDivider

type Props = {
    facility: String
}