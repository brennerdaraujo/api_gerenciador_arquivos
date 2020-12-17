/**
 * Arquivo que lida com as funções relacioandas aos arquivos.
 */

const bcrypt = require('bcrypt');
const moment = require('moment');
const fs = require('fs');
const { get } = require('lodash');
const { validateEmail } = require('../functions');
const { diretorioArquivos } = require('../consts');

module.exports = app => {

    // Função que adiciona ou substitui informações do arquivo no banco de dados
    const addOrUpdateFile = (arquivo) => {
        return new Promise((resolve, reject) => {
            const nome = (get(arquivo, 'nome') || '').trim();
            const caminho = (get(arquivo, 'caminho') || '').trim();
            const mimetype = (get(arquivo, 'mimetype') || '').trim();
            const idUsuario = get(arquivo, 'idUsuario') || 0;
            const tamanho = get(arquivo, 'tamanho') || 0;

            //Validations
            if (!nome) {
                reject(new Error('Nome do arquivo não indicado.'));
                return;
            }

            if (!caminho) {
                reject(new Error('Caminho do arquivo não indicado.'));
                return;
            }

            if (!mimetype) {
                reject(new Error('Tipo do arquivo não indicado.'));
                return;
            }

            if (tamanho <= 0) {
                reject(new Error('Tamanho do arquivo inválido.'));
                return;
            }

            if (idUsuario <= 0) {
                reject(new Error('Usuário inválido.'));
                return;
            }

            app.db('arquivos')
                .whereRaw('nome = ?', nome)
                .whereRaw('caminho = ?', caminho)
                .whereRaw('id_usuario = ?', idUsuario)
                .first()
                .then(arquivo => {
                    const data = {
                        mimetype,
                        tamanho,
                        dt_modificacao: moment().toDate()
                    };

                    if (arquivo) {
                        app.db('arquivos')
                            .where({ id: arquivo.id })
                            .update(data)
                            .then(() => {
                                resolve();
                                return;
                            })
                            .catch(err => {
                                reject(new Error(err.message));
                                return;
                            });
                    } else {
                        app.db('arquivos')
                            .insert({
                                ...data,
                                caminho,
                                nome,
                                id_usuario: idUsuario
                            })
                            .then(() => {
                                resolve();
                                return;
                            })
                            .catch(err => {
                                reject(new Error(err.message));
                                return;
                            });
                    }
                })
                .catch(err => {
                    reject(new Error(err.message));
                    return;
                });
        })
    }

    // Função que lê todos os arquivos do usuário logado
    const getFiles = (req, res) => {
        const idUsuario = get(req, 'user.id') || '';
        const ordenarPor = get(req, 'query.ordenarPor') || 'dt_modificacao';
        const asc = get(req, 'query.asc') || 'false';

        if (!idUsuario) {
            res.status(400).json({
                erro: 'Usuário não encontrado.'
            });
            return;
        }

        if (!ordenarPor) {
            res.status(400).json({
                erro: 'Parâmetro "ordenarPor" inválido.'
            });
            return;
        }

        if (!['true', 'false'].includes(asc)) {
            res.status(400).json({
                erro: 'Parâmetro "asc" inválido.'
            });
            return;
        }

        app.db('arquivos')
            .select('*')
            .whereRaw('id_usuario = ?', idUsuario)
            .orderBy(ordenarPor, asc === 'true' ? 'asc' : 'desc')
            .then(rows => {
                const arquivos = rows.map(row => {
                    return {
                        nome: row.nome,
                        mimetype: row.mimetype,
                        tamanho: row.tamanho,
                        dtModificacao: moment(row.dt_modificacao).format('YYYY-MM-DD HH:mm:ss')
                    };
                });

                res.status(200).json({
                    arquivos
                });
            })
            .catch((err) => {
                res.status(500).json({
                    erro: err.message
                });
            });
    }


    // Função que faz upload de arquivos
    const uploadFiles = (req, res) => {
        const arquivos = Object.values(req.files || {});

        if (!arquivos.length) {
            res.status(400).json({
                erro: 'Nenhum arquivo indicado.'
            });
            return;
        }

        const idUsuario = get(req, 'user.id') || '';

        if (!idUsuario) {
            res.status(400).json({
                erro: 'Usuário não encontrado.'
            });
            return;   
        }

        const now = moment().format('YYYYMMDD');
        const dirArquivos = `${diretorioArquivos}/${idUsuario}/${now}`;
        const arquivosErros = [];

        fs.promises.mkdir(dirArquivos, { recursive: true })
            .then(async () => {
                for (const arquivo of arquivos) {
                    try {
                        await arquivo.mv(`${dirArquivos}/${arquivo.name}`);
                        await addOrUpdateFile({
                            nome: arquivo.name,
                            mimetype: arquivo.mimetype,
                            tamanho: arquivo.size,
                            caminho: dirArquivos,
                            idUsuario
                        });
                    } catch(err) {
                        arquivosErros.push({
                            arquivo: arquivo.name,
                            erro: err.message
                        });
                    }
                }

                if (arquivosErros.length) {
                    res.status(400).json({
                        erros: arquivosErros
                    });
                } else {
                    res.status(204).send();
                }
            })
            .catch((err) => {
                res.status(500).json({
                    erro: err.message
                });
            });
    }

    // Função que faz o download de determinado arquivo
    const downloadFile = (req, res) => {
        const idUsuario = get(req, 'user.id') || '';
        const filename = (get(req, 'params.nome') || '').trim();
        const date = (get(req, 'body.data') || '').trim();

        if (!idUsuario) {
            res.status(400).json({
                erro: 'Usuário não encontrado.'
            });
            return;   
        }

        if (!filename) {
            res.status(400).json({
                erro: 'Arquivo não indicado.'
            });
            return;   
        }

        let query = app.db('arquivos')
            .whereRaw('nome = ?', filename)
            .whereRaw('id_usuario = ?', idUsuario);

        if (date) {
            const dateFormat = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
            const dirArquivo = `${diretorioArquivos}/${idUsuario}/${dateFormat}`;

            query = query
                .whereRaw('caminho = ?', dirArquivo);
        }

        query
            .orderBy('dt_modificacao', 'desc')
            .first()
            .then(arquivo => {
                if (arquivo) {
                    const filePath = `${arquivo.caminho}/${filename}`;

                    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                    res.setHeader('Content-type', arquivo.mimetype);

                    const filestream = fs.createReadStream(filePath);
                    filestream.pipe(res);
                } else {
                    res.status(404).json({
                        erro: 'Arquivo não encontrado.'
                    });
                }
            })
            .catch(err => {
                res.status(500).json({
                    erro: err.message
                });
            });
    }

    return { downloadFile, getFiles, uploadFiles };
}