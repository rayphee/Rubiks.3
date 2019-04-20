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
  color of the center cube. For example, if you'd like to move the face with an
  orange center clockwise, press <kbd> o </kbd>
  - If you want to rotate the cube counterclockwise, do the same as you would
  for clockwise, but hold down shift while you are doing so. For example, if
  you'd like to move the face with a yellow center clockwise, press
  <kbd> shift </kbd> + <kbd> y </kbd>

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

## Future improvements
There are (obviously) many things to do to make this project better. Here are a
list of things I'd like to add/improve on (at some point):
- Rewrite the program so it's better organized (i.e. using classes, better
  separation of cube logic from rendering logic, etc.)
- Modularize the program so it's easier to extend (i.e. change the dimension of
  the cube, change the shape, etc.)
- Make the controls more intuitive (i.e. not _solely_ rely on the keyboard to
  interface with the cube, make it easier for mobile users to use the program)
