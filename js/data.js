// Map elements.
var TILES = {
	empty: {
		ch: "",
		color: "#000",
		walkable: false,
		transparent: false
	},
	floor: {
		ch: "·",
		color: "#666",
		walkable: true,
		transparent: true,
		desc: "Empty (just like the rest) floor."
	},
	wall: {
		ch: "#", // █
		color: "#7f97a1",
		walkable: false,
		transparent: false,
		desc: "Sturdy mental wall."
	},
	wall2: {
		ch: "#", // █
		color: "#7f97a1",
		walkable: false,
		transparent: false,
		desc: "Sturdy mental wall."
	},
	door_open: {
		ch: "/",
		color: "#064",
		walkable: true,
		transparent: true,
		desc: "Open door."
	},
	door_closed: {
		ch: "+",
		color: "#830",
		walkable: true,
		transparent: false,
		desc: "Closed door. How about getting closer?"
	},
	door_locked: {
		ch: "+",
		color: "#d00",
		walkable: false,
		transparent: false,
		desc: "Locked door."
	},
	airlock: {
		ch: "☖",
		color: "#c65967",
		walkable: true,
		transparent: true,
		desc: "Passage between these seconds of calm and... the other world. I don't even know how to describe that place."
	},
	sand: {
		ch: [":",";"],
		color: "#FFD87D",
		walkable: true,
		transparent: true,
		desc: "Sandy ground."
	},
	rockground: {
		ch: [":",";"],
		color: "#c1c1c1",
		walkable: true,
		transparent: true,
		desc: "Rock ground."
	},
	rockwall: {
		ch: ["#", "%"],
		color: "#C1C1C1",
		walkable: false,
		transparent: false,
		desc: "Rocky wall."
	},
	iceground: {
		ch: "∷",
		color: [[200, 255, 255], 20],
		walkable: true,
		transparent: true,
		desc: "Icy ground."
	},
	icewall: {
		ch: "#",
		color: [[44, 163, 163], 20],
		walkable: false,
		transparent: false,
		desc: "Icy wall."
	},
	rock: {
		ch: "○",
		color: "#f40",
		walkable: true,
		transparent: true,
		desc: "Crater."
	},
	rock2: {
		ch: "▰",
		color: "#c50",
		walkable: false,
		transparent: true,
		desc: "Rock."
	},
	rock3: {
		ch: "◾",
		color: "#c50",
		walkable: false,
		transparent: true,
		desc: "Big boulder."
	},
	rock4: {
		ch: ["▟","▙"],
		color: "#d00",
		walkable: false,
		transparent: false,
		desc: "Large rock formation. Spikes, spikes, spikes..."
	},
	cave: {
		ch: "☖",
		color: "#7f97a1",
		walkable: true,
		transparent: true,
		desc: "Mental entrance. A real entrance? What's the difference?"
	},
	hill: {
		ch: "▴",
		color: [[255, 100, 0], 20],
		walkable: true,
		transparent: true,
		desc: "Hills. Calming, somehow."
	},
	mountain: {
		ch: "▲",
		color: [[255, 50, 0], 10],
		walkable: false,
		transparent: false,
		desc: "Impassable mountains."
	},
	// Devices.
	oxygenator: {
		name: "Oxygenator", ch: "♼", color: "#12b9dd",
		resource: "oxygen", amount: 200, intake: "ice", device: true,
		walkable: false,
		transparent: true,
		desc: "Oxygenator. Produces oxygen from ice, or so they told you once."
	},
	dispensator: {
		name: "Lithium dispensator", ch: "☢", color: "#fc0",
		resource: "energy", amount: 200, intake: "lithium", device: true,
		walkable: false,
		transparent: true,
		desc: "Lithium dispensator. The resulting material alters your brain chemicals, making you feel 'better'. Bring lithium."
	},
	bench: {
		name: "Bench", ch: "⚒", color: "#40c",
		shop: true, amount: 0, intake: "distantmemories", device: true,
		walkable: false,
		transparent: true,
		desc: "A humble, working bench. You might want to craft something here. Something different. Better."
	},
	trapdoor: {
		name: "TrapDoor", ch: "⌸", color: "#b4b4b4ff",
		shop: false, amount: 0, intake: "distantmemories", device: true,
		interact: function(who, why) {
			world.changeMap(who, {
				mapId: world.dungeon.id + 1,
				mapType: "dungeon",
				start: [0,0]
			})
			ui.msg("Entering floor", world.dungeon.id + 1)
		},
		walkable: true,
		transparent: true,
		desc: "This is trapdoor to next floor"
	},
	trap_line: {
		name: "Floor Trap", ch: "ꔖ", color: "#09ff00ff",
		shop: false, amount: 0, intake: "distantmemories", device: true,
		interact: function(who, why) {
			let x = who.pos[0]
			let y = who.pos[1]

			who.effects.push(new Effect(who, {effect: TILES.trap_line.effect, level: 1, duration: 10}))
			world.dungeon.setTile(x , y, "floor")

			ui.msg("You've stepped on a trap.")
		},
		walkable: true,
		transparent: true,
		desc: "No",
		effect: false
	},
	trap_vline: {
		name: "Floor Trap", ch: "☰", color: "#09ff00ff",
		shop: false, amount: 0, intake: "distantmemories", device: true,
		interact: function(who, why) {
			let x = who.pos[0]
			let y = who.pos[1]

			who.effects.push(new Effect(who, {effect: TILES.trap_line.effect, level: 1, duration: 10}))
			world.dungeon.setTile(x , y, "floor")

			ui.msg("You've stepped on a trap.")
		},
		walkable: true,
		transparent: true,
		desc: "No",
		effect: false
	},
	trap_2line: {
		name: "Floor Trap", ch: "☵", color: "#09ff00ff",
		shop: false, amount: 0, intake: "distantmemories", device: true,
		interact: function(who, why) {
			let x = who.pos[0]
			let y = who.pos[1]

			who.effects.push(new Effect(who, {effect: TILES.trap_line.effect, level: 1, duration: 10}))
			world.dungeon.setTile(x , y, "floor")

			ui.msg("You've stepped on a trap.")
		},
		walkable: true,
		transparent: true,
		desc: "No",
		effect: false
	},
	ledder: {
		name: "Ledder", ch: "⌳", color: "#b4b4b4ff",
		shop: false, amount: 0, intake: "distantmemories", device: true,
		interact: function(who, why) {
			world.changeMap(who, {
				mapId: world.dungeon.id - 1,
				mapType: "dungeon",
				start: [0,0]
			})
			ui.msg("Entering floor", world.dungeon.id - 1)
		},
		walkable: true,
		transparent: true,
		desc: "This is trapdoor to next floor"
	},
	generateInstance: function(proto) {
		var tile = clone(proto);
		if (tile.ch instanceof Array)
			tile.ch = tile.ch.random();
		if (tile.color instanceof Array)
			tile.color = ROT.Color.toHex(ROT.Color.randomize(tile.color[0], tile.color[1]));
		return tile;
	}
};

var ITEMS = {
	// Weapons.
	bottle: {
		name: "Broken bottle", ch: "⚱", color: "#92dad0", canEquip: true,
		weapon: { accuracy: 0.7, damage: [20,30] },
		desc: "Can be used as a desperate melee weapon."
	},
	bread: {
		name: "Bread", ch: "M", color: "#ED9736",
		resource: "suit", amount: 1, canUse: true, canEquip: false, canConsume: true,
		desc: "Simple Bread",
		onUse: function(who, param){
			if (who) {
				if (who.hunger < who.maxhunger) {
					if (who.hunger + 50 <= who.maxhunger) {
						who.hunger = who.hunger + 50
					} else {
						who.hunger = who.maxhunger
					}
					ui.msg("You ate the bread.")
					playItemEffect()
					removeElem(who.inv, this)
				} else {
					ui.msg("You are full")
					//removeElem(who.inv, this)
				}
			}
		},
		cost: 2
	},
	minibread: {
		name: "Bread-Mini", ch: "m", color: "#ED9736",
		resource: "suit", amount: 1, canUse: true, canEquip: false, canConsume: true,
		desc: "Simple Bread, but smoller",
		onUse: function(who, param){
			if (who) {
				if (who.hunger < who.maxhunger) {
					if (who.hunger + 25 <= who.maxhunger) {
						who.hunger = who.hunger + 25
					} else {
						who.hunger = who.maxhunger
					}
					ui.msg("You ate the bread.")
					removeElem(who.inv, this)
				} else {
					ui.msg("You are full")
					//removeElem(who.inv, this)
				}
			}
		},
		cost: 2
	},
	potion: {
		name: "Potion", ch: "♙", color: "#ED9736",
		resource: "suit", amount: 1, canUse: true, canEquip: false, canConsume: true,
		desc: "Glass bottle with colorful water",
		onUse: function(who, param){
			who.effects.push(new Effect(who, {
				effect: this.potion.effect,
				level: 1,
				duration: 10
			}))
			this.potion.used = true
			ui.msg("You gain " + this.potion.effect)
			removeElem(who.inv, this)
		},
		onCreate: function(item, param) {
			item.type = POTIONS.register.random()
			//console.log(world)
			item.potion = POTIONS[item.type]
			item.color = colorFromName(item.type)
			
			item.getDescription = function() {
				var desc = this.type.slice(0,1).toUpperCase() + this.type.slice(1) + " Potion" //toUpperCase
				
				if (this.potion.used) {
					desc += ": Contains " + EFFECTS[this.potion.effect].name + ": «" + EFFECTS[this.potion.effect].desc + "» "
				} else {
					desc += ": Strange bottle with " + this.type + " color "
				}
				
				return desc
			}
		},
		cost: 2
	},
	// Items.
	bandage: {
		name: "Dirty bandage", ch: "⊗", color: "#a66973",
		resource: "suit", amount: 40, canUse: true, canEquip: true, canConsume: true,
		desc: "Patches leaking suits and other imaginary, nocturnal types of skin.",
		cost: 2
	},
	medikit: {
		name: "Medikit", ch: "✙", color: "#6aa84f",
		resource: "health", amount: 40, canUse: true, canEquip: true, canConsume: true,
		desc: "Can heal wounds. Not all of them, though.",
		cost: 3
	},
	goalitem: {
		name: "Optimum creavit", ch: "☬", color: "#43a699",
		resource: "goal", amount: 1,
		desc: "The great, powerful, incomprehensible, all about this thing are legends, part of them truth, part of the lies. This thing is worth millions."
	},
	//artifacts
backpack: {
		name: "Backpack", ch: "🎒", color: "#ED9736",
		resource: "suit", amount: 1, canUse: true, canEquip: false, canConsume: true,
		desc: "Glass bottle with colorful water",
		onUse: function(who, param){
			let st = who.maxItems
			who.maxItems = st + 10
			ui.msg("You equiped backpack. You inventory incrased to " + (st + 10))
			removeElem(who.inv, this)
		},
		cost: 2
	},
	
	// Mobs weapons.
	remorsemelee: {
		name: "Rat bite", canEquip: true, canDrop: false,
		weapon: { accuracy: 0.5, damage: [3,10] }
	},
	compulsionmelee: {
		name: "Coyote bite", canEquip: true, canDrop: false,
		weapon: { accuracy: 0.6, damage: [7,12] }
	},
	withdrawalmelee: {
		name: "Wolf bite", canEquip: true, canDrop: false,
		weapon: { accuracy: 0.6, damage: [10,20] }
	},
	burnoutmelee: {
		name: "Burnout glimpse", canEquip: true, canDrop: false,
		weapon: { accuracy: 0.7, damage: [15,40] }
	},
	ptsdmelee: {
		name: "PTSD episode", canEquip: true, canDrop: false,
		weapon: { accuracy: 0.5, damage: [17,41] }
	}
}

// MOBS
var MOBS = {
	remorse: {
		name: "Remorse", ch: "r", color: "#425", ai: "hunter",
		health: 30, weapon: ITEMS.remorsemelee, vision: 5 },
	compulsion: {
		name: "Old compulsion", ch: "c", color: "#973", ai: "hunter",
		health: 60, weapon: ITEMS.compulsionmelee, vision: 8 },
	withdrawal: {
		name: "Withdrawal", ch: "w", color: "#987", ai: "hunter",
		health: 80, weapon: ITEMS.withdrawalmelee, vision: 8 },
	burnout: {
		name: "Burnout ashes", ch: "B", color: "#633", ai: "hunter",
		health: 180, weapon: ITEMS.burnoutmelee, vision: 9 },
	ptsd: {
		name: "PTSD waves", ch: "P", color: "#ffccaa", ai: "hunter",
		health: 200, weapon: ITEMS.ptsdmelee, vision: 9 }
};


// Create ids.
(function() {
	for (var i in TILES)
		TILES[i].id = i;
	for (var i in MOBS)
		MOBS[i].id = i;
	for (var i in ITEMS)
		ITEMS[i].id = i;
})()
