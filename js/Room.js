class Room {
    constructor(x,y,w,h) {
        	"use strict"
        	this.x = x
        	this.y = y
        	this.w = w
        	this.h = h
    }
    getCenter() {
        print("test")
        return [Math.floor(this.w/2 + this.x), Math.floor(this.h/2 + this.y)]
    }
}