
window.onload = function () { // Wait for the app to load before getting the button.
    let loaddemo = document.getElementById('loaddemo');
    loaddemo.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipcRenderer.send("loaddemo");
        $('#loaddemo').prop('disabled', true);
    });


    let highlights = document.getElementById('gethighlights');
    highlights.addEventListener('click', (e) => {
        e.preventDefault();
        let s32 = new window.SteamID(document.getElementById('players').value).getSteam2RenderedID(true);
        console.log(s32);
        window.ipcRenderer.send("gethighlights", s32, name);
        $('#gethighlights').prop('disabled', true);
    });

    let launch = document.getElementById('launchcsgo');
    launch.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipcRenderer.send("launchcsgo");
    });


}


/* Error checker
    Codes:
    35 = "Failed to parse demo"
    36 = "Failed to get highlights"

 */
window.ipcRenderer.on('error', function (event, data)  {
    $('#error').text(data);
})





window.ipcRenderer.on('header', function (event, data) {
    if (!(data === 35)) {
        data.forEach( function (x) { // uses the array to assign the selector menu.$
            let s64 = new window.SteamID(x.guid); //Convert SteamID2 to SteamID64 for mirv_deathmsg
            $('#players').append(new Option(x.name, s64.getSteamID64()));
        })

        $('#loaddemo').prop('disabled', true);
        $('#gethighlights').prop('disabled', false);
    } else {
        $('#loaddemo').prop('disabled', false);
    }


});

window.ipcRenderer.on('test', function (event, data) {

});

window.ipcRenderer.on('highlightback', function (event, data) {

    if (!(data === 36)) {
        data.forEach( function (x) { // uses the array to assign the selector menu.$
            $('#highlights').append(new Option(`Round: ${x.round}, ${x.kills}K on ${x.team}`, x.demotick));
        })

        $('#gethighlights').prop('disabled', true); // don't need to retrieve highlights after we've done it once.
        $('#players').prop('disabled', true);

        $('#highlights').prop('disabled', false);
    } else {
        $('#gethighlights').prop('disabled', false); // if we failed allow to try again
    }

});





