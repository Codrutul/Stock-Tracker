export default class Stock {
    name: string
    price: number
    image_src?: string
    amount_owned: number
    change: number
    marketCap: number
    dividendAmount: number
    industry: string
    headquarters: string
    peRatio: number

    constructor(
        name: string, 
        price: number = 0, 
        amount_owned: number = 0, 
        change: number = 0, 
        image_src?: string,
        marketCap: number = 0,
        dividendAmount: number = 0,
        industry: string = "",
        headquarters: string = "",
        peRatio: number = 0
    ) {
        this.name = name
        this.price = price
        this.image_src = image_src
        this.amount_owned = amount_owned
        this.change = change
        this.marketCap = marketCap
        this.dividendAmount = dividendAmount
        this.industry = industry
        this.headquarters = headquarters
        this.peRatio = peRatio
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

    updateMarketCap(newMarketCap: number) {
        this.marketCap = newMarketCap
    }

    updateDividendAmount(newDividendAmount: number) {
        this.dividendAmount = newDividendAmount
    }

    updateIndustry(newIndustry: string) {
        this.industry = newIndustry
    }

    updateHeadquarters(newHeadquarters: string) {
        this.headquarters = newHeadquarters
    }

    updatePERatio(newPERatio: number) {
        this.peRatio = newPERatio
    }
}