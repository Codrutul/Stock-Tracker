# Stock Tracker Relational Database

This directory contains the relational database infrastructure for the Stock Tracker application, built using Sequelize ORM with PostgreSQL.

## Database Schema

The database schema consists of the following entities and relationships:

### Stock

Represents a stock in the market:
- `name` (PK): Unique identifier for the stock
- `price`: Current stock price
- `amount_owned`: Amount of stock owned
- `change`: Price change in percentage
- `image_src`: Path to the stock image
- `marketCap`: Market capitalization
- `dividendAmount`: Dividend amount
- `industry`: Industry category
- `headquarters`: Company headquarters
- `peRatio`: Price-to-earnings ratio

### User

Represents a user of the application:
- `id` (PK): Auto-incremented unique identifier
- `username`: Unique username
- `email`: Unique email address
- `created_at`: Timestamp of user creation
- `updated_at`: Timestamp of last update

### Portfolio

Represents a one-to-many relationship between a User and the Stocks they own:
- `id` (PK): Auto-incremented unique identifier
- `user_id` (FK): Reference to User table
- `stock_name` (FK): Reference to Stock table
- `quantity`: Amount of stock owned
- `purchase_price`: Price at which the stock was purchased
- `purchase_date`: Date of purchase
- `notes`: Optional notes

### Tag

Represents a tag that can be attached to multiple stocks:
- `id` (PK): Auto-incremented unique identifier
- `name`: Unique tag name
- `category`: Tag category
- `created_at`: Timestamp of tag creation

### StockTag

Junction table representing a many-to-many relationship between Stock and Tag:
- `id` (PK): Auto-incremented unique identifier
- `stock_name` (FK): Reference to Stock table
- `tag_id` (FK): Reference to Tag table
- `created_at`: Timestamp of association creation

## Entity Relationships

1. **One-to-Many**: A User can own many Stocks (through Portfolio)
   - One User → Many Portfolio entries

2. **One-to-Many**: A Stock can be owned by many Users (through Portfolio)
   - One Stock → Many Portfolio entries

3. **Many-to-Many**: Stocks can have multiple Tags, and Tags can be applied to multiple Stocks
   - Many Stocks ↔ Many Tags (through StockTag junction table)

## CRUD Operations

All entities support full CRUD (Create, Read, Update, Delete) operations:

- **Create**: Add new entities to the database
- **Read**: Retrieve entities with filtering and sorting capabilities
- **Update**: Modify existing entities
- **Delete**: Remove entities from the database

## Filtering and Sorting

The database structure supports filtering and sorting operations:

- Filter stocks by industry, price range, and other attributes
- Sort stocks by price, market cap, change, etc.
- Filter portfolio by stock characteristics
- Sort portfolio by purchase date, quantity, etc.
- Filter tags by category
- Sort tags by name, creation date, etc.

## API Integration

The Sequelize models are used through repository classes that provide a clean interface for the controllers. This design allows for flexible querying, relationship traversal, and data manipulation while maintaining separation of concerns. 