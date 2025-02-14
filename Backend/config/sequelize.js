let db = {};
var Sequelize = require('sequelize');

  const Op = Sequelize.Op;
  const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};
const DataTypes = Sequelize.DataTypes;



    let dbHost = process.env.DB_Host,
    dbName = process.env.DB_Database,
    dialect = 'mysql',
    username = process.env.DB_User,
    pwd = process.env.DB_Password;

   
    try{
    const sequelize = new Sequelize(dbName, username, pwd, {
    host: dbHost,
    port: '3306',
    dialect:dialect,
    dialectOptions: {
      connectTimeout: 60000, 
    },
    operatorsAliases: operatorsAliases,
    debug:false,
    pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000
    }

});

db.DataTypes = DataTypes;
db.sequelize = sequelize;

module.exports = db;

    } catch (err) {
      console.error('Unable to connect to the database:', err)
    }