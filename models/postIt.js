const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const PostIt = sequelize.define("postIt", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  color: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = PostIt;
