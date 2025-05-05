const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Stock = sequelize.define('Stock', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        amount_owned: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        change: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true
            }
        },
        image_src: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'src/assets/company_default.png'
        },
        marketCap: {
            type: DataTypes.DECIMAL(20, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        dividendAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        },
        industry: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Technology'
        },
        headquarters: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Unknown'
        },
        peRatio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isDecimal: true,
                min: 0
            }
        }
    }, {
        tableName: 'stocks',
        timestamps: true,
        underscored: true
    });

    return Stock;
}; 