var TERMINAL = {}

TERMINAL.OPTIONS = {
    output: true,
    input: true
}

TERMINAL._hidden = {}

TERMINAL._hidden.cash = {}

TERMINAL._hidden.blockout = function(what) {
    return function(input) {
        if (TERMINAL.OPTIONS.output) what(input)
    }
}

TERMINAL._hidden.blockin = function(what) {
    return function(input) {
        if (TERMINAL.OPTIONS.input) what(input)
    }
}

let bo = TERMINAL._hidden.blockout
let bi = TERMINAL._hidden.blockin

//Console methods wrappers

console.log = bo(console.log)
console.info = bo(console.info)
console.warn = bo(console.warn)
console.error = bo(console.error)
console.table = bo(console.table)
console.group = bo(console.group)
console.groupCollapsed = bo(console.groupCollapsed)
console.groupEnd = bo(console.groupEnd)
console.time = bo(console.time)
console.timeEnd = bo(console.timeEnd)