
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
        let uid = document.getElementById('players').value;
        window.ipcRenderer.send("gethighlights", uid, name);
    });


}

window.ipcRenderer.on('error', function (event, data)  {
    $('#error').text(data);
})





window.ipcRenderer.on('header', function (event, data) {
    if (!(data === 35)) {
        data.forEach( function (x) { // uses the array to assign the selector menu.$
            let s64 = new window.SteamID(x.guid);
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




