const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Portfolio = sequelize.define('Portfolio', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        stockName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'stock_name',
            references: {
                model: 'stocks',
                key: 'name'
            },
            onDelete: 'CASCADE'
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        purchasePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'purchase_price',
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        purchaseDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'purchase_date'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: ''
        }
    }, {
        tableName: 'portfolios',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'stock_name']
            }
        ]
    });

    return Portfolio;
}; 