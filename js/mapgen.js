Dungeon.prototype.generateDungeon = function(param) {
console.groupCollapsed("Generating Terrarian")
console.log(param)
	this.GENDUN(this.width, this.height, {
		  roomWidth: param.roomWidth,
		  roomHeight: param.roomHeight,
		  biasExponent: param.biasExponent,
		  deadEndChance: param.deadEndChance,
		  maxDeadEndLength: param.maxDeadEndLength
	})
	  param.overgrown = (param.overgrown) ? param.overgrown : 1

	this.start = [ this.rooms[0].getCenter()[0] -1, this.rooms[0].getCenter()[1]-1 ]
	  
	this.setTile(this.rooms[1].getCenter()[0], this.rooms[1].getCenter()[1], clone(TILES.trapdoor))
	if (param.createLedder){
	 	  this.setTile(this.rooms[0].getCenter()[0], this.rooms[0].getCenter()[1], clone(TILES.ledder))
	}
	  
	  
	var freeTiles = this.getFreeTiles()
	MYRANDOM.shuffle(freeTiles)
	  
	this.generateItems(MYRANDOM.randInt(6, 10), [
	"bandage",
	"bread",
	"minibread",
	"potion"
	], freeTiles)

	for (let i = 0; i < 4; i++) {
		let pos = freeTiles.pop()
		let x = pos[0]
		let y = pos[1]
		this.traps.push(new TILES.trap(x, y, MYRANDOM.choice(["line", "hline", "vline"]), true))
	}
	  this.placeFoil(MYRANDOM.randInt(5,15) * param.overgrown, freeTiles)
	  this.generatePlants(MYRANDOM.randInt(1, 8) * param.overgrown)

	// Main music.
	playBackgroundMusic()
console.groupEnd("Generating Terrarian")
}

Dungeon.prototype.generateArena = function(param) {
	  console.groupCollapsed("Generationg Terrarian")
	  console.log({param})
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
	  
	  console.groupEnd()
}



Dungeon.prototype.generateCave = function(param) {
	  console.groupCollapsed("Generating Terrarian")
	  console.log(param)
	this.GENCAVE(this.width, this.height, {
		  tiles: {
		  	  floor: TILES.rockground,
		  	  wall: TILES.rockwall,
		  	  empty: TILES.empty,
		  	  decor: []
		  },
		  spagetti: 4,
		  fat: 0.5
	})
	  
	  let freeTiles = this.getFreeTiles()
	  
	  let st = freeTiles[MYRANDOM.randInt(0, freeTiles.length)]
	  let et = freeTiles[MYRANDOM.randInt(0, freeTiles.length)]
	this.start = st
	// Exit.
	var caveExit = clone(TILES.ledder)
	this.setTile(this.start[0]-1, this.start[1]-1, caveExit)
	  var down = clone(TILES.trapdoor)
	this.setTile(et[0], et[1], down)
	  this.placeFoil(5 * param.overgrown + 5, freeTiles)
	  this.generatePlants(4 * param.overgrown + 5)
	// Items & mobs.
	// Artifact.
	console.groupEnd()
}

Dungeon.prototype.generateItems = function(amount, choices, freeTiles) {
	  for (var i = 0; i < amount; ++i) {
	  	  var item = MYRANDOM.choice(choices)
	  	  var pos = freeTiles.pop()
	  	  if (item) this.setItem(item, pos)
	  }
}

Dungeon.prototype.generateMobs = function(amount, choices, freeTiles) {
	for (var i = 0; i < amount; ++i) {
		var pos = freeTiles.pop()
		var mob = new Actor(pos[0], pos[1], MYRANDOM.choice(choices))
		this.actors.push(mob)
	}
}

Dungeon.prototype.spawnMobs = function(count) {
	for (var m = 0; m < count; ++m) {
		for (var i = 0; i < this.map.length; ++i) {
			var x = MYRANDOM.randInt(3, this.width-3)
			var y = MYRANDOM.randInt(3, this.height-3)
			if (this.getTile(x, y).walkable) {
				var mob = new Actor(x, y, MYRANDOM.choice(this.mobProtos))
				this.actors.push(mob)
				break
			}
		}
	}
}

Dungeon.prototype.placeFoil = function(amount, freeTiles) {
	  console.log("Placing "+amount+"/"+freeTiles.length+" foil tiles")
	  let starters = Math.ceil(amount * (MYRANDOM.randInt(10, 20) * 0.01))
	  let foilTiles = []
	  starters = (starters > 1) ? starters : 1
	  freeTiles = (freeTiles) ? freeTiles : this.getFreeTiles()
	  MYRANDOM.shuffle(freeTiles)
	  for (let i = 0; i < starters; i ++) {
	  	  amount --
	  	  let pos = freeTiles.pop()
	  	  if (!pos) break
	  	  let x = pos[0]
	  	  let y = pos[1]
	  	  this.setTile(x, y, TILES.dirt)
	  	  foilTiles.push([x, y])
	  }
	  for (i = 0; i < amount; i ++) {
	  	  let pos = foilTiles.pop()
	  	  if (!pos) continue
	  	  for (dy = -1; dy <= 1; dy ++) {
	  	  	  for (dx = -1; dx <= 1; dx ++) {
	  	  	  	  if (dx !== dy) if (pos[0] + dx > 0 && pos[0] + dx < this.width && pos[1] + dy > 0 && pos[1] + dy < this.height && Math.abs(dx) !== Math.abs(dy)) {
	  	  	  	  	  let lpos = [pos[0] + dx, pos[1] + dy]
	  	  	  	  	  if (this.getPassable(lpos[0], lpos[1])) {
	  	  	  	  	  	  this.setTile(lpos[0], lpos[1], TILES.dirt)
	  	  	  	  	  	  foilTiles.push(lpos)
	  	  	  	  	  	  MYRANDOM.shuffle(foilTiles)
	  	  	  	  	  	  break
	  	  	  	  	  }
	  	  	  	  }
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
	  MYRANDOM.shuffle(planttiles)
	  console.log("Placing "+amount+"/"+planttiles.length+" plants")
	  for (let i = 0; i < amount; i++) {
	  	  let pos = planttiles.pop()
	  	  if (!pos) continue
	  	  let x = pos[0]
	  	  let y = pos[1]
	  	  this.plants.push(new TILES.plants.grass(x, y))
	  }
}
