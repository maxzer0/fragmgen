const fs = require("fs");
const demofile = require("demofile");
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require("path");
const http = require('http');
const csPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\";
const Telnet = require('telnet-client')
var demoPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo\\replays\\match730_003410779876469244136_1917365897_192.dem"

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "Woah!",
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('./index.html')

    win.webContents.openDevTools()

}


// When we're ready, create the window.
app.whenReady().then(createWindow);


//Gets all the players...
ipcMain.on('loaddemo', function (event) {

    process.once('uncaughtException', function (error) {
        event.sender.send("error", error)
        event.sender.send("header", 35);
    })

    fs.readFile(demoPath, (err, buffer) => {
            const cdemoFile = new demofile.DemoFile();
            let playerList = [];


            cdemoFile.stringTables.on("update", (e) => {
                if (e.table.name === "userinfo" && e.userData != null) { // If we're getting user data, try to interpret it.
                    if ( (! e.userData.fakePlayer) && e.userData.guid !== 'BOT' ) { // Check if it's any GOTV "players" and if they have a valid steamID ;)
                        playerList.push(e.userData)
                        if (playerList.length >= 1) {
                            let dup = false;
                            for (let i = 0; i < playerList.length; i++) { //TODO: I feel like this is pretty inefficient and there's probably a better way to do this =)
                                if (!(playerList[i].name === e.userData.name)) { // If you aren't a duplicate, append it to the list.
                                    dup = true;
                                    break;
                                }
                            }
                            if (!dup) { // Non-duplicate names get added.
                                playerList.push(e.userData)
                            }
                        }

                    }

                    if (playerList.length === 10) { // Once we have 10 players with this list cancel.
                        event.sender.send("header", playerList); // Send data back to ipcrenderer via the "header" channel
                        cdemoFile.cancel();
                    }

                }




            });
            cdemoFile.parse(buffer);
        });


})

//Gets all the highlights
ipcMain.on('gethighlights', function (event, arg) {
    let highlights = [];

    fs.readFile(demoPath, (err,buffer) => {
        const cdemoFile = new demofile.DemoFile();
        let kills = 0;
        let ctick;
        let team;
        let cname;
        let currentRound;


        cdemoFile.gameEvents.on("round_start", () => {
                currentRound = cdemoFile.gameRules.roundsPlayed;
        })

        cdemoFile.gameEvents.on("player_death", e => {
                if (! cdemoFile.gameRules.isWarmup) { // Count kills not in warmup.
                    const attacker = cdemoFile.entities.getByUserId(e.attacker);
                    //TODO: Find some way to handle undefined steamid or else the whole program won't work.

                    if (attacker.steamId === arg.steamid2) {
                        cname = attacker.name
                        ctick = cdemoFile.currentTick - 600; // Abit before the first kill.

                        team = (attacker.TeamNumber === 2) ? "CT" : "T";  // Lazy check, could be done better, but you shouldn't be able to kill as unassigned/spec.

                        kills++;
                    }
                }
        });

        cdemoFile.gameEvents.on("round_officially_ended", () => {
            if (!cdemoFile.gameRules.isWarmup) { //TODO: Feel like there's a better solution for this....
                if (kills > 0) { // Checks if there's a kill available, since we're only counting the one persons kills, we should be fine;
                    highlights.push({round: currentRound + 1, kills: kills, team: team, demotick: ctick});
                }

                kills = 0;
            }

        })

        cdemoFile.on("end", () => {
            event.sender.send("return-highlights", highlights)
        })

        cdemoFile.parse(buffer);
    });


})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


ipcMain.on('launchcsgo', function (event) {

    writeCFG(demoPath, )
    /*
        Launch a local webserver that gets the incoming game state data
     */
    const port = 3000;
    const host = '127.0.0.1';

    let telnetc = new Telnet(); // Create a new telnet client to refer to later.

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        let firstS = false;
        let eventInfo = '';

        req.on('data', (data) => { // TODO: Actually check the data and do something with it....
            if (!firstS) {// Only connect to CSGO once after the gamestate integration is launched.

                let telnetp = {
                    host: '127.0.0.1',
                    port: 2121,
                    timeout: 1500,
                    negotiationMandatory: false
                }

                try {
                    telnetc.connect(telnetp)
                } catch (error) {
                    console.log(error);
                }
                firstS = true;
            }

            try {
                JSON.parse(data).allplayers['76561198009704140'].state.round_kills;
                if( JSON.parse(data).allplayers['76561198009704140'].state.round_kills === 2) {
                    console.log("we got the kills")
                    console.log("killing the game in 2 secs");
                    setTimeout( function ()  {
                        console.log("killing the game now");
                        telnetc.exec("quit");
                    }, 2000);
                } // Check the amount of kills our highlight player has =)
            } catch (error) {
                console.log(error);
            }

        });

        req.on('end', () => {
            if (eventInfo !== '') {
                console.log(eventInfo);
            }

            res.end('');
        });
    });

    server.listen(port, host);


    launchCS();



})



/**
 * Helper function to read values under nested paths from objects - ripped from tsuriga/csgo-gsi-qsguide
 *
 * @param {object} container - Object container
 * @param {string} propertyPath - Path to the property in the container
 *                                separated by dots, e.g. 'map.phase'
 * @return {mixed} Null if the object has no requested property, property value
 *                 otherwise
 */
function readProperty(container, propertyPath) {
    let value = null;
    const properties = propertyPath.split('.');

    for (const p of properties) {
        if (!container.hasOwnProperty(p)) {
            return null;
        }

        value = container[p];
        container = container[p];
    }

    return value;
}



// Launch CSGO function

function launchCS() {
    var child = require('child_process').execFile;
    var executablePath = path.join(__dirname, 'hlae/HLAE.exe');
    var parameters = ["-csgoLauncher", "-noGui", "-autoStart", "-csgoExe \"" + csPath + "csgo.exe\"","-gfxEnabled true", "-gfxWidth 1920", "-gfxHeight 1080", "-gfxFull false", "-customLaunchOptions \"-netconport 2121 -novid -console \""];
    child(executablePath, parameters, function(err, data) {
        console.log(err)
        console.log(data.toString());
    });
}

/* Writing a temporary config.
    @param {string} demo - path to the demo
    @param {int} startTick - when does the highlight start
    @param {string} player - the player's steam64ID
    @param {string} recordPath - where will we save our stuff.

 */

function writeCFG(demo,startTick, player, recordPath) { //TODO: This function is still incomplete.

    let content;

    content += "exec moviecrosshair.cfg" // Set the movie viewmodel + crosshair.

    // Start the demo and send it to the tick where the highlight starts.
    content += "cl_show_observer_crosshair 0" // Disable spectating player's crosshair
    content += "echo \"Starting demofile " + demo + "\""
    content += "playdemo" + demo
    content += "echo \"Going to tick " + startTick + "\""
    content += "demo_goto" + startTick + "0 1"

    // Setup the killfeed
    content += "spec_player_by_accountid" + player
    content += "mirv_deathmsg filter clear"
    content += "mirv_deathmsg filter add attackerMatch=!x" + player + " victimMatch=!xXUID block=1 lastRule=1"
    content += "mirv_deathmsg localPlayer" + player
    content += "mirv_deathmsg lifeTime 60"
    content += "mirv_deathmsg lifeTimeMod 1.0"

    // Setup the recording feed.
    content += "exec afx/updateworkaround"  // Adds 4 streams to record.
    content += "mirv_streams remove myDepthWorld" // I don't need this stream yet.
    content += "mirv_streams record cam enabled 1" // Record the camera track, not sure if need
    content += "mirv_streams record format tga"
    content += "mirv_streams record name \"F:\\Projects\\unfinished\\fregmovie lvl10\\foldername\"" // TODO: Make this dynamic, once you get the concept working.
    content += ""


    try {
        fs.writeFile (csPath + "cfg\\customDemo.cfg", content, 'utf-8');
    } catch (e) {
        console.log(e)
    }

}




