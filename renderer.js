
window.onload = function () { // Wait for the app to load before getting the button.
    let loaddemo = document.getElementById('loaddemo');
    loaddemo.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipcRenderer.send("loaddemo");
    });


    let highlights = document.getElementById('gethighlights');
    highlights.addEventListener('click', (e) => {
        e.preventDefault();
        let uid = document.getElementById('players').value;
        window.ipcRenderer.send("gethighlights", uid, name);
    });


}

window.ipcRenderer.on('header', function (event, data) {
    //TODO: need to check for duplicate players.....
    let name,guid;
    name = data["name"];
    guid = data["guid"];

    if (!data['fakePlayer']) { // Remove any bots
        $('#players').append(new Option(name, guid));
    }

    $('#loaddemo').prop('disabled', true);
    $('#gethighlights').prop('disabled', false);

});

window.ipcRenderer.on('test', function (event, data) {

});




