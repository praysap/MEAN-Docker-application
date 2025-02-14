// 'use strict';
// const {
//   Model
// } = require('sequelize');

// // const env = process.env.NODE_ENV || 'development';
// // const config = require(__dirname + '/../../../config.json')[env];

// module.exports = (sequelize, DataTypes) => {

//   class User extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here

//       /* User.hasMany(models.user_activity, {
//          foreignKey: 'user_id',
//          as: 'user_activity'
//        });*/
//     }
//   }

//   User.init({
    
//     user_id : {
//         type: DataTypes.INTEGER(11),
//         autoIncrement: true,
//         primaryKey: true
//       },    
//     name: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//     },
//     role: {
//       type: DataTypes.STRING(50),
//       allowNull: false
//     },
//     email: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//       email: true,
//       unique: true
//     },
//     password: {
//       type: DataTypes.STRING(200),
//       allowNull: false
//     },
//     username: {
//       type: DataTypes.STRING(50),
//       allowNull: false
//     },
//     user_status: {
//       type: DataTypes.STRING(50),
//       allowNull: false
//     },
//     token: {
//       type: DataTypes.STRING(1000),
//       allowNull: false
//     },
//     otp: {
//       type: DataTypes.INTEGER(11),
//       allowNull: true
//     },
    
//   }, {
//     sequelize,
//     modelName: 'new_users',
//     timestamps: false
//   });

//   return User;
  
// };

const { DataTypes } = require("sequelize");
const sequelize = require("../database/db.config");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "admin",
    },
    token: {
      type: DataTypes.STRING,
      defaultValue: "I am not having token",
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastFailedLogin: {
      type: DataTypes.DATE,
    },
    otp: {
      type: DataTypes.STRING,
    },
    recentPasswordHashes: {
      type: DataTypes.JSON, // Store as JSON array
      defaultValue: [],
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt
  }
);

module.exports = User;