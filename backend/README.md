# Stock Tracker Backend

This is the backend API for the Stock Tracker application, providing RESTful endpoints to manage stock data.

## Features

- RESTful API for stock management
- PostgreSQL database integration
- Complete CRUD operations (Create, Read, Update, Delete)
- Filtering and sorting capabilities
- Validation middleware
- Unit tests

## API Endpoints

### Stocks

- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:name` - Get a stock by name
- `POST /api/stocks` - Create a new stock
- `PATCH /api/stocks/:name` - Update an existing stock
- `DELETE /api/stocks/:name` - Delete a stock

### Filtering and Sorting

- `GET /api/stocks/filter/industry/:industry` - Get stocks by industry
- `GET /api/stocks/filter/price?min=X&max=Y` - Get stocks within a price range
- `GET /api/stocks/sort/:sortBy` - Get sorted stocks (price, marketCap, change, dividendAmount, amount_owned)

## Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Stock-Tracker/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Update `database.env` with your PostgreSQL connection string

4. Start the server:
```bash
npm run dev
```

### Testing

Run tests with Jest:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
backend/
├── controllers/      # Request handlers
├── models/           # Data models
├── routes/           # API routes
├── middlewares/      # Custom middleware
├── tests/            # Unit tests
├── server.js         # Entry point
├── db.js             # Database connection
└── package.json      # Dependencies
``` 