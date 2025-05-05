# Stock Tracker Backend

This is the backend API for the Stock Tracker application, providing RESTful endpoints to manage stock data using a relational database infrastructure.

## Features

- RESTful API for stock management
- PostgreSQL database with Sequelize ORM
- Relational database with 1-to-many and many-to-many relationships
- Complete CRUD operations (Create, Read, Update, Delete)
- Filtering and sorting capabilities
- Validation middleware
- Unit tests
- WebSocket real-time updates

## Database Structure

The application uses a relational database with the following entities:

- **Stocks**: Main entity representing stock information
- **Users**: Application users
- **Portfolio**: One-to-many relationship connecting users and stocks
- **Tags**: Categories or labels that can be applied to stocks
- **StockTags**: Many-to-many relationship between stocks and tags

For more details, see the [Database Schema Documentation](./models/sequelize/README.md).

## API Endpoints

### Stocks

- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:name` - Get a stock by name
- `POST /api/stocks` - Create a new stock
- `PUT /api/stocks/:name` - Update an existing stock (full update)
- `PATCH /api/stocks/:name` - Update an existing stock (partial update)
- `DELETE /api/stocks/:name` - Delete a stock

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `GET /api/users/username/:username` - Get a user by username
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Portfolio (User-Stock relationship)

- `GET /api/users/:userId/portfolio` - Get a user's portfolio
- `POST /api/users/:userId/portfolio` - Add a stock to a user's portfolio
- `PUT /api/users/:userId/portfolio/:stockName` - Update a portfolio entry
- `DELETE /api/users/:userId/portfolio/:stockName` - Remove a stock from a user's portfolio
- `GET /api/users/:userId/portfolio/filter` - Get filtered and sorted portfolio

### Tags and Stock Tags

- `GET /api/tags` - Get all tags
- `GET /api/tags/:id` - Get a tag by ID
- `POST /api/tags` - Create a new tag
- `PUT /api/tags/:id` - Update a tag
- `DELETE /api/tags/:id` - Delete a tag
- `GET /api/tags/stock/:stockName` - Get all tags for a stock
- `GET /api/tags/:tagId/stocks` - Get all stocks with a specific tag
- `POST /api/tags/stock/:stockName/tag/:tagId` - Assign a tag to a stock
- `DELETE /api/tags/stock/:stockName/tag/:tagId` - Remove a tag from a stock

### Filtering and Sorting

- `GET /api/stocks/filteredAndSorted` - Get filtered and sorted stocks
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
├── controllers/            # Request handlers
├── models/                 # Data models
│   ├── sequelize/          # Sequelize ORM models and relationships
│   └── ...                # Other model files
├── routes/                 # API routes
├── middlewares/            # Custom middleware
├── tests/                  # Unit tests
├── uploads/                # Uploaded files
├── server.js               # Entry point
├── db.js                   # Database connection
└── package.json            # Dependencies
``` 