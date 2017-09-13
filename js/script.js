'use strict'

// define globals
const MARGIN = 60, WIDTH = 50, HEIGHT = 50, FPS = 20, DIRECTIONS = ['up', 'right', 'down', 'left']
const MAX_MOVES = 1000000, RED = "red", BLUE = "blue"
var grid, redMarker, blueMarker, results, request, numRows, numCols

// set up the canvas and its context
var canvas = document.getElementById('canvas'), context = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

function main() {
  numCols = 10
  numRows = 10

  // instantiate the Grid, Marker, and Results
  grid = new Grid(numRows, numCols, HEIGHT, WIDTH, MARGIN)
  redMarker = new Marker(0, numRows - 1, RED)
  blueMarker = new Marker(numRows - 1, 0, BLUE)
  results = new Results()

  // initialize the animation loop
  window.requestAnimationFrame(step)
}

// define the grid
var Grid = function(numRows, numCols, height, width, margin) {
  this.numRows = numRows
  this.numCols = numCols
  this.height = height
  this.width = width
  this.margin = margin
}

Grid.prototype.draw = function(mainMarker, otherMarker) {
  for (var i = 0; i < this.numCols; ++i) {
    for (var j = 0; j < this.numRows; ++j) {
      // set the default fill color:
      context.fillStyle = 'black'

      // enforce boundaries for the markers:
      if (mainMarker.x < 0) mainMarker.x = 0
      if (mainMarker.y < 0) mainMarker.y = 0
      if (mainMarker.x > this.numCols - 1) mainMarker.x = this.numCols - 1
      if (mainMarker.y > this.numRows - 1) mainMarker.y = this.numRows - 1

      if (otherMarker.x < 0) otherMarker.x = 0
      if (otherMarker.y < 0) otherMarker.y = 0
      if (otherMarker.x > this.numCols - 1) otherMarker.x = this.numCols - 1
      if (otherMarker.y > this.numRows - 1) otherMarker.y = this.numRows - 1

      // set the marker fill color,
      if (mainMarker.x == i && mainMarker.y == j) { context.fillStyle = mainMarker.color }
      if (otherMarker.x == i && otherMarker.y == j) {context.fillStyle = otherMarker.color }

      // check for collision after drawing markers
      if (mainMarker.touching(otherMarker)) { otherMarker.goHome() }

      // fill the current rectangle:
      context.fillRect(i * this.margin, j * this.margin, this.width, this.height)
    }
  }
}

// define Marker
var Marker = function(x, y, color) {
  this.x = x
  this.y = y
  this.home = new Cell(this.x, this.y)
  this.color = color
  this.direction = ""
  this.steps = 0
  this.moving = true
  this.history = []

  // placing the marker counts as a touch
  this.history.push(new Cell(this.x, this.y))
}

Marker.prototype.prepareForMove = function() {
  // Step 1: generate direction
  this.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
  ++results.stepOneExecs

  // Step 2: generate step from 0 to 2
  this.steps = Math.floor(Math.random() * 3)
}

Marker.prototype.move = function() {
  this.prepareForMove()

  // Step 3: try to move the marker
  switch (this.direction) {
  case 'up':
    if (this.y - this.steps >= 0) this.y -= this.steps
    break
  case 'right':
    if (this.x + this.steps < grid.numCols) this.x += this.steps
    break
  case 'down':
    if (this.y + this.steps < grid.numRows) this.y += this.steps
    break
  case 'left':
    if (this.x - this.steps >= 0) this.x -= this.steps
    break
  }

  // Step 4: check if game ended:
  if (this.color == RED && this.x == grid.numCols - 1 && this.y == 0) {
    results.gameEndReason = RED + " marker reached right corner"
    this.moving = false
    blueMarker.moving = false
  }
  else if (this.color == RED && this.history.length > MAX_MOVES) { this.moving = false }

  if (this.color == BLUE && this.x == 0 && this.y == grid.numRows - 1) {
    results.gameEndReason = BLUE + " marker reached left corner"
    this.moving = false
    redMarker.moving = false
  }
  else if (this.color == BLUE && this.history.length > MAX_MOVES) {
    results.gameEndReason = "Both markers moved over the maximum of " + MAX_MOVES + " times"
    this.moving = false
  }

  // push to marker's move history if its position changes
  if ((this.history[this.history.length - 1].x != this.x) || (this.history[this.history.length - 1].y != this.y)) {
    this.history.push(new Cell(Math.abs(this.x), Math.abs(this.y)))
  }

}

// checks to see if the markers are touching
Marker.prototype.touching = function(otherMarker) {
  if(this.x == otherMarker.x && this.y == otherMarker.y) { return true }
  return false
}

// remember to redraw after they touch somewhere
Marker.prototype.goHome = function() {
  this.x = this.home.x
  this.y = this.home.y
}

// define Cell
var Cell = function (x, y) {
  this.x = x
  this.y = y
}

// describe a frame step
function step() {
  setTimeout(function() {
    request = requestAnimationFrame(step)

    if (redMarker.moving) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      redMarker.move()
      grid.draw(redMarker, blueMarker)
    }

    if (blueMarker.moving) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      blueMarker.move()
      grid.draw(blueMarker, redMarker)
    }

    if (!blueMarker.moving && !redMarker.moving) {
      window.cancelAnimationFrame(request)
      results.process()
      results.output(document.getElementById('results'))
    }
  }, 1000 / FPS)
}

var Results = function() {
  this.gameEndReason = ""
  this.stepOneExecs = 0
  this.cellTouches = new Array()
  this.maxTouches = 0
  this.minTouches = 0
  this.avgTouches = 0
}

Results.prototype.process = function() {
  // build the cell touches grid, fill it with 0's
  for (var i = 0; i < grid.numRows; ++i) {
    this.cellTouches[i] = new Array()
    for (var j = 0; j < grid.numCols; ++j) { this.cellTouches[i][j] = 0 }
  }

  // increment cell touches grid's indices for every set of marker coordinates
  for (var i = 0; i < marker.history.length; ++i) { ++this.cellTouches[marker.history[i].x][marker.history[i].y] }

  // get min, max, avg
  var sum = 0

  // initialize min to one of the cell touch values
  this.minTouches = this.cellTouches[0][0]

  for (var i = 0; i < this.cellTouches.length; ++i) {
    for (var j = 0; j < this.cellTouches[i].length; ++j) {
      if (this.cellTouches[i][j] > this.maxTouches) this.maxTouches = this.cellTouches[i][j]
      if (this.cellTouches[i][j] < this.minTouches) this.minTouches = this.cellTouches[i][j]
      sum += this.cellTouches[i][j]
    }
  }

  this.avgTouches = sum / (grid.numRows * grid.numCols)
}

Results.prototype.toHtml = function() {
  return "<h3>Number of step one executions</h3><p>" + this.stepOneExecs + "</p>\
          <h3>Reason why game ended</h3><p>" + this.gameEndReason + "</p>\
          <h3>Grid indicating number of times each cell was touched</h3>" + this.toHtmlTable(this.cellTouches) + "\
          <h3>Maximum number of touches for any cell</h3><p>" + this.maxTouches + "</p>\
          <h3>Minimum number of touches for any cell</h3><p>" + this.minTouches + "</p>\
          <h3>Average number of touches for any cell</h3><p>" + this.avgTouches + "</p>"
}

Results.prototype.toHtmlTable = function() {
  var table = "<table>"

  for (var i = 0; i < this.cellTouches.length; ++i) {
    table += "<tr>"
    for (var j = 0; j < this.cellTouches[i].length; ++j) { table += "<td>" + this.cellTouches[i][j] + "</td>" }
    table += "</tr>"
  }
  return table += "</table>"
}

Results.prototype.output = function(element) { element.innerHTML = this.toHtml() }
