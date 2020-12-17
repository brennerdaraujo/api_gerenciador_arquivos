// Rotas da api
module.exports = app => {

    app.post('/login', app.api.auth.signin);

    app.route('/usuarios')
        .all(app.config.passport.authenticate())
        .post(app.api.users.addUser);

    app.route('/arquivos')
        .all(app.config.passport.authenticate())
        .get(app.api.arquivos.getFiles)
        .post(app.api.arquivos.uploadFiles);

    app.route('/arquivos/:nome')
        .all(app.config.passport.authenticate())
        .patch(app.api.arquivos.downloadFile);
}