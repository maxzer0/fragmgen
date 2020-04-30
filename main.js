const fs = require("fs");
const demofile = require("demofile");
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require("path");

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

    fs.readFile("testdem4o.dem", (err, buffer) => {
            const cdemoFile = new demofile.DemoFile();
            let playerList = [];


            cdemoFile.stringTables.on("update", (e) => {

                if (e.table.name === "userinfo" && e.userData != null) {
                    if (!e.userData.fakePlayer) { // Check if it's any GOTV "players"
                        if (playerList.length >= 1) {
                            let dup = false;
                            for (let i = 0; i < playerList.length; i++) {
                                if (playerList[i].name === e.userData.name) { // If you don't have a duplicate, append it to the list.
                                    dup = true;
                                    break;
                                }
                            }
                            if (!dup) { // Non-duplicate names get added.
                                playerList.push(e.userData)
                            }

                        }

                        if (playerList.length === 0) { // If we ain't have got anything, let's not check for anything
                            playerList.push(e.userData)
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
ipcMain.once('gethighlights', function (event, arg) {
    fs.readFile("testdemo.dem", (err,buffer) => {
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
                if (!cdemoFile.gameRules.isWarmup) { // Count kills not in warmup.
                    const attacker = cdemoFile.entities.getByUserId(e.attacker);



                    if (attacker.steamId == arg) {
                        cname = attacker.name
                        ctick = cdemoFile.currentTick - 500; // Abit before the first kill.

                        if (attacker.teamNumber === 2) { // Lazy check, could be done better, but you shouldn't be able to kill as unassigned/spec.
                            team = "T"
                        } else {
                            team = "CT";
                        }
                        kills++;
                    }
                }

        });

        cdemoFile.gameEvents.on("round_officially_ended", () => {
            if (!cdemoFile.gameRules.isWarmup) { //TODO: Feel like there's a better solution for this....
                if (kills > 0) { // Checks if there's a kill available, since we're only counting the one persons kills, we should be fine;
                    console.log(`${cname} ${kills}K ${team}`)
                    console.log( `Round : ${currentRound + 1}`);
                }

                kills = 0;
            }
        })

        cdemoFile.parse(buffer);
    });

})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


