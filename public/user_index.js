document.addEventListener('DOMContentLoaded', function () {
    fetch('http://localhost:5000/getSongDisplays')
        .then(response => response.json())
        .then(data => loadExplorePane(data['data']));
    fetch('http://localhost:5000/getNotifications')
        .then(response => response.json())
        .then(data => loadNotificationPane(data['data']));
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

function loadNotificationPane(data) {
    var notification_pane = document.getElementById('notification-pane');
    for (var i = 0; i < data.length; i++) {
        var notification = document.createElement("div");
        notification.classList.add("notification");
        if (data[i]["header_text"] != "Needs Verification") {
            notification.song_data = data[i];
            notification.addEventListener('click', function (event) {
                playSong(event.currentTarget.song_data);
            });
        }

        // Notification header
        var header = document.createElement("div");
        header.classList.add("notification-header");
        var header_left = document.createElement("h3");
        header_left.innerHTML = data[i]["header_text"];
        var header_right = document.createElement("h4");
        header_right.innerHTML = timeSince(data[i]["date_created"]);
        header.append(header_left);
        header.append(header_right);

        // Notification body
        var body = document.createElement("div");
        body.classList.add("notification-body");
        var data1 = document.createElement("div");
        data1.classList.add("notification-data1");
        var image = document.createElement("img");
        image.setAttribute("src", "/song_images/" + data[i]["song_img_path"]);
        image.setAttribute("width", "50px");
        image.setAttribute("height", "50px");
        var data2 = document.createElement("div");
        data2.classList.add("notification-data2");
        var song_name = document.createElement("h5");
        song_name.innerHTML = data[i]["song_name"];
        var artist_name_display = document.createElement("h5");
        artist_name_display.innerHTML = data[i]["artist_name_display"];
        data2.append(song_name);
        data2.append(artist_name_display);
        data1.append(image);
        data1.append(data2);
        body.append(data1);
        notification.append(header);
        notification.append(body);
        notification_pane.append(notification);
    }
}

function loadExplorePane(data) {
    var song_container = document.getElementById('song-container');
    for (var i = 0; i < data.length; i++) {
        var song_item = document.createElement("btn");
        song_item.setAttribute("class", "song-item");
        song_item.setAttribute("id", "song-item");
        song_item.song_data = data[i];
        song_item.addEventListener('click', function (event) {
            fetch('http://localhost:5000/updateCount', {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId: event.currentTarget.song_data["song_id"] }),
            });
            playSong(event.currentTarget.song_data);
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

function playSong(song_data) {
    console.log(song_data);
    clearInterval(timer);
    resetSlider();
    track.src = "/song_audio/" + song_data["song_audio_path"];
    title.innerHTML = song_data["song_name"];
    //track_image.src = "/song_images/" + song_data["song_img_path"];
    artist.innerHTML = song_data["artist_name_display"];
    track.load();
    track.play();
    play.innerHTML = '<i class="fa fa-pause" aria-hidden="true"></i>';
    playing_song = true;
    timer = setInterval(rangeSlider, 1000);
}

function muteSound() {
    track.volume = 0;
    //volume.value = 0;
}

function togglePlay() {
    if (playing_song) {
        track.pause();
        play.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
    } else {
        track.play();
        play.innerHTML = '<i class="fa fa-pause" aria-hidden="true"></i>';
    }
    playing_song = !playing_song;
}

// reset song slider
function resetSlider() {
    slider.value = 0;
}

// change volume
function volumeChange() {
    track.volume = recent_volume.value / 100;
}

// change slider position 
function changeDuration() {
    slider_position = track.duration * (slider.value / 100);
    track.currentTime = slider_position;
}

function rangeSlider() {
    let position = 0;
    // update slider position
    if (!isNaN(track.duration)) {
        position = track.currentTime * (100 / track.duration);
        slider.value = position;
    }
    // function will run when the song is over
    if (track.ended) {
        play.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
    }
}