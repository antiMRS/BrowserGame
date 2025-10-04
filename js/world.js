let debugDisplay

function World() {
	"use strict"
	this.camera = { pos: [0, 0], center: [0, 0] }
  
	this.maps = {
		[1]: new Dungeon(1, "dungeon"),
		[2]: new Dungeon(2, "arena", 1, [30, 30], {
		  radius: 5
		  }),
	[3]: new Dungeon(3, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[4]: new Dungeon(4, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
[5]: new Dungeon(5, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[6]: new Dungeon(6, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[7]: new Dungeon(7, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[8]: new Dungeon(8, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[9]: new Dungeon(9, "dungeon", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true}),
	[10]: new Dungeon(10, "arena", 1, [15, 15], {
		  roomWidth: 6,
		  roomHeight: 4,
		  biasExponent: 1,
		  deadEndChance: 0.6,
		  maxDeadEndLength: 6,
			  createLedder: true})
	}
  
	this.dungeon = this.maps[1]
	this.currentActorIndex = 0
	this.roundTimer = 0
	this.running = true
	
	this.actor = NaN
	
	this.startTime = new Date()

	if (debugDisplay)
		for (let j = 0; j < this.dungeon.height; ++j)
			for (let i = 0; i < this.dungeon.width; ++i)
				if (!this.dungeon.map[i + j * this.dungeon.width].walkable)
					debugDisplay.draw(i, j, "#")
}

World.prototype.update = function() {
	if (Date.now() < this.roundTimer || !this.running)
		return
	while (this.dungeon.actors.length) {
		if (this.currentActorIndex >= this.dungeon.actors.length)
			this.currentActorIndex = 0
		var actor = this.dungeon.actors[this.currentActorIndex]
		if (!actor.act()) break
		actor.stats.turns++
		if (actor.health <= 0) {
			this.dungeon.actors.splice(this.currentActorIndex, 1)
			if (actor == ui.actor) {
				this.running = false
				ui.die()
				return
			}
		} else this.currentActorIndex++
		this.dungeon.update()
		if (actor == ui.actor) {
			actor.updateVisibility()
			break
		}
	}
	this.roundTimer = Date.now() + 100
}

World.prototype.changeMap = function(actor, entrance) {
	//console.log(actor === this.dungeon.actor)
	removeElem(this.dungeon.actors, actor)
	this.dungeon.start = clone(actor.pos)
	this.dungeon.playerFov = actor.fov
	if (!this.maps[entrance.mapId]) {
		this.maps[entrance.mapId] = new Dungeon(entrance.mapId, entrance.mapType)
	}
	this.dungeon = this.maps[entrance.mapId]
	this.dungeon.actors.push(actor)
	//console.log("Was",actor.pos)
	actor.teleportTo(this.dungeon.start[0], this.dungeon.start[1])
	//console.log("Go",actor.pos)
	actor.fov = this.dungeon.playerFov
	actor.updateVisibility()
	playEntranceEffect()
	this.currentActor = null
	console.log("Transfering to", entrance.mapId, "at", this.dungeon.start)
	ui.msg("Going To", this.dungeon.start)
	if (this.dungeon.mobProtos.length && this.dungeon.actors.length < 5) {
		this.dungeon.spawnMobs(randInt(4, 7))
	}
}
