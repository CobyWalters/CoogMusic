document.addEventListener('DOMContentLoaded', function () {
    fetch('http://localhost:5000/getSongDisplays')
        .then(response => response.json())
        .then(data => loadExplorePane(data['data']));
});

document.getElementById("search-bar").addEventListener('input', filterSongs);

function timeSince(date) {

    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const then = date.split(/[-T :]/);
    const now = new Date();
    const utc1 = Date.UTC(then[0], then[1] - 1, then[2]);
    const utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const day_diff = Math.floor((utc2 - utc1) / _MS_PER_DAY);

    if (day_diff >= 365) {
        return Math.floor(day_diff / 365).toString() + "y";
    } else if (day_diff >= 30) {
        return Math.floor(day_diff / 30).toString() + "mo";
    } else if (day_diff >= 7) {
        return Math.floor(day_diff / 7).toString() + "w";
    } else if (day_diff >= 1) {
        return Math.floor(day_diff).toString() + "d";
    } else {
        return "1d";
    }
}



function loadExplorePane(data) {
    var song_container = document.getElementById('song-container');
    var deleteBox = document.getElementById('deleteNotif');



    for (var i = 0; i < data.length; i++) {
        var song_item = document.createElement("btn");
        song_item.setAttribute("class", "song-item");
        song_item.setAttribute("id", "song-item");
        song_item.song_data = data[i];

        
        

        song_item.addEventListener('click', function (event) {

            //showDelete(event.currentTarget.song_data);
            //+1 NUMBER OF PLAYS
            //console.log("Eee");
            //console.log("SD: " + event.currentTarget.song_data["plays"]); 
            var clickedSong = event.currentTarget.song_data;      
            var songName = `${clickedSong["song_name"]}`;
            
            deleteBox.innerHTML = 
            "<br>" +
            "<h2><center><h2>[[[Deleting: " + clickedSong["song_name"] + " by " + clickedSong["artist_name_display"] + "]]]</h2></center></h2>" +
            "<form action=\"/deleteSongs\" method=\"POST\" role=\"form\">" + 
            "<div class=\"lead margin-10-percent\" class=\"form-group\" style=\"padding-top: 2px;\">" +
            "<label for=\"country\">Reason for deletion</label>" +
            "<select class=\"form-control\" id=\"reason\" name=\"reason\">" + 
            "<option>Inappropriate Content</option>" +
            "<option>Copyright music</option>" +
            "<option>Other (see description)</option>" +
            "</select>" +
            "<br>" + 
            "<label for=\"exampleFormControlTextarea1\" class=\"form-label\">Description for deletion</label>" + 
            "<small id=\"textboxhelp\" class=\"form-text text-muted\">(300 char limit)</small>" + 
            "<textarea class=\"form-control\" name=\"description\" id=\"description\" rows=\"3\"></textarea>" + 
            "<br>" +
            "<button type=\"submit\" class=\"btn btn-primary\">Delete song</button>" + 
            "<input style=\"display:none;\" type=\"text\" name=\"songId\" value=" + clickedSong["song_id"] + ">" +
            "<input style=\"display:none;\" type=\"text\" name=\"artistId\" value=" + clickedSong["artist_idB"] + ">" +
            "<input style=\"display:none;\" type=\"text\" name=\"songName\" value=" + `"${clickedSong["song_name"]}"` + ">" +
            "</form>" + " " +
            "<form action=\"/deleteSongs\" method=\"GET\" id=\"del2button\">" + 
            "<button type=\"submit\" class=\"btn btn-primary\" style = \"padding-left: 10px\";>Cancel</button>" +
            "</form>";     
        });

        var image = document.createElement("img");
        if (data[i]["song_img_path"] == "") {
            image.setAttribute("src", "/song_images/unknown.jpg");
        } else {
            image.setAttribute("src", "/song_images/" + data[i]["song_img_path"]);
        }
        image.setAttribute("width", "100px");
        image.setAttribute("height", "100px");

        var song_item_text = document.createElement("div");
        song_item_text.classList.add("song-item-text-container");
        var song_name = document.createElement("h6");
        song_name.innerHTML = data[i]["song_name"];
        var artist_name_display = document.createElement("h6");

        artist_name_display.innerHTML = data[i]["artist_name_display"];
        var plays = document.createElement("h5");
        plays.innerHTML = 'Number of plays: ' + data[i]["plays"];
        song_item_text.append(song_name);
        song_item_text.append(artist_name_display);
        song_item_text.append(plays);
        song_item.append(image);
        song_item.append(song_item_text);
        song_container.append(song_item);
    }

}

function filterSongs(input) {
    const search_text = input.currentTarget.value;
    var songs = document.getElementsByClassName("song-item");
    for (var i = 0; i < songs.length; i++) {
        const artist_name_display = songs[i].song_data["artist_name_display"];
        const song_name = songs[i].song_data["song_name"]
        if (artist_name_display.includes(search_text) || song_name.includes(search_text)) {
            songs[i].style.visibility = "visible";
        } else {
            songs[i].style.visibility = "hidden";
        }
    }
}

// MUSIC PLAYER

let previous = document.querySelector('#pre');
let play = document.querySelector('#play');
let title = document.querySelector('#title');
let recent_volume = document.querySelector('#volume');
let slider = document.querySelector('#duration_slider');
let show_duration = document.querySelector('#show_duration');
let track_image = document.querySelector('#track_image');
let artist = document.querySelector('#artist');
let song_name = document.getElementById('song_name');
let clickPlaySong = document.querySelector('#song-item');

let timer;
let playing_song = false;
let track = document.createElement('audio');
track.volume = .5;

function showDelete(songData){

    /*
    document.write("                <div class=\"container mt-4\"> ");
    document.write("                        ");
    document.write("                        <div class=\"deleteNotif\">");
    document.write("");
    document.write("                        ");
    document.write("                            <div class=\"lead margin-10-percent\" class=\"form-group\" style=\"padding-top: 2px;\">");
    document.write("                            <label for=\"country\">Reason for deletion<\/label>");
    document.write("                            <select class=\"form-control\" id=\"country\" name=\"country\">");
    document.write("                            <option>Inappropriate Content<\/option>");
    document.write("                            <option>Copyright music<\/option>");
    document.write("                            <option>Other (see description)<\/option>");
    document.write("                            <\/select>");
    document.write("                            <br>");
    document.write("                            <label for=\"exampleFormControlTextarea1\" class=\"form-label\">Description for deletion<\/label>");
    document.write("                            <small id=\"textboxhelp\" class=\"form-text text-muted\">(300 char limit)<\/small>");
    document.write("                            <textarea class=\"form-control\" name=\"biography\" id=\"biography\" rows=\"3\"><\/textarea>");
    document.write("                            <button type=\"submit\" class=\"btn btn-primary\">Delete song<\/button>");
    document.write("");
    document.write("");
    document.write("                        <\/div>");
    document.write("                        ");
    document.write("                    <\/div>");
    document.write("            ");
    document.write("                <\/div>");

    */

}