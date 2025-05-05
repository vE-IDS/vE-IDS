const FooterButton: React.FC<Props> = ({text, disabled, href}: Props) => {
    return (
        <td>
            <button type='button' className={'w-40 h-10 border-r-2 border-b-2 border-mid-gray ' + ( disabled ? 'bg-light-gray' : 'bg-accent')}>
                {!disabled ? <a href={href} className="text-xs">
                    {text}
                </a> : <p>DISABLED</p>}
            </button>
        </td>
    )
}

export default FooterButton

type Props = {
    text?: string
    disabled?: boolean
    href?: string
}