////////////////////////////////////////////////////////////////////////////////
// SOME COMMENTS ABOUT PERFORMANCE
////////////////////////////////////////////////////////////////////////////////
// There are a lot of performance improvements that can be made for this project
// but to keep it simple and easy to read, I've taken the liberty to "expand"
// inline-able functions, create additional variables, have some stylistic
// choices and include some redundancy. Since this is Javascript anyways, most
// of these issues shouldn't  be the crux of why the program is slow; it's the
// language.
////////////////////////////////////////////////////////////////////////////////

/* WEBGL VARIABLES */
var canvas;
var gl;
var gl_frame;
var program;
var vertex_buffer, color_buffer;
var rotation_buffer = Array(4);
var _Pmatrix, _Vmatrix, _Mmatrix, _vertex, _color, _rotation;

/* MODEL, VIEW, PROJECTION VARIABLES */
var THETA = 27.25, PHI = 0, RADIUS = 6;
var projection_matrix;
var view_matrix;
var model_matrix = mat4(
  [0.7130621664325469, 0.00761028201361897, -0.701059505612903, 0],
  [-0.5359230484914033, 0.6506181988305392, -0.5380357287821984, 0],
  [-0.45202746918545994, -0.7593668698054852, -0.46800974791515976, 0],
  [0, 0, 0, 1]
); // mat4(1); Nice starting point, wanted to keep proportions

/* INTERACTION & ANIMATION VARIABLES */
var INERTIA = 0.93;
var PAN_COEFFICIENT = 3.5;
var SHUFFLE_STEPS = 30;
var drag = false;
var old_x, old_y;
var dX = 0, dY =0;
var locked = false;

/* CUBE CONSTANTS & VARIABLES */
const EPSILON = 0.001;
const CUBIE_DIMENSION = 0.46;
const CUBIE_GENERALIZED_VERTICES = [
  [-CUBIE_DIMENSION, -CUBIE_DIMENSION, -CUBIE_DIMENSION], // 0
  [-CUBIE_DIMENSION, -CUBIE_DIMENSION, CUBIE_DIMENSION], // z
  [-CUBIE_DIMENSION, CUBIE_DIMENSION, -CUBIE_DIMENSION], // y
  [-CUBIE_DIMENSION, CUBIE_DIMENSION, CUBIE_DIMENSION], // y,z
  [CUBIE_DIMENSION, -CUBIE_DIMENSION, -CUBIE_DIMENSION], // x
  [CUBIE_DIMENSION, -CUBIE_DIMENSION, CUBIE_DIMENSION], // x, z
  [CUBIE_DIMENSION, CUBIE_DIMENSION, -CUBIE_DIMENSION], // x, y
  [CUBIE_DIMENSION, CUBIE_DIMENSION, CUBIE_DIMENSION], // x, y, z
];

const YELLOW = [0.9, 0.85, 0, 1];
const GREEN = [0, 0.7, 0.2, 1];
const ORANGE = [1.0, 0.42, 0, 1];
const RED = [0.9, 0.2, 0.15, 1];
const BLUE = [0.2, 0.55, 0.7, 1];
const WHITE = [0.98, 0.98, 0.98, 1];
var ROTATION_TIME = 35;

var cube_state = [];
var vertices = [];
var colors = [];
var rotations = [[], [], [], []];

/* ARRAY PROTOTYPE MON(K)EY PATCHING */

Array.prototype.move = function (indices, new_indices) {
  if(new_index > -1 && new_index < this.length)
    var removed_element = this.splice(index, 1)[0];

  this.splice(new_index, 0, removed_element);
}

Array.prototype.rearrange = function (indices, new_indices) {
  var objects_to_move = [];

  if(indices.length != new_indices.length)
    return;
  for(var i=0; i<indices.length; i++) {
    objects_to_move.push(this[indices[i]]);
  }
  for(var i=0; i<indices.length; i++) {
    this[new_indices[i]] = objects_to_move[i];
  }
}

// An additional helper function
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/* INTERACTIVE FUNCTIONS */

var mouse_down = function(e) {
  drag = true;
  old_x = e.pageX, old_y = e.pageY;
  e.preventDefault();
  return false;
};

var mouse_up = function(e) {
  drag = false;
};

function key_handler(e) {
  switch(e.code) {
    case "KeyY":
      rotate_face("YELLOW", !e.shiftKey);
      break;
    case "KeyW":
      rotate_face("WHITE", !e.shiftKey);
      break;
    case "KeyO":
      rotate_face("ORANGE", !e.shiftKey);
      break;
    case "KeyR":
      rotate_face("RED", !e.shiftKey);
      break;
    case "KeyG":
      rotate_face("GREEN", !e.shiftKey);
      break;
    case "KeyB":
      rotate_face("BLUE", !e.shiftKey);
      break;
  }
}

var mouse_move = function(e) {
  if (!drag) return false;
  dX = (e.pageX-old_x)*2*Math.PI/canvas.width,
  dY = (e.pageY-old_y)*2*Math.PI/canvas.height;
  THETA += PAN_COEFFICIENT*dX;
  PHI += PAN_COEFFICIENT*dY;
  old_x = e.pageX, old_y = e.pageY;
  e.preventDefault();
};

// These functions could have been inlined for better performance, but appears
// as is for readability
function adjust_radius(radius) {
  view_matrix = mat4(
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, -RADIUS],
    [0, 0, 0, 1]
  );
}

function rotate_theta(angle, matrix) {
  return mult(rotateY(angle), matrix);
}

function rotate_phi(angle, matrix) {
  return mult(rotateX(angle), matrix);
}

async function rotate_cube(duration) {
  for(var i=0; i<100; i++) {
    THETA += i/1000;
    await sleep();
  }
  var old_theta = THETA;
  for(var i=0; i<duration; i++) {
    THETA = old_theta;
    await sleep();
  }
}

async function rotate_face(face, cw) {
  if(locked) return;
  locked = true;
  var current_indices = [];
  var new_indices = [];
  var axis;
  switch(face) {
    case "YELLOW":
      current_indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8);
      new_indices.push(2, 5, 8, 1, 4, 7, 0, 3, 6);
      axis = 'x';
      break;
    case "WHITE":
      current_indices.push(18, 19, 20, 21, 22, 23, 24, 25, 26);
      new_indices.push(20, 23, 26, 19, 22, 25, 18, 21, 24);
      axis = 'x';
      cw = !cw;
      break;
    case "ORANGE":
      current_indices.push(18, 9, 0, 21, 12, 3, 24, 15, 6);
      new_indices.push(0, 3, 6, 9, 12, 15, 18, 21, 24);
      axis = 'z';
      break;
    case "RED":
      current_indices.push(20, 11, 2, 23, 14, 5, 26, 17, 8);
      new_indices.push(2, 5, 8, 11, 14, 17, 20, 23, 26);
      axis = 'z';
      cw = !cw;
      break;
    case "GREEN":
      current_indices.push(0, 1, 2, 9, 10, 11, 18, 19, 20);
      new_indices.push(18, 9, 0, 19, 10, 1, 20, 11, 2);
      axis = 'y';
      break;
    case "BLUE":
      current_indices.push(6, 7, 8, 15, 16, 17, 24, 25, 26);
      new_indices.push(24, 15, 6, 25, 16, 7, 26, 17, 8);
      axis = 'y';
      cw = !cw;
      break;
  }
  cube_state.rearrange(current_indices, cw?new_indices:new_indices.reverse());
  await animate_cube(new_indices, axis, cw);
  if(is_cube_solved()) {
    $("#congrats").fadeIn(100);
  }
  else {
    $("#congrats").fadeOut(100);
  }
  locked = false;
}

async function animate_cube(indices, axis, cw) {
  var rotation_matrix;
  var aligning_matrix;
  var axes = vec3(0);
  var rotation = ROTATION_TIME;

  switch(axis) {
    case 'x':
      axes[0] = 1;
      break;
    case 'y':
      axes[1] = 1;
      break;
    case 'z':
      axes[2] = 1;
      break;
  }
  while(rotation > 0) {
    rotation_matrix = rotate(cw?(-90/ROTATION_TIME):(90/ROTATION_TIME), axes);
    for(var i=0; i<indices.length; i++) {
      aligning_matrix = cube_state[indices[i]].rotation;
      cube_state[indices[i]].rotation = mult(rotation_matrix, aligning_matrix);
    }
    rotation--;
    await sleep();
  }
  return;
}

function original_orientation(cs) {
  thetaX = Math.atan2(cs[2][1], cs[2][2])*180/Math.PI;
  if(Math.abs(thetaX) > EPSILON)
    return false;
  thetaY = Math.atan2(-cs[2][0], Math.hypot(cs[2][1], cs[2][2]))*180/Math.PI;
  if(Math.abs(thetaY) > EPSILON)
    return false;
  thetaZ = Math.atan2(cs[1][0], cs[0][0])*180/Math.PI;
  if(Math.abs(thetaZ) > EPSILON)
    return false;
  return true;
}

function is_cube_solved() {
  for(var i=0; i<cube_state.length; i++) {
    if(i == 4|
        i == 22|
        i == 12|
        i == 13|
        i == 14|
        i == 10|
        i == 16) // The center cubes' orientation does not matter
        continue;
    if(cube_state[i].cubie != i)
      return false;
    if(!original_orientation(cube_state[i].rotation))
      return false;
    cube_state[i].rotation = mat4(1);
  }
  return true;
}

async function shuffle() {
  rotate_cube(SHUFFLE_STEPS*33/35*ROTATION_TIME);
  for(var i=0; i<SHUFFLE_STEPS; i++) {
    var switch_val = Math.floor(Math.random()*12);
    var face;
    switch(switch_val%6) {
      case 0:
        face = "YELLOW";
      break;
      case 1:
        face = "WHITE";
      break;
      case 2:
        face = "ORANGE";
      break;
      case 3:
        face = "RED";
      break;
      case 4:
        face = "GREEN";
      break;
      case 5:
        face = "BLUE";
      break;
    }
    await rotate_face(face, (switch_val>5)?true:false);
  }
}

/* CUBE GENERATION FUNCTIONS */

function gen_face(a, b, c, d, rotation, color) {
  vertices.push(a, b, c, b, c, d);
  colors = colors.concat(Array(6).fill(color)); // Could have used push() 6x
  rotations[0] = rotations[0].concat(Array(6).fill(rotation[0])); // Same
  rotations[1] = rotations[1].concat(Array(6).fill(rotation[1])); // with
  rotations[2] = rotations[2].concat(Array(6).fill(rotation[2])); // rotation
  rotations[3] = rotations[3].concat(Array(6).fill(rotation[3])); // :)
}

function gen_cubie(cubie_state) {
  var position = cubie_state.position;
  if(!cubie_state.rotation.matrix) cubie_state.rotation.matrix = true;
  var rotation = transpose(cubie_state.rotation);
  var v = [];

  for(var i=0; i<CUBIE_GENERALIZED_VERTICES.length; i++) {
    v[i]=vec4(add(CUBIE_GENERALIZED_VERTICES[i], position),1);
  }
  gen_face(v[0], v[1], v[2], v[3], rotation, YELLOW); // 0, z, y, yz: yellow
  gen_face(v[0], v[1], v[4], v[5], rotation, GREEN); // 0, z, x, xz: green
  gen_face(v[0], v[2], v[4], v[6], rotation, ORANGE); // 0, y, x, xy: orange
  gen_face(v[1], v[3], v[5], v[7], rotation, RED); // z, zy, zx, xyz: red
  gen_face(v[2], v[3], v[6], v[7], rotation, BLUE); // y, xy, zy, xyz: blue
  gen_face(v[4], v[5], v[6], v[7], rotation, WHITE); // x, xy, xz, xyz: white
}

function generate_cube() {
  for(var i=0; i<27; i++) {
    gen_cubie(cube_state[i]);
  }
}

function initialize_cube() {
  // generate position matrices for each cubie
  var index = 0;
  for (var i=-1; i<=1; i++) {
    for (var j=-1; j<=1; j++) {
      for (var k=-1; k<=1; k++) {
        cube_state.push({
          cubie: index,
          position: vec3(i, j, k),
          rotation: mat4(1)
        });
        index++;
      }
    }
  }
}

/* GENERAL HOUSEKEEPING AND WEBSITE FUNCTIONS */

async function save_to_file() {
  if(locked) {
    setTimeout(save_to_file, 1);
    return;
  }
  var state = export_state();
  var file = new Blob([JSON.stringify(state)], {type: 'r3'});
  var filename = "saved_cube_state.r3";

  if(window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename);
  }
  else {
    var download_link = document.createElement("a");
    var url = URL.createObjectURL(file);
    download_link.href = url;
    download_link.download = filename;
    document.body.appendChild(download_link);
    download_link.click();
    setTimeout(function() {
      document.body.removeChild(download_link);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function export_state() {
  var saved_state = {
    radius: RADIUS,
    inertia: INERTIA,
    shuffle_steps: SHUFFLE_STEPS,
    rotation_time: ROTATION_TIME,
    model_matrix: model_matrix,
    cube_state: cube_state
  };
  return(saved_state);
}

function trigger_load(){
  document.getElementById("file_input").click();
  get_from_file();
}

function get_from_file() {
  var file_input = document.getElementById("file_input");
  var file_input_length = file_input.files.length;
  if(!file_input_length) {
    setTimeout(get_from_file, 1);
    return;
  }
  var file = file_input.files[file_input_length-1];
  var file_reader = new FileReader();

  file_reader.onload = stage_import;
  try {
    file_reader.readAsText(file);
  }
  catch (err) {
    alert("Unable to import saved cube state at file import stage")
  }
}

function stage_import(e) {
  var saved_state = JSON.parse(e.target.result);
  try {
    import_state(saved_state);
  }
  catch (err) {
    alert("Unable to import saved cube state at setting import stage");
  }
}

function import_state(state) {
  window.cancelAnimationFrame(gl_frame);
  $("#radius").val(state.radius);
  $("#radius").trigger('change');
  $("#inertia").val(state.inertia);
  $("#inertia").trigger('change');
  $("#shuffle_steps").val(state.shuffle_steps);
  $("#shuffle_steps").trigger('change');
  $("#rotation").val(state.rotation_time);
  $("#rotation").trigger('change');
  model_matrix = state.model_matrix;
  model_matrix.matrix = true; // this check ensures MV.js doesn't break
  cube_state = state.cube_state;
  window.requestAnimationFrame(render);
}

function show_settings() {
  $("#settings_panel").slideToggle();
}

/* INITIAL & RENDER FUNCTIONS */

window.onload = function init() {
  canvas = document.getElementById('glCanvas');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL failed to start");

  canvas.addEventListener("mouseup", mouse_up, false);
  canvas.addEventListener("mouseout", mouse_up, false);
  canvas.addEventListener("mousedown", mouse_down, false);
  canvas.addEventListener("mousemove", mouse_move, false);

  document.getElementById("shuffle").addEventListener("click", shuffle);
  document.getElementById("save").addEventListener("click", save_to_file);
  document.getElementById("load").addEventListener("mouseup", trigger_load);
  document.getElementById("settings").addEventListener("click", show_settings);

  document.onkeypress = key_handler;

  projection_matrix = perspective(50, canvas.width/canvas.height, 1, 10);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1, 1, 1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  vertex_buffer = gl.createBuffer();
  color_buffer = gl.createBuffer();
  rotation_buffer[0] = gl.createBuffer();
  rotation_buffer[1] = gl.createBuffer();
  rotation_buffer[2] = gl.createBuffer();
  rotation_buffer[3] = gl.createBuffer();

  _Pmatrix = gl.getUniformLocation(program, "Pmatrix");
  _Vmatrix = gl.getUniformLocation(program, "Vmatrix");
  _Mmatrix = gl.getUniformLocation(program, "Mmatrix");
  _vertex = gl.getAttribLocation(program, "vertex");
  _color = gl.getAttribLocation(program, "color");
  _rotation = gl.getAttribLocation(program, "rotation");

  initialize_cube();

  render();
}

function render() {
  RADIUS = document.getElementById("radius").value;
  INERTIA = document.getElementById("inertia").value;
  ROTATION_TIME = document.getElementById("rotation").value;
  SHUFFLE_STEPS = document.getElementById("shuffle_steps").value;

  THETA *= INERTIA;
  PHI *= INERTIA;

  adjust_radius(RADIUS);
  model_matrix = rotate_theta(THETA, model_matrix);
  model_matrix = rotate_phi(PHI, model_matrix);

  vertices = [];
  colors = [];
  rotations = [[], [], [], []];

  generate_cube();

  gl.uniformMatrix4fv(_Pmatrix, false, flatten(projection_matrix));
  gl.uniformMatrix4fv(_Vmatrix, false, flatten(view_matrix));
  gl.uniformMatrix4fv(_Mmatrix, false, flatten(model_matrix));

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(_vertex, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_vertex);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(_color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_color);

  for(var i=0; i<4; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, rotation_buffer[i]);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rotations[i]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(_rotation+i, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(_rotation+i);
  }

  gl.drawArrays(gl.TRIANGLES, 0, 972);
  gl_frame = window.requestAnimationFrame(render);
}
