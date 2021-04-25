const jwt = require('jsonwebtoken');
const mysql = require('sync-mysql');
const mysqladd = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const e = require('express');
const fs = require('fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const mp3Duration = require('mp3-duration');
const getmp3Duration = require('get-mp3-duration');
const { count } = require('console');
const math = require('mathjs');

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
    var release_Date= post.releaseDate;
    var artistId = post.artistId;
    var genre = post.genre;
    
    // Data Validation
    if (!post.songName){
        req.flash('message', "Please Enter Song Name")
        return res.redirect('/uploadMusic');
    }

    if (!post.releaseDate){
        req.flash('message', "Please Enter Release Date")
        return res.redirect('/uploadMusic');
    }

    if (post.genre == 'Select Genre'){
        req.flash('message', "Please Enter Genre")
        return res.redirect('/uploadMusic');
    }

    if (req.files.songMP3 == undefined){
        req.flash('message', "No mp3 files were uploaded!")
        return res.redirect('/uploadMusic');

    }else if(req.files.songImg == undefined){
        req.flash('message', "No Image files were uploaded!")
        return res.redirect('/uploadMusic');
    }
    else if(!req.files){
        req.flash('message', "No files were uploaded!")
        return res.redirect('/uploadMusic');
    }

    //data valadation for duplicate songs
    songCheck = db.query(`SELECT song_name FROM Song WHERE song_name = ? AND artist_name_display = ?`,[song_Name, artist_Name]);
    if(songCheck.length > 0){
        if(songCheck[0].song_name == song_Name){
            req.flash('message', "Song Has Already Been Uploaded")
            return res.redirect('/uploadMusic');
        }
    }
  
    //requested files from artist
    var file_Img = req.files.songImg;
    var img_name = file_Img.name;
    var file_Audio = req.files.songMP3;
    var audio_name = file_Audio.name;

    // generate songId
    var songId = uuidv4();

    // rename files
    var song_audio_path = songId + "." + "mp3";
    var song_img_path = songId + "." + "png";
  

    //invert slashes in path
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
    
    //Query genreid from genre table
    var genre_idB = db.query(`SELECT genre_id FROM Genre WHERE genre_name = ?`, [genre]);
    var genre_idB = genre_idB[0].genre_id;
    var plays = 0;

    //foreign keys = genre_idB, album_idB, artist_idB
    //check if img is of type jpg or png
    if(file_Img.mimetype == "image/jpeg" || file_Img.mimetype == "image/png" ){

        //upload audio file to remote folder
        file_Audio.mv('public/song_audio/'+file_Audio.name, function(err){
            if(err)
                return res.status(500).send(err);
        });
        // get audio file path
        var path = require('path').dirname(__dirname);

        //get song duration 
        const buffer = fs.readFileSync(invertSlashes(path)+"/public/song_audio/"+file_Audio.name);
        
        var duration = getmp3Duration(buffer);
        duration = duration/1000;

        //upload image file to remote folder                 
        file_Img.mv('public/song_images/'+ file_Img.name, function(err) {
                            
            if (err) {
                return res.status(500).send(err);
            }

            db2.query(`INSERT INTO Song SET ?`,{song_name: song_Name, artist_idB: artistId, artist_name_display: artist_Name, genre_idB: genre_idB, song_id: songId, release_date: release_Date, song_duration: duration, plays: plays, song_audio_path: song_audio_path, song_img_path: song_img_path});

        });
        // get path for image and audio files and rename using unique id
        var path = require('path').dirname(__dirname);
        fs.rename(invertSlashes(path)+"/public/song_audio/"+audio_name, invertSlashes(path)+"/public/song_audio/" + songId + ".mp3", function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });
        
        fs.rename(invertSlashes(path)+"/public/song_images/"+img_name, invertSlashes(path)+"/public/song_images/" + songId + ".png", function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });
        
        req.flash('message', "Song Was Uploaded")
        return res.redirect('/uploadMusic');

    } else {
        //data valadation
        req.flash('message', "This format is not allowed , please upload file with '.png','.jpg'")
        return res.redirect('/uploadMusic');

    }
    
};

exports.delete = (req, res) =>{
    var post = req.body;
    var songName = post.songName;
    var artistName= post.artistName;

    //delete foreign constraint from plays tablePlays
    var songId = db.query(`SELECT song_id FROM Song WHERE song_name = ?`, [songName]);
    // data valadation
    if (songId == 0){
        req.flash('message2', "Song Name was left empty or Song has not been uploaded yet")
        return res.redirect('/uploadMusic');
    }
    // get countplays from plays table
    var countPlays = db.query(`SELECT Plays From Song WHERE song_name = ? AND song_Id = ?`,[songName, songId[0].song_id]);
    var delete_song = db.query(`SELECT song_id From Song WHERE song_name = ? AND Plays=?`,[songName, countPlays[0].Plays]);
    db2.query(`DELETE FROM countPlays WHERE song_id_Played = ?`, [delete_song[0].song_id])

    //Delete from song from song table
    let sqlDeleteSongs = `DELETE FROM Song WHERE song_name = ? AND artist_name_display = ?`;
    db2.query(sqlDeleteSongs, [songName, artistName], (err, result, field) =>{
        if(err){
            req.flash('message2', "Song Name was left empty or Song has not been uploaded yet");
            return res.redirect('/uploadMusic');
        }
        else{
            //invert slashes in path
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
            
            // //Delete files from server
            var path = require('path').dirname(__dirname);
            
            //Delete image files
            try {
            fs.unlinkSync(invertSlashes(path)+"/public/song_images/" + songId[0].song_id+ ".png");
            console.log("Successfully deleted the image file.")
            } catch(err) {
            throw err
            }
            // delete audio files
            try {
                fs.unlinkSync(invertSlashes(path)+"/public/song_audio/" + songId[0].song_id+ ".mp3");
                console.log("Successfully deleted the audio file.")
                } catch(err) {
                throw err
                }
            req.flash('message2', "Song Was Deleted");
            return res.redirect('/uploadMusic');
        }
    });
};
