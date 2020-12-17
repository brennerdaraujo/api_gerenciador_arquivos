/**
 * Arquivo que lida com a autenticação do usuário.
 */

const { authSecret } = require('../.env');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');
const { get } = require('lodash');
const moment = require('moment');
const { segundosDuracaoToken } = require('../consts');
const { validateEmail } = require('../functions');

module.exports = app => {

    // Função que verifica o login do usuario e retorna o token
    const signin = (req, res) => {
        const email = (get(req, 'body.email') || '').trim();
        const senha = (get(req, 'body.senha') || '').trim();
        
        // Validations
        if (!validateEmail(email)) {
            res.status(400).json({
                erro: 'E-mail não indicado!'
            });
            return;
        }

        if (!senha) {
            res.status(400).json({
                erro: 'Senha não indicada!'
            });
            return;
        }

        app.db('usuarios')
            .whereRaw('LOWER(email) = LOWER(?)', email)
            .first()
            .then(usuario => {
                if (!usuario) {
                    res.status(404).json({
                        erro: 'Usuário não encontrado.'
                    });
                    return;
                }

                const senhaOk = bcrypt.compareSync(senha, usuario.senha);

                if (!senhaOk) {
                    res.status(400).json({
                        erro: 'Usuário inválido.'
                    });
                    return;
                }

                res.status(200).json({
                    token: jwt.encode({
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        exp: moment().unix() + segundosDuracaoToken
                    }, authSecret)
                });
            })
            .catch(err => {
                res.status(500).json({
                    erro: err.message
                });
            });
    }
    
    return { signin };
}