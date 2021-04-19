const mysql = require('mysql2');
const dotenv = require('dotenv');
var moment = require('moment');
let instance = null;
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT 
});

connection.connect((err) => {
    if (err) {
        console.log(err.message);
    }
    console.log('db ' + connection.state);
});

class DbService {

    static getDbServiceInstance() {
        return instance ? instance : new DbService();
    }

    async getUserNotifications(id) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = `SELECT * FROM Notification WHERE user_id=\"${id}\" OR header_text=\"Sponsored\"`;
                console.log(query);
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getAdminNotifications(id) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT * FROM Notification WHERE user_id=id OR header_text=\"Needs Verification\"";
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getArtistSongs(artist_name) {

        try {
            const response = await new Promise((resolve, reject) => {
                const query = `SELECT song_id, song_name, artist_name, song_audio_path, song_img_path, plays FROM Song WHERE artist_name=\"${artist_name.substring(1)}\"`;
                console.log(query);
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async getSongDisplays() {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT song_id, song_name, artist_name, song_audio_path, song_img_path, plays FROM Song;";
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async updateCount(artistId, userId, songId)
    {
        //artistId or userId = person logged on, using cookies
        //console.log(artistId + ' X ' + userId + ' Y ' + songId);
        if(userId){
            //console.log("user logged in");
            try {
                const response = await new Promise((resolve, reject) => {
                    var date = new Date();
                    var formatDate = moment(date).format('YYYY-MM-DD HH:MM:SS');
                    //console.log("dont unformat for: " + formatDate);
                    //const query = `INSERT INTO PlayTracker (played_by_artist_id, dateTime_Play, song_by_artist_id) VALUES (\"${artistId}\", ${formatDate}, \"${songId}\")`;
                    
                    
                    connection.query(`INSERT INTO countPlays SET ?`,{played_by_user_id: userId, song_id_played: songId, dateTime_Play: formatDate}, (err, results) => {
                        if (err) reject(new Error(err.message));
                        resolve(results);
                    })
                    
                   
                });
                //return response;
            } catch (error) {
                console.log(error);
            }
            
        }else if(artistId){
            //console.log("artist logged");
            try {
                const response = await new Promise((resolve, reject) => {
                    var date = new Date();
                    var formatDate = moment(date).format('YYYY-MM-DD HH:MM:SS');
                    //console.log("ff: " + formatDate);
                    //const query = `INSERT INTO PlayTracker (played_by_artist_id, dateTime_Play, song_by_artist_id) VALUES (\"${artistId}\", ${formatDate}, \"${songId}\")`;
                    
                    
                    connection.query(`INSERT INTO countPlays SET ?`,{played_by_artist_id: artistId, song_id_played: songId, dateTime_Play: formatDate}, (err, results) => {
                        if (err) reject(new Error(err.message));
                        resolve(results);
                    })
                    
                   
                });
                //return response;
            } catch (error) {
                console.log(error);
            }

        }


    }
}

module.exports = DbService;