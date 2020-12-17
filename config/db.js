const config = require('../knexfile.js'); //Configs do banco
const knex = require('knex')(config); //Construtor de SQL Query

module.exports = knex;