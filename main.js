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
    try {
        fs.readFile("testdemo.dem", (err, buffer) => {
            const cdemoFile = new demofile.DemoFile();
            let players = 0;
            cdemoFile.stringTables.on("update", (e) => {
                if (e.table.name === "userinfo" && e.userData != null) {
                    players++;
                    event.sender.send("header", e.userData); // Send data back to ipcrenderer via the "header" channel
                }

                if (players == 10) { // once we got 10 players cancel //TODO: Find better solution for this.
                    cdemoFile.cancel();
                }

            });
            cdemoFile.parse(buffer);
        });
    } catch (error) {
        event.sender.send("header", error)
    }


})

//Gets all the highlights
ipcMain.on('gethighlights', function (event, arg) {
    fs.readFile("testdemo.dem", (err,buffer) => {
        const cdemoFile = new demofile.DemoFile();
        let kills = 0;
        let team;
        let cname;
        let currentRound;

        cdemoFile.gameEvents.on("round_start", () => {
                currentRound = cdemoFile.gameRules.roundsPlayed;
        })

        cdemoFile.gameEvents.on("player_death", e => {
                if (!cdemoFile.gameRules.isWarmup) { // Count kills not in warmup.
                    const victim = cdemoFile.entities.getByUserId(e.userid);
                    const victimName = victim ? victim.name : "unnamed";
                    // Attacker may have disconnected so be aware.
                    // e.g. attacker could have thrown a grenade, disconnected, then that grenade
                    // killed another player.
                    const attacker = cdemoFile.entities.getByUserId(e.attacker);
                    const attackerName = attacker ? attacker.name : "unnamed";
                    const headshotText = e.headshot ? " HS" : "";



                    if (attacker.steamId == arg) {
                        cname = attacker.name
                        if (attacker.teamNumber === 2) { // Lazy check, could be done better, but you shouldn't be able to kill as unassigned/spec.
                            team = "T"
                        } else {
                            team = "CT";
                        }
                        kills++;
                        //console.log(`${attackerName} [${e.weapon}${headshotText}] ${victimName}`);
                    }
                }

        });

        cdemoFile.gameEvents.on("round_officially_ended", () => {
            if (!cdemoFile.gameRules.isWarmup) { //TODO: Feel like there's a better solution for this....
                if (kills > 0) { // Checks if there's a kill available, since we're only counting the one persons kills, we should be fine.
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


