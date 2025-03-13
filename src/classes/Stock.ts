export default class Stock {
    name: string
    price: number
    image_src?: string
    amount_owned: number
    change: number

    constructor(name: string, price: number = 0, amount_owned: number = 0, change: number = 0, image_src?: string) {
        this.name = name
        this.price = price
        this.image_src = image_src
        this.amount_owned = amount_owned
        this.change = change
    }

    updatePrice(newPrice: number) {
        this.price = newPrice
    }

    updateName(newName: string) {
        this.name = newName
    }

    updateAmount(newAmount: number) {
        this.amount_owned = newAmount
    }

    updateChange(newChange: number) {
        this.change = newChange
    }

    updateImage(newImage: string) {
        this.image_src = newImage
    }

}