
window.onload = function () { // Wait for the app to load before getting the button.
    let loaddemo = document.getElementById('loaddemo'); // Retrieve demo button
    loaddemo.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipcRenderer.send("loaddemo");
        $('#loaddemo').prop('disabled', true);
    });


    let highlights = document.getElementById('gethighlights');
    highlights.addEventListener('click', (e) => { // Retrieve player highlights
        e.preventDefault();
        window.ipcRenderer.send("gethighlights", $('#players').data($('#players').val()), name);
        $('#gethighlights').prop('disabled', true);
    });

    let launch = document.getElementById('launchcsgo');
    launch.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipcRenderer.send("launchcsgo");
    });


}


/* Error checker function, TODO: Replace with native error handling (?)
    Codes:
    35 = "Failed to parse demo"
    36 = "Failed to get highlights"
 */
window.ipcRenderer.on('error', function (event, data)  { //TODO: Needs to be fleshed out more...
    $('#error').text(data);
})





window.ipcRenderer.on('header', function (event, data) {
    if (!(data === 35)) {
        data.forEach( function (x) { // uses the array to assign the selector menu.$
            let s64 = new window.SteamID(x.guid); //Convert SteamID2 to SteamID64 for mirv_deathmsg
            $('#players').data(x.name, {steamid64: s64.getSteamID64(), steamid2: x.guid});
            $('#players').append(new Option(x.name));
        })

        $('#loaddemo').prop('disabled', true);
        $('#gethighlights').prop('disabled', false);
    } else {
        $('#loaddemo').prop('disabled', false);
    }


});

window.ipcRenderer.on('test', function (event, data) {

});

window.ipcRenderer.on('return-highlights', function (event, data) {

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





