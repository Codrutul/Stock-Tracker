const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [3, 50]
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [8, 100] // Min length of 8 characters
            }
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'regular',
            validate: {
                isIn: [['regular', 'admin']]
            }
        },
        two_factor_secret: {
            type: DataTypes.STRING, // Encrypted secret
            allowNull: true
        },
        is_two_factor_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        two_factor_recovery_codes: { // Array of encrypted recovery codes
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return User;
}; 