create table usuarios
(
    id    int auto_increment
        primary key,
    nome  varchar(30)  not null,
    email varchar(100) not null,
    senha varchar(100) not null
);

create table arquivos
(
    id             int auto_increment
        primary key,
    id_usuario     int                                not null,
    nome           varchar(60)                        not null,
    mimetype       varchar(50)                        not null,
    tamanho        int                                not null,
    dt_modificacao datetime default CURRENT_TIMESTAMP not null,
    caminho        varchar(100)                       not null,
    constraint arquivos_ibfk_1
        foreign key (id_usuario) references usuarios (id)
);

create index id_usuario
    on arquivos (id_usuario);


