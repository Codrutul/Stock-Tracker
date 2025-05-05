# Relational Database Implementation - Assignment 3

## Requirements Implemented

### Database Relationships

- **1-to-many Relationship**: Implemented between User and Stock entities through the Portfolio table
  - A User can have many stocks in their portfolio
  - Each Portfolio entry belongs to exactly one User

- **many-to-many Relationship**: Implemented between Stock and Tag entities
  - A Stock can have multiple Tags
  - A Tag can be applied to multiple Stocks
  - Relationship managed through the StockTag junction table

### Full CRUD Support

Implemented complete CRUD operations for all entities:

- **Create**:
  - Create new users, stocks, tags
  - Create relationships between entities (add a stock to portfolio, assign a tag to a stock)

- **Read**:
  - Get all entities (users, stocks, tags, portfolios)
  - Get entities by ID/name
  - Get related entities (get a user's portfolio, get tags for a stock)

- **Update**:
  - Update user details
  - Update stock information
  - Update portfolio entries
  - Update tag details

- **Delete**:
  - Delete users (cascades to their portfolios)
  - Delete stocks (cascades to portfolio entries and tag assignments)
  - Delete tags
  - Remove relationships (remove stock from portfolio, remove tag from stock)

### Filtering and Sorting

Implemented comprehensive filtering and sorting capabilities:

- **Filtering**:
  - Filter stocks by industry
  - Filter stocks by price range
  - Filter portfolio entries by stock characteristics
  - Filter tags by category

- **Sorting**:
  - Sort stocks by price, market cap, change, amount owned, dividend amount
  - Sort portfolio entries by purchase date, quantity, purchase price
  - Sort tags by name, creation date, category

### ORM Usage

Used Sequelize ORM to manage database operations efficiently:

- **Model Definitions**: Created Sequelize models for all entities
- **Relationships**: Configured associations between models
- **Validations**: Added data validation rules to ensure data integrity
- **Transactions**: Implemented to ensure data consistency for operations affecting multiple tables

## Technologies Used

- **Database**: PostgreSQL
- **ORM**: Sequelize
- **API Framework**: Express.js
- **Real-time Updates**: WebSocket

## Project Structure

The project follows a clean architecture with:

- **Models**: Sequelize models and repository classes
- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints
- **Middleware**: Handle validation, error handling, etc.

## Database Schema

The database schema includes:

- **Stock**: Represents stock information
- **User**: Represents a user of the application
- **Portfolio**: Represents a one-to-many relationship between users and stocks
- **Tag**: Represents tags/labels that can be applied to stocks
- **StockTag**: Junction table for the many-to-many relationship between stocks and tags

## How to Run

1. Ensure PostgreSQL is installed and running
2. Configure database connection in `backend/database.env`
3. Run the setup script: `./run.sh`

This will:
- Install dependencies
- Initialize the database with sample data
- Start the server

## Testing the API

Use tools like Postman or curl to interact with the API endpoints:

- Create a user: `POST /api/users`
- Create a stock: `POST /api/stocks`
- Add stock to portfolio: `POST /api/users/{userId}/portfolio`
- Add a tag to a stock: `POST /api/tags/stock/{stockName}/tag/{tagId}`
- Get a user's portfolio: `GET /api/users/{userId}/portfolio`
- Filter and sort stocks: `GET /api/stocks/filteredAndSorted?industry=Technology&minPrice=100&maxPrice=500&sortBy=price` 