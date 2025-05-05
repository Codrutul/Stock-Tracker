const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StockTag = sequelize.define('StockTag', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        tagId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'tag_id',
            references: {
                model: 'tags',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'stock_tags',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['stock_name', 'tag_id']
            }
        ]
    });

    return StockTag;
}; 