

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