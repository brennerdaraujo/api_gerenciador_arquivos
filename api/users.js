const bcrypt = require('bcrypt');
const moment = require('moment');
const { get } = require('lodash');
const { validateEmail } = require('../functions');

module.exports = app => {

    // Função que cadastra usuario no banco de dados.
    const addUser = (req, res) => {
        const email = (get(req, 'body.email') || '').trim();
        const nome = (get(req, 'body.nome') || '').trim();
        const senha = (get(req, 'body.senha') || '').trim();
        const confirmacaoSenha = (get(req, 'body.confirmacaoSenha') || '').trim();

        //Validations
        if (!validateEmail(email)) {
            res.status(400).json({
                erro: 'E-mail inválido.'
            });
            return;
        }

        if (!nome) {
            res.status(400).json({
                erro: 'Nome não indicado.'
            });
            return;
        }

        if (!senha) {
            res.status(400).json({
                erro: 'Senha não indicada.'
            });
            return;
        }

        if (!confirmacaoSenha) {
            res.status(400).json({
                erro: 'Confirmação de senha não indicada.'
            });
            return;
        }

        if (senha !== confirmacaoSenha) {
            res.status(400).json({
                erro: 'Senha e confirmação de senha devem ser iguais.'
            });
            return;
        }

        if (senha.length < 6) {
            res.status(400).json({
                erro: 'Senha deve ter no mínimo 6 caracteres.'
            });
            return;
        }

        const hash = bcrypt.hashSync(senha, 10);

        if (!hash) {
            res.status(400).json({
                erro: 'Senha inválida.'
            });
            return;   
        }

        app.db('usuarios')
            .whereRaw('LOWER(email) = LOWER(?)', email)
            .first()
            .then(usuario => {
                if (usuario) {
                    res.status(400).json({
                        erro: 'E-mail já cadastrado.'
                    });
                } else {
                    app.db('usuarios')
                        .insert({
                            email,
                            nome,
                            senha: hash
                        })
                        .then(val => {
                            res.status(204).send();
                        })
                        .catch(err => {
                            res.status(500).json({
                                erro: err.message
                            });
                        });
                }
            })
            .catch(err => {
                res.status(500).json({
                    erro: err.message
                });
            });
    }

    return { addUser };
}