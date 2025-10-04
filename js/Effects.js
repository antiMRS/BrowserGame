//if (Effect) console.error("Effect class allredy egsist")


var EFFECTS = {
	hunger: {
	    name: "Hunger",
	    ch: "@",
	    tick: function(on, level) {
	        if (!on || !level) return
	        
	        on.hunger = on.hunger - 1 * level
	    },
	    desc: "Slowly spending your hunger"
	},
	bleeding: {
	    name: "Bleeding",
	    ch: "♢",
	    tick: function(on, level) {
	        if (!on || !level) return
	        //console.log("tick")
	        on.health = on.health - 1 * level
	    },
	    desc: "Your health slowly falls"
	}
}

var POTIONS = {
    register: ["yellow", "black"],
    yellow: {
       effect: "hunger",
       used: false
     },
    black: {
        effect: "bleeding",
        used: false
    }
}

/**
 * new HumEffect(whose = actor,
 * def = {
 * effect: string,
 * level: number,
 * duration: number
 * })
 */

function Effect(whose, def) {
    if (!whose) return
    def = (def) ? def : {
        effect: "hunger",
        level: 1,
        duration: 10
    }
    if (!EFFECTS[def.effect]) return
    
    this.owner = whose
    this.level = def.level
    this.duration = def.duration
    
    this.effect = EFFECTS[def.effect]
}
Effect.prototype.Tick = function() {
    this.duration = this.duration - 1
    this.effect.tick(this.owner, this.level)
    if (this.duration <= 0) {
        ui.msg("The " + this.effect.name + " passes")
        removeElem(this.owner.effects, this)
    }
}
