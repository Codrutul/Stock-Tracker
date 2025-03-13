import Stock from './Stock'

export default class StockRepo {
    list: Stock[] = []

    constructor(list: Stock[] = []) {
        this.list = list
    }

    addStock(stock: Stock) {
        const newList = [...this.list, stock];
        return new StockRepo(newList);
    }

    removeStock(stock: Stock) {
        const newList = this.list.filter((s) => s !== stock);
        return new StockRepo(newList);
    }

    getStocks() {
        return this.list
    }

    getStock(name: string) {
        return this.list.find(s => s.name === name)
    }


}