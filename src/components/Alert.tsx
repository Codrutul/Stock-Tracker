import {ReactNode} from "react";

interface Props {
    children: ReactNode
    onClose: () => void

}

const Alert = ({children, onClose}: Props) => {
    return (
        <div className="" role="alert">
            {children}
            <button type="button" className="" data-dismiss="alert" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    )
}


export default Alert;