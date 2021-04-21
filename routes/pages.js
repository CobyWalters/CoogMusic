const express = require('express');
const router  = express.Router();
const dbService = require('../controllers/dbService');
const authController = require('../controllers/auth');

const mysql = require('sync-mysql');
const mysqladd = require('mysql2');
const e = require('express');

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


//Homepage
router.get('/', (req,res)=>{
    res.render('index');
});

//Register Page
router.get('/register', (req,res)=>{
    res.render('register');
});

//Login Page
router.get('/login', (req,res)=>{
    res.render('login');
});

//User Page
router.get('/getNotifications', authController.getAccount, (request, response) => {
    if(request.acc) {
        const db = dbService.getDbServiceInstance();
        var result = null;
        if (request.acc.user_id) {
            result = db.getUserNotifications(request.acc.user_id);
        } else if (request.acc.artist_id) {
            result = db.getUserNotifications(request.acc.artist_id);
        } /* else if (request.acc.admin_id) {
            const result = db.getAdminNotifications(request.acc.admin_id);
        }*/
        result
        .then(data => response.json({data : data}))
        .catch(err => console.log(err));
    } else{
        res.redirect('/login');
    }
});

router.get('/getSongDisplays', (request, response)=>{
    const db = dbService.getDbServiceInstance();
    const result = db.getSongDisplays();
    result
    .then(data => response.json({data : data}))
    .catch(err => console.log(err));
});

router.get('/getArtistSongs/:artist_name', (request, response)=>{
    const db = dbService.getDbServiceInstance();
    const result = db.getArtistSongs(request.params.artist_name);
    result
    .then(data => response.json({data : data}))
    .catch(err => console.log(err));
});

router.post('/updateCount', authController.getAccount, (request, response)=>{
    if(request.acc){
        //console.log("EENNNNN");
        const db = dbService.getDbServiceInstance();
        var result = null;
        if (request.acc.user_id) {
            result = db.updateCount('', request.acc.user_id, request.body.songId);
        } else if (request.acc.artist_id) {
            result = db.updateCount(request.acc.artist_id, '', request.body.songId);
        }
        //console.log('update done');
        
        result
        .then(data => response.json({data : data}))
        .catch(err => console.log(err));
        
    }else{
        res.redirect('/login');
    }

});

/*
USE OF COOKIES: authController.getAccount = the middleware function to  get the cookies
the getAccount exported function in the auth.js file in the CONTROLLERS folder.

how it works: if user/artist clicks on the edit profile button for example,
will first go to the middleware function that gets the cookies from the browser.
(whenever you login or register, a cookie will be registered automatically)
This cookie is called req.acc
req.acc will contain the identifying info of the user or artist's id and ttheir type (user or artist)
Useful because since we now have their id, we can access their stuff in the database/
req.acc will give us everything in the arttist or user table associated with that id.
Ex- req.acc (we are looking at artists) will give us all their info from the table
such as their display name, username, social media links, etc.

*/

//////////////// ARTIST PAGE ////////////////
router.get('/editArtistProfile', authController.getAccount, (req, res)=>{
    if(req.acc){
        //get the cookie info and store it in a variable named acc.
        //Then in the hbs files, we can get the info using {{acc.artist_name}}, etc.
        //error and success are flashes sent by the edit artist profile function in the auth.js file in
        //the CONTROLLERS folder. Error = passwords dont match, etc. 
        //It gets put in here as well because when you press submit (to  edit your info),
        //it goes to /auth/editArtistProfile => redirects back to /editArtistProfile when
        //finished updating or it catches an error

        res.render('editArtistProfile', {acc: req.acc, error: req.flash('error'), success: req.flash('success')});
    }else{
        res.redirect('/login');
    }
});

router.get('/viewReportsArtist', authController.getAccount, (req, res)=>{
    if(req.acc){
        let songs = db.query(`SELECT * FROM Song WHERE artist_idB = ?`,[req.acc.artist_id]);
        var moreThanOneSong = false;
        if(songs.length > 1){
            moreThanOneSong = true;
        }
        res.render('viewReportsArtist', {acc: req.acc, songData: songs, moreThanOneSong: moreThanOneSong});
    }else{
        res.redirect('/login');
    }
});

router.post('/songInsights', authController.getAccount, (req, res)=>{
    if(req.acc){
        var songData;
        if(req.body.dataGroups == 'All of my songs'){
            songData = db.query(`SELECT * FROM Song WHERE artist_idB = ?`,[req.acc.artist_id]);
        }else{
            songData = db.query(`SELECT * FROM Song WHERE song_name = ? AND artist_idB = ?`,[req.body.dataGroups, req.acc.artist_id]);
        }
        res.render('songInsights', {acc: req.acc, formData: req.body, songData: songData});
    }else{
        res.redirect('/login');
    }
});


router.get('/successRegister_Artist', authController.getAccount, (req, res)=>{
    if(req.acc){
        res.render('successRegister_Artist', {acc: req.acc});
    }else{
        res.redirect('/login');
    }
});


router.get('/artist_index', authController.getAccount, (req, res)=>{
    if(req.acc){
        res.render('artist_index', {acc: req.acc});
    }else{
        res.redirect('/login');
    }
});

//Upload Music

router.get('/uploadMusic', authController.getAccount, (req, res) =>{

    if(req.acc){
        res.render('uploadMusic', {acc: req.acc});
    }else{
        res.redirect('/login');
    }
});


////////////////////////////////////////////////


//////////////// USER PAGE ////////////////////////////////

router.get('/successRegister_User', authController.getAccount, (req, res)=>{

    if(req.acc){
        res.render('successRegister_User', {acc: req.acc});
    }else{
        res.redirect('/login');
    }

});

router.get('/user_index', authController.getAccount, (req, res)=>{
    if(req.acc){
        res.render('user_index', {acc: req.acc});
    }else{
        res.redirect('/login');
    }
});

router.get('/viewArtists', authController.getAccount, (req, res)=>{
    if(req.acc){
        let artists = db.query(`SELECT * FROM Artist`);
        res.render('viewArtists', {acc: req.acc, artistData: artists});
    }else{
        res.redirect('/login');
    }
});

router.get('/editProfile', authController.getAccount, (req, res)=>{
    if(req.acc){
        res.render('editProfile', {acc: req.acc, error: req.flash('error'), success: req.flash('success')});
    }else{
        res.redirect('/login');
    }
});

//User just clicked the artist profile OR they clicked the follow or unfollow button
router.post('/artistProfile/:artistId', authController.getAccount, (req, res)=>{
    if(req.acc){
        //get artist info
        const artist_id = req.params.artistId;
        let artistInfo = db.query(`SELECT * FROM Artist WHERE artist_id = ?`,[artist_id]);
        var following = false;

        //IF A USER -> has power to follow
        if(req.acc.user_id){
            //Check if following
            let checkFollowing = db.query(`SELECT idfollow FROM Follow WHERE followed_by_user_id = ? AND following_artist_id = ?`, [req.acc.user_id, artistInfo[0].artist_id]);
            
            if(checkFollowing.length == 1){
                //user is following
                following = true;

                if(req.body.pressedUnfollow == ''){
                    db2.query(`DELETE FROM Follow WHERE ? AND ?`,[{followed_by_user_id: req.acc.user_id} , {following_artist_id: artistInfo[0].artist_id}]);

                    //need to recall a query to update follower count
                    artistInfo = db.query(`SELECT * FROM Artist WHERE artist_id = ?`,[artist_id]);
                    following = false;
                }
            }else if(req.body.pressedFollow == ''){
                db2.query(`INSERT INTO Follow SET ?`, {followed_by_user_id: req.acc.user_id, following_artist_id: artistInfo[0].artist_id});
                
                //need to recall a query to update follower count
                artistInfo = db.query(`SELECT * FROM Artist WHERE artist_id = ?`,[artist_id]);
                //console.log('CLOUT COUNT: '+ artistInfo[0].followerCount);
                following = true;
            }

            res.render('artistProfile', {acc: req.acc, artistData: artistInfo[0], following: following});
        }else{
            //is an artistt
            res.render('artistProfile', {acc: req.acc, artistData: artistInfo[0]});
        }

    }else{
        res.redirect('/login');
    }
});


////////////////////////////////////////////////

//////////////// ADMIN PAGE ////////////////////////////////
router.get('/viewUsers', (req, res)=>{
    let users = db.query(`SELECT * FROM User`);
    //console.log(users.length); 
    res.render('viewUsers',{userData: users, count: users.length});
});

router.get('/viewArtistsAdmin', (req, res)=>{
    let artists = db.query(`SELECT * FROM Artist`)
    res.render('viewArtistsAdmin',{artistData: artists, count: artists.length});
});

router.get('/viewSongsAdmin', (req, res)=>{
    let songs = db.query(`SELECT * FROM Song`)
    res.render('viewSongsAdmin',{songData: songs, count: songs.length});
});

router.post('/viewCMActivity', (req, res)=>{
    //req.body = has dataGroups, activityYear, dateStart, dateEnd
        /*
    let users = db.query(`SELECT * FROM User WHERE dateTime_created_user >= ? AND dateTime_created_user < ?`,[startDate, endDate]);
    let artists = db.query(`SELECT * FROM Artist WHERE dateTime_created_artist >= ? AND dateTime_created_artist < ?`,[startDate, endDate]);
    let songs = db.query(`SELECT * FROM Song WHERE release_date >= ? AND release_date < ?`,[req.body.dateStart, req.body.dateEnd]);
    */
    const startDate = req.body.dateStart + ' 00:00:00';
    const endDate = req.body.dateEnd + ' 23:59:59';
    var users;
    var userCount = 0;
    var artists;
    var artistCount = 0;
    var songs;
    var songCount = 0;

    if(req.body.dataGroups == 'User'){
        users = db.query(`SELECT * FROM User WHERE dateTime_created_user >= ? AND dateTime_created_user < ? ORDER BY dateTime_created_user ASC`,[startDate, endDate]);
        userCount = users.length;

    }else if(req.body.dataGroups == 'Musician'){
        artists = db.query(`SELECT * FROM Artist WHERE dateTime_created_artist >= ? AND dateTime_created_artist < ? ORDER BY dateTime_created_artist ASC`,[startDate, endDate]);
        artistCount = artists.length;

    }else if(req.body.dataGroups == 'All accounts (User and Musician)'){
        users = db.query(`SELECT * FROM User WHERE dateTime_created_user >= ? AND dateTime_created_user < ? ORDER BY dateTime_created_user ASC`,[startDate, endDate]);
        artists = db.query(`SELECT * FROM Artist WHERE dateTime_created_artist >= ? AND dateTime_created_artist < ? ORDER BY dateTime_created_artist ASC`,[startDate, endDate]);
        userCount = users.length;
        artistCount = artists.length;

    }else if(req.body.dataGroups == 'Song'){
        songs = db.query(`SELECT * FROM Song WHERE release_date >= ? AND release_date < ? ORDER BY release_date ASC`,[req.body.dateStart, req.body.dateEnd]);
        songCount = songs.length;

    }else if(req.body.dataGroups == 'Song and Musician'){
        songs = db.query(`SELECT * FROM Song WHERE release_date >= ? AND release_date < ? ORDER BY release_date ASC`,[req.body.dateStart, req.body.dateEnd]);
        artists = db.query(`SELECT * FROM Artist WHERE dateTime_created_artist >= ? AND dateTime_created_artist < ? ORDER BY dateTime_created_artist ASC`,[startDate, endDate]);
        artistCount = artists.length;
        songCount = songs.length;

    }else if(req.body.dataGroups == 'Song and User'){
        songs = db.query(`SELECT * FROM Song WHERE release_date >= ? AND release_date < ? ORDER BY release_date ASC`,[req.body.dateStart, req.body.dateEnd]);
        users = db.query(`SELECT * FROM User WHERE dateTime_created_user >= ? AND dateTime_created_user < ? ORDER BY dateTime_created_user ASC`,[startDate, endDate]);
        userCount = users.length;
        songCount = songs.length;

    }else if(req.body.dataGroups == 'Song and all accounts (User and Musician)'){
        users = db.query(`SELECT * FROM User WHERE dateTime_created_user >= ? AND dateTime_created_user < ? ORDER BY dateTime_created_user ASC`,[startDate, endDate]);
        artists = db.query(`SELECT * FROM Artist WHERE dateTime_created_artist >= ? AND dateTime_created_artist < ? ORDER BY dateTime_created_artist ASC`,[startDate, endDate]);
        songs = db.query(`SELECT * FROM Song WHERE release_date >= ? AND release_date < ? ORDER BY release_date ASC`,[req.body.dateStart, req.body.dateEnd]);
        artistCount = artists.length;
        userCount = users.length;
        songCount = songs.length;

    }

    

    res.render('viewCMActivity', {formData: req.body, userData: users, userCount: userCount, artistData: artists, artistCount: artistCount, songData: songs, songCount: songCount});
});

router.get('/create_report', (req, res) =>{
    console.log('Get');
    res.render('create_report');
});
router.get('/hourReport', (req, res) =>{
    console.log('Get');
    res.render('hourReport');
});

router.get('/countryReport', authController.getAccount, (req, res)=>{
    if(req.acc){
        let artists = db.query(`SELECT * FROM Artist`);
        let countries = db.query(`SELECT DISTINCT country FROM Artist`);
        let nArtists = db.query(`SELECT COUNT(*) FROM Artist`);
        n = countries.length;
        countries.forEach(country => {
            nArtistsC = db.query(`SELECT COUNT (*) FROM Artist WHERE country = `+`'`+country.country+`'`);
            percentage = nArtistsC/nArtists*100
            country.number = JSON.stringify(nArtistsC);  
            
        });
        
        res.render('countryReport', {acc: req.acc, artistData: artists, country: countries});
    }else{
        res.redirect('/login');
    }
});

router.get('/ageReport', authController.getAccount, (req, res) =>{
    if(req.acc){
        let artists = db.query(`SELECT * FROM Artist`);
        let groups = ['-18','18-25','26-35','36-45','46-55','56-65','65+'];
        let ageN = [];
        ageN[0] = db.query(`SELECT COUNT(*) FROM Artist WHERE age < 18`);
        ageN[1] = db.query(`SELECT COUNT(*) FROM Artist WHERE age BETWEEN 18 AND 25`);
        ageN[2] = db.query(`SELECT COUNT(*) FROM Artist WHERE age BETWEEN 26 AND 35`);
        ageN[3] = db.query(`SELECT COUNT(*) FROM Artist WHERE age BETWEEN 36 AND 45`);
        ageN[4] = db.query(`SELECT COUNT(*) FROM Artist WHERE age BETWEEN 46 AND 55`);
        ageN[5] = db.query(`SELECT COUNT(*) FROM Artist WHERE age BETWEEN 56 AND 65`);
        ageN[6] = db.query(`SELECT COUNT(*) FROM Artist WHERE age > 65`);
        
        ageN[0] = JSON.stringify(ageN[0]);
        ageN[1] = JSON.stringify(ageN[1]);
        ageN[2] = JSON.stringify(ageN[2]);
        ageN[3] = JSON.stringify(ageN[3]);
        ageN[4] = JSON.stringify(ageN[4]);
        ageN[5] = JSON.stringify(ageN[5]);
        ageN[6] = JSON.stringify(ageN[6]);
        
        

        res.render('ageReport', {acc: req.acc, artistData: artists, group: groups, ageNum: ageN});
    }else{
        res.redirect('/login');
    }
});

router.get('/filter',authController.getAccount, (req, res) =>{
    console.log('Get');
    if(req.acc){
        let artists = db.query(`SELECT * FROM Artist`);
        res.render('filter', {acc: req.acc, artistData: artists});
    }else{
        res.redirect('/login');
    }
});

router.get('/viewReportsAdmin', (req, res)=>{
    res.render('viewReportsAdmin');
});

router.get('/admin_index', (req, res)=>{
    res.render('admin_index');
});

module.exports = router;
