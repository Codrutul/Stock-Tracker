import {useState} from "react";

interface ListGroupProps {
    items: string[]
    header: string
    onSelectItem: (item: string) => void
}

function ListGroup({items, header, onSelectItem}: ListGroupProps) {

    const [selectedIndex, setSelectedIndex] = useState(-1)

    const getMessages = () => {
        return items.length === 0 ? <p>No item found</p> : null
    }


    return (
        <>
            <h1>{header}</h1>
            {getMessages()}
            <ul className="list-group">
                {items.map((item, index) => (
                    <li className={selectedIndex === index ? 'list-group-item active' : 'list-group-item'} key={item}
                        onClick={() => {
                            setSelectedIndex(index)
                            onSelectItem(item)
                        }}>{item} {index}</li>))}
            </ul>
        </>
    )
}

export default ListGroup