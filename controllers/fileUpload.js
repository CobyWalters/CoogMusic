const jwt = require('jsonwebtoken');
const mysql = require('sync-mysql');
const mysqladd = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const e = require('express');
const fs = require('fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const mp3Duration = require('mp3-duration');
const getmp3Duration = require('get-mp3-duration');

//use db for queries, don't need to update anything
const db = new mysql({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT 
});

//use db2 if need to update the actual database (registering account, updating info, etc.)
const db2 = mysqladd.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT 
});


exports.upload = function(req, res){
    var post  = req.body;
    var song_Name= post.songName;
    var artist_Name= post.artistName;
    var album_Name= post.albumName;
    var release_Date= post.releaseDate;
    var artistId = post.artistId;
    var genre = post.genre;

    if (!req.files){
        message = "No files were uploaded!";
        res.render('uploadMusic.hbs',{message: message});
    }

    
    
    //get file stuff
    var file_Img = req.files.songImg;
    var img_name = file_Img.name;
    var file_Audio = req.files.songMP3;
    var audio_name = file_Audio.name;


    //get song duration 
    //const buffer = fs.readFileSync('/Users/Student/Desktop/CoogMusic/CoogMusic/public/song_audio/'+audio_name);
    //var duration = getmp3Duration(buffer);
    //duration = duration/1000;
  


    // generate songId
    var songId = uuidv4();

    // rename files
    var song_audio_path = songId + "." + "mp3";
    if (file_Img.mimetype == "image/jpeg"){
        var song_img_path = songId + "." + "jpeg";
    }
    else{
        var song_img_path = songId + "." + "png";
    }

    const invertSlashes = str => {
        let res = '';
        for(let i = 0; i < str.length; i++){
           if(str[i] !== '\\'){
              res += str[i];
              continue;
           };
           res += '/';
        };
        return res;
    };

    // get audio file path
    var path = require('path').dirname(__dirname);
    path = path.substr(2);
    console.log(invertSlashes(path));

    fs.rename(invertSlashes(path)+"/public/song_audio/"+audio_name, invertSlashes(path)+"/public/song_audio/" + song_audio_path, function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });

    fs.rename(invertSlashes(path)+"/public/song_images/"+img_name, invertSlashes(path)+"/public/song_images/" + song_img_path, function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });
    
    
    //assign table values
    var genre_idB = db.query(`SELECT genre_id FROM Genre WHERE genre_name = ?`, [genre]);
    var genre_idB = genre_idB[0].genre_id;

    var plays = 0;

    //foreign keys = genre_idB, album_idB, artist_idB

    if(file_Img.mimetype == "image/jpeg" || file_Img.mimetype == "image/png" ){

        
        file_Audio.mv('public/song_audio/'+file_Audio.name, function(err){
            if(err)
                return res.status(500).send(err);

            
        });

        // get audio file path
        var path = require('path').dirname(__dirname);
        path = path.substr(2);
        console.log(invertSlashes(path));

        //get song duration 
        const buffer = fs.readFileSync(invertSlashes(path)+"/public/song_audio/"+audio_name);
        
        var duration = getmp3Duration(buffer);
        duration = duration/1000;
        // duration = 0
        // console.log(duration);


                                    
        file_Img.mv('public/song_images/'+ file_Img.name, function(err) {
                            
            if (err) {
                return res.status(500).send(err);
            }

            db2.query(`INSERT INTO Song SET ?`,{song_name: song_Name, artist_idB: artistId, artist_name: artist_Name, genre_idB: genre_idB, song_id: songId, release_date: release_Date, song_duration: duration, plays: plays, song_audio_path: song_audio_path, song_img_path: song_img_path});

        });

    

        return res.render('uploadMusic', {
            message: 'Song was Uploaded'
        })
        

    }else{
        message = "This format is not allowed , please upload file with '.png','.jpg'";
        res.render('uploadMusic',{message: message});
    }
    
};

exports.delete = (req, res) =>{
    var post = req.body;
    var song_name = post.songName;
    var artist_Name= post.artistName;

    db2.query(`DELETE FROM Song WHERE song_name = ? AND artist_name = ?`, [song_name, artist_Name], (err, result, field) =>{
        if(err){
            return res.render('register', {
                message: 'Try again: That username is already in use by another user'
            });
        }
        else{
            return res.render('uploadMusic', {
                message2: 'Song was Deleted'
            })
        }
    });
};
