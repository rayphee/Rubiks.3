# Rubiks.3
A WebGL powered Rubik's cube emulator. This emulator has been designed to be
intuitive to use, configurable, and easy to extend. Hence, the code is not the
most performant, but nonetheless was structured to make it as readable as
possible.

## General Cube Interaction
To *move* the cube, simply drag your mouse anywhere to position it.

To *rotate a face*, do the following:
1. Look at the center cube of the face. Note its color
2. Consider which direction you want to rotate the face looking at it head on
  - If you want to rotate the cube clockwise, press the first letter of the
  color of the center cube
  - If you want to rotate the cube counterclockwise, do the same as you would
  for clockwise, but hold down shift while you are doing so

To *shuffle* the cube a predetermined number of steps, click the circular arrow
icon.

To *save* the emulation state, click the floppy disk icon.

To *load* a saved state, click the import icon and select the desired file.

To *adjust parameters* to your liking, press the settings icon and refer to the
"Adjusting Parameters" section.

## Adjusting Parameters
The following parameters are configurable to a reasonable degree:
- View Distance: How far you are from the cube
- Cube Inertia: How much "effort" you need to put to position the cube
- Rotation Duration: How long a rotation will take
- Number of Shuffle Moves: How many moves the shuffle button will make   
