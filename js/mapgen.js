Dungeon.prototype.generateDungeon = function(param) {
	"use strict"
	this.GENDUN(this.width, this.height, {
		  roomWidth: param.roomWidth,
		  roomHeight: param.roomHeight,
		  biasExponent: param.biasExponent,
		  deadEndChance: param.deadEndChance,
		  maxDeadEndLength: param.maxDeadEndLength
	})

	this.start = [ this.rooms[0].getCenter()[0] -1, this.rooms[0].getCenter()[1]-1 ]
	  
	this.setTile(this.rooms[1].getCenter()[0], this.rooms[1].getCenter()[1], clone(TILES.trapdoor))
	if (param.createLedder){
	 	  this.setTile(this.rooms[0].getCenter()[0], this.rooms[0].getCenter()[1], clone(TILES.ledder))
	}
	  
	  
	var freeTiles = this.getFreeTiles()
	shuffle(freeTiles)
	  
	this.generateItems(randInt(6, 10), [
	"bandage",
	"bread",
	"minibread",
	"potion"
	], freeTiles)

	for (let i = 0; i < 4; i++) {
		let pos = freeTiles.pop()
		let x = pos[0]
		let y = pos[1]
		this.traps.push(new TILES.trap(x, y, ["line", "hline", "vline"].random(), true))
	}

	// Main music.
	playBackgroundMusic()
}

Dungeon.prototype.generateArena = function(param) {
	  this.GENARENA(this.width, this.height, {
	  	  radius: (param.radius) ? param.radius : 10,
	  	  tiles: {
	  	  	  floor: TILES.sand,
	  	  	  wall: TILES.rockwall,
	  	  	  empty: TILES.empty
	  	  }
	  })
	  
	  let freeTiles = this.getFreeTiles()
	  
	  this.generateItems(3, [
	  "backpack"
	  ], freeTiles)
	  
	  this.start = this.rooms[0].getCenter()
	  let st = this.rooms[1].getCenter()
	  let et = this.rooms[2].getCenter()
	  this.setTile(st[0], st[1], TILES.ledder)
	  this.setTile(et[0], et[1], TILES.trapdoor)
}

Dungeon.prototype.generateOverworld = function() {
	this.env.oxygenCost = 1
	this.env.weatherString = "clear"
	this.env.weatherEnabled = true
	this.width = randInt(80, 100)
	this.height = randInt(60, 80)
	this.map = new Array(this.width * this.height)

	var gen = new ROT.Map.Arena(this.width, this.height)
	// General layout.
	var rocks = [ TILES.rock, TILES.rock2, TILES.rock2, TILES.rock3, TILES.rock3, TILES.rock4 ]
	var noise = new ROT.Noise.Simplex()
	var freeTiles = []
	var caveCandidates = []
	gen.create((function(x, y, wall) {
		var mountainNoise = noise.get(x/20, y/20)
		if (wall || mountainNoise > 0.5) {
			this.setTile(x, y, TILES.generateInstance(TILES.mountain))
		} else if ((x <= 1 || y <= 1 || x >= this.width-2 || y >= this.height-2) && Math.random() < 0.667) {
			this.setTile(x, y, TILES.generateInstance(TILES.mountain))
		} else if ((x <= 2 || y <= 2 || x >= this.width-3 || y >= this.height-3) && Math.random() < 0.333) {
			this.setTile(x, y, TILES.generateInstance(TILES.mountain))
		} else if (mountainNoise > 0.3) {
			this.setTile(x, y, TILES.generateInstance(TILES.hill))
		} else if (mountainNoise > 0.2) {
			this.setTile(x, y, TILES.generateInstance(TILES.hill))
			caveCandidates.push([x, y])
		} else if (rnd() > 0.95) {
			this.setTile(x, y, TILES.generateInstance(rocks.random()))
		} else {
			this.setTile(x, y, TILES.generateInstance(TILES.sand))
			freeTiles.push([x, y])
		}
	}).bind(this))

	shuffle(caveCandidates)
	var caveCount = Math.min(randInt(40, 45), caveCandidates.length)
	for (var i = 0; i < caveCount; ++i) {
		var cave = TILES.generateInstance(TILES.cave)
		var id = this.id + "_cave_" + i
		cave.entrance = { mapId: id, mapType: "cave" }
		var cavePos = caveCandidates.pop()
		this.setTile(cavePos[0], cavePos[1], cave)
	}

	shuffle(freeTiles)
	this.start = freeTiles.pop()
	// Air lock.
	var airlock = clone(TILES.airlock)
	airlock.entrance = { mapId: "base", mapType: "base" }
	this.setTile(this.start[0], this.start[1], airlock)
	// Items & mobs.
	this.mobProtos = [ MOBS.remorse, MOBS.compulsion, MOBS.withdrawal ]
	this.generateItems(randInt(10,15), [ ITEMS.distantmemories ], freeTiles)
	this.generateMobs(randInt(15,25), this.mobProtos, freeTiles)
}

Dungeon.prototype.generateCave = function() {
	this.GENCAVE(this.width, this.height, {
		  tiles: {
		  	  floor: TILES.dirt,
		  	  wall: TILES.rockwall,
		  	  empty: TILES.empty,
		  	  decor: []
		  },
		  spagetti: 4,
		  fat: 0.5
	})
	  
	  let freeTiles = this.getFreeTiles()
	  
	  let st = freeTiles[randInt(0, freeTiles.length)]
	  let et = freeTiles[randInt(0, freeTiles.length)]
	this.start = st
	// Exit.
	var caveExit = clone(TILES.ledder)
	this.setTile(this.start[0]-1, this.start[1]-1, caveExit)
	  var down = clone(TILES.trapdoor)
	this.setTile(et[0], et[1], down)
	  this.generatePlants(10)
	// Items & mobs.
	// Artifact.
	
}

Dungeon.prototype.generateItems = function(amount, choices, freeTiles) {
	  for (var i = 0; i < amount; ++i) {
	  	  var item = choices.random()
	  	  var pos = freeTiles.pop()
	  	  if (item) this.setItem(item, pos)
	  }
}

Dungeon.prototype.generateMobs = function(amount, choices, freeTiles) {
	for (var i = 0; i < amount; ++i) {
		var pos = freeTiles.pop()
		var mob = new Actor(pos[0], pos[1], choices.random())
		this.actors.push(mob)
	}
}

Dungeon.prototype.spawnMobs = function(count) {
	for (var m = 0; m < count; ++m) {
		for (var i = 0; i < this.map.length; ++i) {
			var x = randInt(3, this.width-3)
			var y = randInt(3, this.height-3)
			if (this.getTile(x, y).walkable) {
				var mob = new Actor(x, y, this.mobProtos.random())
				this.actors.push(mob)
				break
			}
		}
	}
}

Dungeon.prototype.generatePlants = function(amount) {
	  let planttiles = []
	  
	  for (let y = 0; y < this.map.length; y ++) for (let x = 0; x < this.map[y].length; x ++) {
	  	  if (this.map[y][x].fertile && this.map[y][x].walkable) {
	  	  	  planttiles.push([x, y])
	  	  }
	  }
	  shuffle(planttiles)
	  for (let i = 0; i < amount; i++) {
	  	  let p = planttiles.pop()
	  	  let x = p[0]
	  	  let y = p[1]
	  	  this.plants.push(new TILES.plant(x, y))
	  }
}
