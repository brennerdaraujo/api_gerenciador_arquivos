/**
 * Arquivo de configuracoes do banco de dados
 */

module.exports = {
    client: 'mysql',
    connection: {
      host : 'localhost',
      port: '3306',
      database: 'gerenciador_arquivos',
      user:     'root',
      password: 'criar@2020'
    },
    pool: {
      min: 2,
      max: 50
    }
}