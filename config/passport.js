const { authSecret } = require('../.env'); //Secret
const passport = require('passport'); //Autenticação
const passportJwt = require('passport-jwt'); //Estrategia de autenticação jwt
const { Strategy, ExtractJwt } = passportJwt;

//Exporta função
module.exports = app => {

    //Parametros de autenticação
    const params = {
        secretOrKey: authSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() //Pega o valor no header de autenticação
    };

    //Estratégia de autenticação
    const strategy = new Strategy(params, (payload, done) => {
        //Pesquisa em usuarios se há um id que bate com o payload
        app.db('usuarios')
            .where({ id: payload.id })
            .first()
            .then(usuario => {
                if (usuario) { // Se achar, passa os dados desejados para req.user
                    done(null, payload);
                } else { // Senao nao faz nada
                    done(null, false);
                }
            })
            .catch(err => {
                done(err, false);
            });
    });

    passport.use(strategy);

    return {
        initialize: () => passport.initialize(),
        authenticate: () => passport.authenticate('jwt', { session: false })
    };
}