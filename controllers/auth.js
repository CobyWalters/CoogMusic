const jwt = require('jsonwebtoken');
const mysql = require('sync-mysql');
const mysqladd = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const e = require('express');
const { async } = require('q');
const { promisify } = require ('util');
var moment = require('moment');
const fs = require('fs');
//const flash = require('connect-flash');

/* Middleware functions included:
exports.logout
exports.getAccount
exports.register
exports.updateArtistProfile
exports.updateUserProfile
exports.login
*/

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

//RUNNING QUERIES:
/* Need to use the ? notation to prevent SQL injections
ex 1)  db.query(`SELECT * FROM User WHERE user_name = ?`, [username]);
Basically aything that goes into the ? is whatt comes after the comma
so, can be reread as: `SELECT * FROM User WHERE user_name = username
Need to put the  stuff you're putting into the ? inside  [] => it's  an array

ex 2)  db2.query(`UPDATE User SET ? WHERE ?`, [{country: country}, {user_id: userId}]
Can be reread as: 
`UPDATE User SET country = country WHERE user_id  =  userId`
In this query, we use 2 ?'s. You can  use  as many ?'s as you want. They will be
filled in the order of the array:
[{country: country}, {user_id: userId}]
      1st ?              2nd  ?

Need to use {} notation as well because we are comparing it with the table columns
[{country: country},                                {user_id: userId}]
update country column with country                  where user_id (from db) is equal to our var userId


*/


///////////////////// LOGGING IN AND LOGGING OUT /////////////////////


exports.login  = (req, res) =>{

    //get information from the forms in the hbs files (user types in username and password)
    const{username, password} = req.body;   

    //If admin login,log in to the admin page
    if(username == 'admin' && password == 'admin'){
        //redirect to admin page
        return res.redirect('/admin_index');
    }

    //Check if username exists in the Artist or User table
    //Queries are returned as an array ex: [{username: X}]
    let results = db.query(`SELECT * FROM User WHERE user_name = ?`, [username]);
    let results2 = db.query(`SELECT * FROM Artist WHERE artist_name = ?`, [username]);

    //Username  doesn't exist in Artist or User table so account doesn't exist
    //Redirect to try logging in again
    //Sends a message to the hbs file. In the hbs file, you'll find an if that displays
    //the error message into a banner
    if(results.length <= 0 && results2.length <=0){
        console.log('DNE');
        return res.render('login', {
            message: 'Try again: Username or password do not match'
        });

    }else{

        //Else, username exists, but we don't know if it exists in the Artist or User table
        //So check manually. results = User table, results2 = Artist table

        //If User table is empty (less than or equal to 0 so username doesn't exist),
        //Then we know user exists in the Artist table so get user info from
        if(results.length <= 0){

            //results is empty so results2 has  user = we are  looking at ARTISTS

            //Create our cookie. Cookie will store the unique artist id and that it is of type Artist
            //Will store like: {id: ###, type: Artist}
            const token = jwt.sign({id: results2[0].artist_id, type: 'Artist'}, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_EXPIRES_IN} );

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //basically saying cookie will expire for like 90 days. 
                        //remember that cookie gets deleted when user logs out
                    ),
                    httpOnly: true
                }
                
                //The cookie is named 'account'. thus, account will have: account={id: ###, type: Artist}
                res.cookie('account', token, cookieOptions);
                return res.redirect('/artist_index'); //Redirect to the artist homepage

        }else{
            //Otherwise, account exists in the User table
            //Same thing as above, except now we specify type of User instead of Artist
            const token = jwt.sign({id: results[0].user_id, type: 'User'}, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_EXPIRES_IN} );

            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
                ),
                httpOnly: true
            }
            
            res.cookie('account', token, cookieOptions);
            return res.redirect('/user_index');
        }

    }
};

exports.logout = async (req, res)=>{
    //Create a cookie that overrides the account cookie that stores who you are
    //This new cookie expires quick (seconds)
    //So we fully log out and browser doesn't store user anymore

    res.cookie('account', 'logout',{
        expires: new Date(Date.now() + 2*1000),
        httpOnly:  true
    });
    res.redirect('/');

}

/////////---------------------------------------------------------/////

///////////////////// COOKIES MIDDLEWARE //////////////////////////////////////////

//Once you login or register,  a cookie  will be stored in your browser
//This function gets that cookie that's being stored, and gives  you the information
//of who's currently logged in

exports.getAccount = async (req, res, next) =>{
    if(req.cookies.account){    //if this cookie named 'account' exists
        try{
            //verify token
            const decoded  =  await promisify(jwt.verify)(req.cookies.account, process.env.TOKEN_SECRET);
            //Cookies are hashed, so we have to decode to get the original info we stored into the cookie
            //remember how cookie stores {id: ###, type: Artist or User}
            if(decoded.type == 'User'){
                //If the Cookie type stored a type of User, we want to look in the User table
                //check user
                //Remember we also store the user's id into the cookie, so that's how we get
                //decoded.id. Decoded is our cookie

                //We want to store everything about that account so browser knows who's logged in
                let results = db.query(`SELECT * FROM User WHERE user_id = ?`, [decoded.id]);
                //results is an array, so to get the single element we use results[0]
                //values are:
                //results[0].user_id, results[0].user_email, etc. use (.)+column names in database 
                //to access variables
                
                //This shouldn't run, but if the user id doesn't exist in the table, shouldn't do anything
                if(results <= 0){
                    console.log("DNE");
                    return next();
                //Need to return next so it goes to the next thing in the call (check page router)

                }

                //Store the user info into a variable named acc and send that with the req var.
                //We are sending the req.acc var to the router

                req.acc = results[0];
                return next();

            }else if(decoded.type == 'Artist'){
                //check musician
                //Same thing as above,  except now we look at Artist table

                let results = db.query(`SELECT * FROM Artist WHERE artist_id = ?`, [decoded.id]);
                if(results <= 0){
                    console.log("DNE");
                    return next(); //DNE
                }

                req.acc = results[0];
                return next();
            }


        }catch(error){
            console.log(error);
            return next();
        }
    }else{
        next();
    }
}

/////////---------------------------------------------------------///////////////

///////////////////// REGISTERING ACCOUNT /////////////////////////////
exports.register =  (req, res)=>{

    //req.body will have all the info we typed into the hbs template form (username, email, DOB, etc.)
    //used nottation const {xx} = req.body because i wanted to use the same variable names as the name and id's in the hbs template
    //you can also do let name = req.body.name, let username = req.body.username, etc.
    
    //If the form is empty, variable will be empty. Example: You're  a user, tthen the fb_url, etc. will be empty
    const { name, username, email, DOB, country, password, password2, biography, fb_url, ig_url, spotify_url, soundcloud_url, personal_url} = req.body;
    let isMusician = req.body.checkbox ? true : false //If the musician checkbox is checked, then we havve a musician
   //To register, you need 1) A unique username 2) Matching passwords

   //Username exists in User table, so bring them back to the page and tell them to
   //come up with another username
   //results = an array: [{user: xx}] so if the user exists, this query will have  1 item.
    //If user doesn't exist, query will return  nothing.
    let results = db.query(`SELECT user_name FROM User WHERE user_name = ?`, [username]);
    if(results.length > 0){
        return res.render('register', {
            message: 'Try again: That username is already in use by another user'
        });
    }

    //Same as above, but with Artist
    results = db.query(`SELECT artist_name FROM Artist WHERE artist_name = ?`, [username]);
    if(results.length > 0){
        return res.render('register', {
            message: 'Try again: That username is already in use by musician'
        });
    }

    //Passwords need to match
    if(password != password2){
        return res.render('register', {
            message: 'Try again: Passwords do not match'
        });
    }
 
    const uniqueId = uuidv4(); //generates unique id for  account

    //gets the age from the  DOB. getAge is a function that does all the math
    const getAge = birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10)
    const currAge = getAge(DOB);
    var date = new Date();
    var formatDate = moment(date).format('YYYY-MM-DD HH:MM:SS');

    const artist_id = 0; //SET TO 0 RN CHANGE LATER

    //Not a musician, so create a user account
    if(isMusician === false) {
        //Create  the user account and insert it into the database
        db2.query(`INSERT INTO User SET ?`, {artist_idF: artist_id, user_id: uniqueId, user_name: username, user_email: email, country: country, age: currAge , user_password: password, user_name_display: name, dateTime_created_user: formatDate});

        //Cookie stuff, same as before
        const token = jwt.sign({id: uniqueId, type: 'User'}, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_EXPIRES_IN} );

        const cookieOptions = {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        
        res.cookie('account', token, cookieOptions);
        return res.redirect('/successRegister_User');

    }else{
        //Create the musician account and insert it into the database
        var file_img = req.files.profilePic;
        //profile pic upload
        file_img.mv('public/artist_profilePics/'+file_img.name, function(err){
            db2.query(`INSERT INTO Artist SET ?`, {artist_id: uniqueId, artist_name: username, artist_email: email, country: country, background_link: '', website_url: personal_url, artist_password: password, artist_name_display: name, biography: biography, fb_url: fb_url, ig_url: ig_url, spotify_url: spotify_url, soundcloud_url: soundcloud_url, age: currAge, artist_profile_pic: file_img.name, dateTime_created_artist: formatDate});
        });

        //Cookie stuuff, same as before
        const token = jwt.sign({id: uniqueId, type: 'Artist'}, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_EXPIRES_IN} );
        
        const cookieOptions = {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        
        res.cookie('account', token, cookieOptions);
        
        return res.redirect('/successRegister_Artist');

    }   
        
}

/////////---------------------------------------------------------//////


///////////////////// UPDATING PROFILES /////////////////////////////
exports.updateArtistProfile = (req, res)=>{

    //Req.body will have all the info that's in the form that's to be updated
    //Will store all the info that the Artist wants updated
    const {name, email, DOB, country, password, password2, biography, fb_url, ig_url, spotify_url, soundcloud_url, personal_url, artistId} = req.body;
    const getAge = birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10)
    const currAge = getAge(req.body.DOB);


    //always update country 
    db2.query(`UPDATE Artist SET ? WHERE ?`, [{country: country}, {artist_id: artistId}], (err)=>{
        if(err){
            console.log('else');
            console.log(err);
        }
    });

    //If the name form is not empty, then the Artist wants to update their name
    //Thus, run the queries 
    if(name != ''){

        db2.query(`UPDATE Artist SET ? WHERE ?`, [{artist_name_display: name}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('name');
                console.log(err);
            }
        });
    }
    
    //If the email form is not empty, then the Artist wants to update their email
    //Thus, run the queries 
    if(email != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{artist_email: email}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('email');
                console.log(err);
            }
            
        });
    }

    //If the password form is not empty, then the Artist wants to update their password
    //Thus, run the queries 
    if(password != ''){

        //first check if the two updated passwords are the same
        //if not,  redirect them back to the edit profile page telling them their passwords didn't match
        if(password != password2){
            //You can only send messsages through the res.render. Since we want to
            //redirect them to the editArtistProfile (before you press the submit button),
            //we send a flash.  The flash is another dictionary called error.
            //flash = {error: Try again: Passwords do not match}
            //Flash can be acquired from  the pages route
            req.flash('error', 'Try again: Passwords do not match');
            return res.redirect('/editArtistProfile');
        }

        //Else,  update password
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{artist_password: password}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });
        
    }

    //Same logic as above
    if(biography != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{biography: biography}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    if(fb_url != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{fb_url: fb_url}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    if(ig_url != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{ig_url: ig_url}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    if(spotify_url != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{spotify_url: spotify_url}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    if(soundcloud_url != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{soundcloud_url: soundcloud_url}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    if(personal_url != ''){
        db2.query(`UPDATE Artist SET ? WHERE ?`, [{website_url: personal_url}, {artist_id: artistId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });

    }

    
    //Successfuully updated everything
    req.flash('success', 'Successfully updated information');
    return res.redirect('/editArtistProfile');

};

//Same as above
exports.updateUserProfile = (req, res)=>{
    const {name, email, DOB, country, password, password2, userId} = req.body;
    const getAge = birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10)
    const currAge = getAge(req.body.DOB);


    db2.query(`UPDATE User SET ? WHERE ?`, [{country: country}, {user_id: userId}], (err)=>{
        if(err){

            console.log(err);
        }
    });

    if(name != ''){

        db2.query(`UPDATE User SET ? WHERE ?`, [{user_name_display: name}, {user_id: userId}], (err)=>{
            if(err){
                console.log('name');
                console.log(err);
            }
            

        });

    }
    
    if(email != ''){

        db2.query(`UPDATE User SET ? WHERE ?`, [{user_email: email}, {user_id: userId}], (err)=>{
            if(err){
                console.log('email');
                console.log(err);
            }
            
        });
    }

    if(password != ''){

        if(password != password2){
            req.flash('error', 'Try again: Passwords do not match');
            return res.redirect('/editProfile');
        }

        db2.query(`UPDATE User SET ? WHERE ?`, [{user_password: password}, {user_id: userId}], (err)=>{
            if(err){
                console.log('pass');
                console.log(err);
            }
        });
        
    }

    
    req.flash('success', 'Successfully updated information');
    return res.redirect('/editProfile');

};
exports.countryReport = (req,res) => {
    
    let artists = db.query(`SELECT * FROM Artist`);
    req.flash('data', artists);
    return res.redirect('/countryReport');

};
exports.ageReport = (req,res) => {
    
    let artists = db.query(`SELECT * FROM Artist`);
    req.flash('data', artists);
    return res.redirect('/ageReport');

};
exports.filter = (req,res) => {
    
    let artists = db.query(`SELECT * FROM Artist`);
    req.flash('data', artists);
    return res.redirect('/filter');

};


/////////---------------------------------------------------------//////