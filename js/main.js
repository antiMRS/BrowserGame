var world, ui

window.onload = function() {
    function start() {
        try {
            $("#loading-text").innerHTML = "Initializing..."
            console.groupCollapsed("Generating World")
            console.time("World Gemeration time")
            world = new World()
            console.timeEnd("World Gemeration time")
            console.groupEnd()
            var pl = new Actor(world.dungeon.start[0], world.dungeon.start[1], {
                weapon: ITEMS.bottle,
                ch: "H"
            })
            pl.updateVisibility()
            world.dungeon.actors.push(pl)
            world.dungeon.actor = pl
            ui = new UI(pl)
            ui.resetDisplay()

            ;(function tick() {
                requestAnimationFrame(tick)
                input.updateKeys(ui.actor)
                world.update()
                ui.update()
                ui.render()
                //pl.pos[0] + 1
            })()

            $("#loading").style.display = "none"
            $("#game").style.display = "block"
            
            //$("#debug-hud").style.display = 'none'
            
            console.info("Starting at", world.startTime)
        } catch(e) {
            $("#loading").style.display = "block"
            $("#loading").innerHTML = "ERROR: " + e.message + "\n" + e.stack
            console.error(e)
        }
    }

    $("#loading-text").innerHTML = "Waiting for a font..."

    FontDetect.onFontLoaded(CONFIG.fontFamily, start, start, { msTimeout: 5000 })

    // Pressing 'm' enables the retrieval of the current map's 
    // character representation. Uncomment for development
    // usage only along dungeon.js' displayMap function.

    /* document.addEventListener('keydown', function(event) {
        if (event.key === 'm' || event.key === 'M') {
            world.dungeon.displayMap()
        }
    }) */
}
