# gambeboard-simulation-multi

![Gameboard Sim Multi](/img/gameboard_multi.gif "Gameboard Sim Multi")

## Summary
Pretend there is a 10 by 10 grid sketched out on a metal wall. You place a red and a blue marker on opposite corners of the grid. The markers take turns moving around randomly on the grid. The first marker to reach its destination wins.

`gameboard-simulation-multi` animates this scenario, updating the gameboard each time a marker moves and displaying results when the game ends. The red marker starts in the lower left corner and the blue one starts in the upper right. The game ends once the red marker reaches the upper right corner, the blue marker reaches the lower right corner, or each marker has moved over a million times.

## How to Start
If you would like to change the simulation speed (measured in frames per second), select a value from the dropdown list. Then click **Start Game**.

## Website
https://victoria-m.github.io/gameboard-simulation-multi/index.html

## Rules
- The markers take turns to move
- Red moves first
- If a marker lands on a cell already occupied by another marker, the marker that gets landed on is sent all the way back to its "home" cell. This only happens for the FINAL cell of a marker's move, not any intermediate cell.

## Steps
1. Randomly choose a `direction`: up, down, left, or right. Each direction should be equally likely to be chosen. This is accomplished in the `Marker` object's `prepareForMove` method.

2. Randomly choose a number of `steps`, either 0, 1, or 2. Each of these should be equally likely over the long haul. Similarly to `direction`, this is done in the `Marker`'s `prepareForMove` method.

3. The `Marker` object's `direction` and `steps` properties give us information about where the marker will move next. 
Try to move the marker whose turn it is currently using `Marker`'s `move` method. If that move would take you off the grid, go to the next step without moving the marker. Store each successful move's coordinates within a `Cell` object inside `Marker`'s `history` array.

4. If the other marker hasn't exceeded 1,000,000 moves (the marker has to actually move for it to count), it is then that marker's turn.

## Results
After the simulation is complete, the following information will be displayed below the animation:

- Winner
- Reason why game Ended
- Grid showing number of times each cell was touched by the markers
- Maximum number of touches for any cell
- Average number of touches for any cell
- Number of times red marker moved
- Number of times blue marker moved
- Number of times red marker was sent home
- Number of times blue marker was sent home

This information is contained within a `Result` object.
