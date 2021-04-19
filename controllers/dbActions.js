const jwt = require('jsonwebtoken');
const mysql = require('sync-mysql');
const mysqladd = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const e = require('express');
const { async } = require('q');
const { promisify } = require ('util');
//const flash = require('connect-flash');

/* Middleware functions included:
exports.viewUsers
exports.viewArtists

*/



//database
const db = new mysql({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT 
});

const db2 = mysqladd.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT 
});

///////////////////// SELECT ALL ARTISTS AND USERS /////////////////////

//----------> ADMIN
exports.viewUsers = (req, res)=>{

    //Selects literally every user in the User table
    let users = db.query(`SELECT * FROM User`);

    //recall how to send data through redirects, we need to use flash
    //check routes pages to see how data is collected
    //Sending back {data: users} where data is just the name and where users is all the users data 
    //in the User table
    req.flash('data', users);
    return res.redirect('/viewUsers');
}

exports.viewArtistsAdmin = (req, res)=>{
    //same as aboev, but selects every Artist
    let artists = db.query(`SELECT * FROM Artist`);
    req.flash('data', artists);
    return res.redirect('/viewArtistsAdmin');
}

//----------> USERS
exports.viewArtists = (req, res)=>{
    //same as aboev, but selects every Artist
    let artists = db.query(`SELECT * FROM Artist`);
    req.flash('data', artists);
    return res.redirect('/viewArtists');
}

//----------> SONGS
function getSongs(){
    let songs = db.query(`SELECT * FROM Song`);
    return songs;

}

module.exports.getSongs = getSongs;
/////////---------------------------------------------------------/////
