'use strict'

// define globals
const MARGIN = 60, WIDTH = 50, HEIGHT = 50, DIRECTIONS = ['up', 'right', 'down', 'left']
const MAX_MOVES = 1000000, RED = "red", BLUE = "blue", NUM_ROWS = 10, NUM_COLS = 10
var fps, grid, redMarker, blueMarker, results, request, turn

// set up the canvas and its context
var canvas = document.getElementById('canvas'), context = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

function main() {
  // instantiate the Grid, Marker, and Results
  grid = new Grid(NUM_ROWS, NUM_COLS, HEIGHT, WIDTH, MARGIN)
  redMarker = new Marker(0, NUM_ROWS - 1, RED)
  blueMarker = new Marker(NUM_ROWS - 1, 0, BLUE)
  results = new Results()

  // set frames per second according to user's selection
  var fpsSelection = document.getElementById('speed')
  fps = fpsSelection.options[fpsSelection.selectedIndex].value

  // red makes first move
  turn = redMarker.color

  // initialize the animation loop
  window.requestAnimationFrame(step)
}

// define the grid
var Grid = function(NUM_ROWS, NUM_COLS, height, width, margin) {
  this.NUM_ROWS = NUM_ROWS
  this.NUM_COLS = NUM_COLS
  this.height = height
  this.width = width
  this.margin = margin
}

Grid.prototype.draw = function(mainMarker, otherMarker) {
  for (var i = 0; i < this.NUM_COLS; ++i) {
    for (var j = 0; j < this.NUM_ROWS; ++j) {
      // set the default fill color:
      context.fillStyle = 'black'

      // enforce boundaries for the markers:
      if (mainMarker.x < 0) mainMarker.x = 0
      if (mainMarker.y < 0) mainMarker.y = 0
      if (mainMarker.x > this.NUM_COLS - 1) mainMarker.x = this.NUM_COLS - 1
      if (mainMarker.y > this.NUM_ROWS - 1) mainMarker.y = this.NUM_ROWS - 1

      if (otherMarker.x < 0) otherMarker.x = 0
      if (otherMarker.y < 0) otherMarker.y = 0
      if (otherMarker.x > this.NUM_COLS - 1) otherMarker.x = this.NUM_COLS - 1
      if (otherMarker.y > this.NUM_ROWS - 1) otherMarker.y = this.NUM_ROWS - 1

      // set the markers' fill color,
      if (mainMarker.x == i && mainMarker.y == j) { context.fillStyle = mainMarker.color }
      if (otherMarker.x == i && otherMarker.y == j) {context.fillStyle = otherMarker.color }

      // fill the current rectangle:
      context.fillRect(i * this.margin, j * this.margin, this.width, this.height)

      // check for collision after drawing markers
      if (mainMarker.touching(otherMarker)) { otherMarker.goHome() }
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
  this.moves = 0
  this.wentHome = 0
  this.moving = true
  this.history = []

  // placing the marker counts as a touch
  this.history.push(new Cell(this.x, this.y))
}

Marker.prototype.prepareForMove = function() {
  // Step 1: generate direction
  this.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]

  // Step 2: generate step from 0 to 2
  this.steps = Math.floor(Math.random() * 3)
}

Marker.prototype.move = function() {
  this.prepareForMove()

  // Step 3: try to move the marker
  switch (this.direction) {
  case 'up':
    if (this.y - this.steps >= 0)  {
      this.y -= this.steps
      ++this.moves
    }
    break
  case 'right':
    if (this.x + this.steps < grid.NUM_COLS) {
      this.x += this.steps
      ++this.moves
    }
    break
  case 'down':
    if (this.y + this.steps < grid.NUM_ROWS) {
      this.y += this.steps
      ++this.moves
    }
    break
  case 'left':
    if (this.x - this.steps >= 0) {
      this.x -= this.steps
      ++this.moves
    }
    break
  }

  // Step 4: check if game ended:
  if (this.color == RED && this.x == grid.NUM_COLS - 1 && this.y == 0) {
    results.gameEndReason = RED + " marker reached upper right corner"
    results.winner = RED
    this.moving = false
    blueMarker.moving = false
  }
  else if (this.color == RED && this.history.length > MAX_MOVES) { this.moving = false }

  if (this.color == BLUE && this.x == grid.NUM_COLS - 1 && this.y == grid.NUM_ROWS - 1) {
    results.gameEndReason = BLUE + " marker reached lower right corner"
    results.winner = BLUE
    this.moving = false
    redMarker.moving = false
  }
  else if (this.color == BLUE && this.history.length > MAX_MOVES) {
    results.gameEndReason = "Both markers moved over the maximum of " + MAX_MOVES + " times"
    results.winner = "neither marker"
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

Marker.prototype.goHome = function() {
  this.x = this.home.x
  this.y = this.home.y
  ++this.wentHome
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

    // if it is red's move
    if (redMarker.moving && turn == redMarker.color) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      redMarker.move()
      grid.draw(redMarker, blueMarker)
      turn = blueMarker.color
    }
    // if it is blue's move
    else if (blueMarker.moving && turn == blueMarker.color) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      blueMarker.move()
      grid.draw(blueMarker, redMarker)
      if (redMarker.moving) { turn = redMarker.color }
    }

    // if game ends
    if (!blueMarker.moving && !redMarker.moving) {
      window.cancelAnimationFrame(request)
      results.process()
      results.output(document.getElementById('results'))
    }
  }, 1000 / fps)
}

function fillDropdown() {
  const MIN_FPS = 1, MAX_FPS = 50
  var speedDropdown = document.getElementById('speed')

  // fill the dropdown list with options ranging from min to max FPS
  for (var i = MIN_FPS; i <= MAX_FPS; ++i) {
    if (i % 5 == 0 || i == 2) { speedDropdown.options[speedDropdown.options.length] = new Option(i, i) }
  }

  // set the dropdown's default value
  speedDropdown.value = '5'
}

var Results = function() {
  this.gameEndReason = ""
  this.winner = ""
  this.redMoves = 0
  this.blueMoves = 0
  this.redWentHome = 0
  this.blueWentHome = 0
  this.cellTouches = new Array()
  this.maxTouches = 0
  this.avgTouches = 0
}

Results.prototype.process = function() {
  // build the cell touches grid, fill it with 0's
  for (var i = 0; i < grid.NUM_ROWS; ++i) {
    this.cellTouches[i] = new Array()
    for (var j = 0; j < grid.NUM_COLS; ++j) { this.cellTouches[i][j] = 0 }
  }

  // increment cell touches grid's indices for every set of marker coordinates in red marker
  for (var i = 0; i < redMarker.history.length; ++i) { ++this.cellTouches[redMarker.history[i].x][redMarker.history[i].y] }

  // increment cell touches grid's indices for every set of marker coordinates in blue marker
  for (var i = 0; i < blueMarker.history.length; ++i) { ++this.cellTouches[blueMarker.history[i].x][blueMarker.history[i].y] }

  // get max and average
  var sum = 0
  for (var i = 0; i < this.cellTouches.length; ++i) {
    for (var j = 0; j < this.cellTouches[i].length; ++j) {
      if (this.cellTouches[i][j] > this.maxTouches) this.maxTouches = this.cellTouches[i][j]
      sum += this.cellTouches[i][j]
    }
  }
  this.avgTouches = sum / (grid.NUM_ROWS * grid.NUM_COLS)

  // get number of moves for red and blue markers and number of times they were sent home
  this.redMoves = redMarker.moves
  this.blueMoves = blueMarker.moves

  this.redWentHome = redMarker.wentHome
  this.blueWentHome = blueMarker.wentHome
}

Results.prototype.toHtml = function() {
  return "<h3>Winner</h3><p>" + this.winner + "</p>\
          <h3>Reason why game ended</h3><p>" + this.gameEndReason + "</p>\
          <h3>Grid showing number of times each cell was touched by the markers</h3>" + this.toHtmlTable(this.cellTouches) + "\
          <h3>Maximum number of touches for any cell</h3><p>" + this.maxTouches + "</p>\
          <h3>Average number of touches for any cell</h3><p>" + this.avgTouches + "</p>\
          <h3>Number of times red marker moved</h3><p>" + this.redMoves + "</p>\
          <h3>Number of times blue marker moved</h3><p>" + this.blueMoves + "</p>\
          <h3>Number of times red marker was sent home</h3><p>" + this.redWentHome + "</p>\
          <h3>Number of times blue marker was sent home</h3><p>" + this.blueWentHome + "</p>"
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
