const mysql = require('mysql2');
const dotenv = require('dotenv');
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

    async getSongDisplays() {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT song_id, song_name, artist_name, song_audio_path, song_img_path FROM Song;";
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
}

module.exports = DbService;