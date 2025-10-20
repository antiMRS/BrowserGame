TILES.trap = function(x, y, type, discov) {
	this.pos = [x, y]
	this.color = colorFromName(TRAP_EFFECTS[type])
	this.dchar = {
		"line": ["☰", "═", "𝄙"].random(),
		"vline": ["ꔖ", "〣", "॥"].random(),
		"hline": ["X", "╱", "⎽"].random()
	}[type]
	this.ch = (discov) ? this.dchar : "."
	this.type = type
	this.effect = POTIONS[TRAP_EFFECTS[type]].effect
	this.discovered = discov
	this.used = false
}
TILES.trap.prototype.StepOn = function(who) {
	if (who) who.effects.push(new Effect(who, {effect: this.effect, level: 1, duration: 5}))
	this.diactivate()
	this.discovered = true
}

TILES.trap.prototype.diactivate = function() {
	this.color = "#666"
	if (!this.discovered) this.ch = this.dchar
	this.used = true
}

/**  new Dungeon
 *(
 * id: number | string
 * mapType: "dungeon"
 * variant: [1;10]
 * size: [width, height]
 * param: {
 *  roomWidth: number,
 *  roomHeight: number,
 *  createLedder: bool,
 *  isFriendly: bool,
 *  isDoors: bool,
 *  biasExponent = number,        // >1 — тянет к 3; 2 по умолчанию
 *  deadEndChance = float,    // вероятность создания ветви для каждой комнаты (0..1)
 *  maxDeadEndLength = number,    // макс длина тупика
 *  tiles = {
 *    floor = TILES.floor,
 *    wall = TILES.wall,
 *    empty = TILES.empty,
 *  },
 *  icon = string,
 *  radius = number,
 *  overgrown = 1:10
 * }
 * )
 */

function Dungeon(id, mapType, variant, size, param) {
	console.group("Dungeon " + id)
	console.log("Type: " + mapType)
	console.log("Variant: " + variant)
	console.log("Size: " + size)
	this.id = id
	this.width = (size) ? size[0] : randInt(25, 30)
	this.height = (size) ? size[1] : randInt(25, 30)
	this.variant = (variant) ? variant : 1
	this.icon = (param) ? (param.icon) ? param.icon : "☍" : "☍"
	this.map = []
	this.actors = []
	this.doors = new Array()
	this.rooms = []
	this.traps = []
	this.plants = []
	this.start = [0,0]
	this.items = []
	this.passableCache = []
	this.playerFov = []
	this.mobProtos = []
	this.biome = {
		visionMult: 1,
	}
	var dispensators = {
		overworld: this.generateOverworld.bind(this),
		cave: this.generateCave.bind(this),
		dungeon: this.generateDungeon.bind(this),
		arena: this.generateArena.bind(this)
	}
	dispensators[mapType]((param) ? param : {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 2,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6
	})
	this.passableCache.length = this.map.length
	console.groupEnd("Dungeon " + id)
}

Dungeon.prototype.setItem = function(how, where) {
		var item = new Item(ITEMS[how])
		item.pos = where
		this.items.push(item)
}

Dungeon.prototype.getTile = function(x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return TILES.empty
	return this.map[y][x]
}

Dungeon.prototype.getTrapOn = function(x, y) {
	for (i = 0; i < this.traps.length; i++) {
		if (this.traps[i].pos[0] == x && this.traps[i].pos[1] == y) {
			return this.traps[i]
		}
	}
	return false
}

Dungeon.prototype.getPlantOn = function(x, y) {
	for (i = 0; i < this.plants.length; i++) {
		if (this.plants[i].pos[0] == x && this.plants[i].pos[1] == y) {
			return this.plants[i]
		}
	}
	return false
}

Dungeon.prototype.setTile = function(x, y, tile) {
	this.map[y][x] = typeof tile == "string" ? TILES[tile] : tile
}

Dungeon.prototype.getPassable = function(x, y) {
	return this.map[y][x].walkable
}

Dungeon.prototype.getTransparent = function(x, y) {
	return this.getTile(x, y).transparent
}

Dungeon.prototype.getFreeTiles = function() {
	let list = new Array(0)
	for (let y = 0; y < this.map.length; y++) {
		for (let x = 0; x < this.map[y].length; x++){
			if (this.map[y][x]) {
			if (this.map[y][x].walkable && !this.getTrapOn(x, y) && !this.getPlantOn(x, y)) list.push([x, y])
			}
		}
	}
	return list
}

Dungeon.prototype.findPath = function(x, y, actor) {
	for (var i = 0, l = this.map.length; i < l; ++i)
		this.passableCache[i] = this.map[i].walkable
	for (var i = 0, l = this.actors.length; i < l; ++i)
		if (this.actors[i] != actor)
			this.passableCache[this.actors[i].pos[0] + this.actors[i].pos[1] * this.width] = false

	var finder = new ROT.Path.AStar(x, y, this.getPassable.bind(this))
	var success = false
	actor.path = []
	finder.compute(actor.pos[0], actor.pos[1], function(x, y) {
		if (x != actor.pos[0] || y != actor.pos[1])
			actor.path.push([x, y])
		success = true
	})
	return success
}

Dungeon.prototype.update = function() {
	if (this.plants.length) if (world.plantTick % 10 === 0) {
		for (i = 0; i < this.plants.length; i++) {
			this.plants[i].Grow()
	 }
	}
}

Dungeon.prototype.drawCollection = function(stuff, camera, display, player, threshold) {
	for (var i = 0, l = stuff.length; i < l; ++i) {
		var thing = stuff[i]
		var visibility = player.visibility(thing.pos[0], thing.pos[1])
		if (visibility >= threshold) {
			var color = ROT.Color.fromString(thing.color)
			if (visibility < 1) ROT.Color.multiply_(color, [64, 64, 64])
			var x = thing.pos[0] - camera.pos[0]
			var y = thing.pos[1] - camera.pos[1]
			display.draw(x, y, thing.ch, ROT.Color.toHex(color))
		}
	}
}

Dungeon.prototype.draw = function(camera, display, player) {
	var w = display.getOptions().width
	var h = display.getOptions().height
	for (var j = 0; j < h; ++j) {
		for (var i = 0; i < w; ++i) {
			var x = i + camera.pos[0]
			var y = j + camera.pos[1]
			var visibility = player.visibility(x, y)
			var tile = visibility > 0 ? this.getTile(x, y) : TILES.empty
			var color = ROT.Color.fromString(tile.color)
			
			var ch = tile.ch
			//console.log(typeof tile.ch)
			if (typeof tile.ch === "object") {
  let s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  let frac = s - Math.floor(s); // дробная часть в [0,1)
  let c = Math.floor(frac * tile.ch.length)
				ch = tile.ch[c]
			}

			if (visibility < 1) ROT.Color.multiply_(color, [64, 64, 64])
			display.draw(i, j, ch, ROT.Color.toHex(color))
		}
	}
	this.drawCollection(this.traps, camera, display, player, 1)
	this.drawCollection(this.plants, camera, display, player, 1)
	this.drawCollection(this.items, camera, display, player, 1)
	this.drawCollection(this.actors, camera, display, player, 1)
}

Dungeon.prototype.collideCollection = function(stuff, pos) {
	for (var i = 0, l = stuff.length; i < l; ++i) {
		var thing = stuff[i]
		if (thing.pos[0] == pos[0] && thing.pos[1] == pos[1])
			return thing
	}
	return null
}

Dungeon.prototype.collide = function(pos) {
	var actor = this.collideCollection(this.actors, pos)
	if (actor) return actor
	var item = this.collideCollection(this.items, pos)
	if (item) return item
	return this.getTile(pos[0], pos[1])
}

// Creates a string representation of the entire map
// in the console, facilitating the creative process.
// Uncomment for development purposes only.

/* Dungeon.prototype.displayMap = function() {
    console.clear()
    var mapString = ''

    for (var j = 0; j < this.height; ++j) {
        for (var i = 0; i < this.width; ++i) {
            var x = i
            var y = j
            var tile = this.getTile(x, y)
            var color = tile.color || "#FFFFFF"
            mapString += tile.ch
        }
        mapString += '\n'
    }

    console.log(mapString)
} */
