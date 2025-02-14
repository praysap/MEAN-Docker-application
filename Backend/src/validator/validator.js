const Sequelize = require("sequelize");
const { check } = require('express-validator');
// const env = process.env.NODE_ENV || 'development';
// const development = require(__dirname + '../../../../config.json')[env];

// const Op = Sequelize.Op;
// const operatorsAliases = {
//     $eq: Op.eq,
//     $ne: Op.ne,
//     $gte: Op.gte,
//     $gt: Op.gt,
//     $lte: Op.lte,
//     $lt: Op.lt,
//     $not: Op.not,
//     $in: Op.in,
//     $notIn: Op.notIn,
//     $is: Op.is,
//     $like: Op.like,
//     $notLike: Op.notLike,
//     $iLike: Op.iLike,
//     $notILike: Op.notILike,
//     $regexp: Op.regexp,
//     $notRegexp: Op.notRegexp,
//     $iRegexp: Op.iRegexp,
//     $notIRegexp: Op.notIRegexp,
//     $between: Op.between,
//     $notBetween: Op.notBetween,
//     $overlap: Op.overlap,
//     $contains: Op.contains,
//     $contained: Op.contained,
//     $adjacent: Op.adjacent,
//     $strictLeft: Op.strictLeft,
//     $strictRight: Op.strictRight,
//     $noExtendRight: Op.noExtendRight,
//     $noExtendLeft: Op.noExtendLeft,
//     $and: Op.and,
//     $or: Op.or,
//     $any: Op.any,
//     $all: Op.all,
//     $values: Op.values,
//     $col: Op.col
// };

// const DataTypes = Sequelize.DataTypes;
// var sequelize = new Sequelize(development.database, development.username, development.password, {
//     host: development.host,
//     dialect: development.dialect,
//     operatorsAliases: operatorsAliases,

//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     }

//     // SQLite only
//     //storage: 'path/to/database.sqlite'
// });

const validation = {
    LOGIN: [
        // check('email')
        //     .notEmpty().withMessage('Please enter your email.')
        //     .isLength({ max: 40 }).withMessage('Email may not be greater than 40 characters.')
        //     .matches(/^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i).withMessage('Please enter a valid email address'),
        check('username')
            .notEmpty().withMessage('Please enter your username.')
            .isLength({ max: 40 }).withMessage('username may not be greater than 40 characters.')
            .matches(/^[a-zA-Z0-9 ]+$/i).withMessage('Please enter a valid username '),

        check('password')
        .notEmpty().withMessage('Please enter your password.')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
            .isLength({ max: 100 }).withMessage('Password may not be greater than 100 characters.'),
    ],

    CREATE_USER: [
        check('email')
            .notEmpty().withMessage('Please enter your email.')
            .isLength({ max: 40 }).withMessage('Email may not be greater than 40 characters.')
            .matches(/^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i).withMessage('Please enter a valid email address'),
        check('name')
            .notEmpty().withMessage('Please enter your name.')
            .isLength({ max: 40 }).withMessage('name may not be greater than 40 characters.')
            .matches(/^[a-zA-Z0-9 ]+$/i).withMessage("name can't contain special characters"),

        check('username')
            .notEmpty().withMessage('Please enter your username.')
            .isLength({ max: 40 }).withMessage('username may not be greater than 40 characters.')
            .matches(/^[a-zA-Z0-9 ]+$/i).withMessage("Username can't contain special characters"),

        check('password')
        .notEmpty().withMessage('Please enter your password.')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
            .isLength({ max: 100 }).withMessage('Password may not be greater than 100 characters.'),
    ],
}

module.exports = validation;