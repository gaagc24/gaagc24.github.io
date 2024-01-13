/**
 * (c) 2018 Hendrik Roehm
 * Lattice uses a canvas to show operations of ZS3 on the lattice
 * 
 * Canvas has to contain the canvas reference to draw into
 * Objects can be provided through options.
 * Available options:
 *   gap: Distance between points
 *   animationSpeed: speed of the transformation animation
 */
function Lattice(canvas, options) {
  options = options || {};
  var context = canvas.getContext('2d');            
  var width = canvas.width;
  var height = canvas.height;
  // to be centered in the canvas, the shift seems to be needed
  var center = {
    x: width / 2 -2,
    y: height / 2 -2
  };
  var gap = options.gap ? options.gap : 20;
  var pointsPerDirection = "pointsPerDirection" in options
    ? options.pointsPerDirection
    : parseInt(Math.max(width, height) / gap)+3;
  if (pointsPerDirection % 2 == 1) {
    pointsPerDirection += 1;
  }
  var animationSpeed = "animationSpeed" in options ? options.animationSpeed : 1;
  var points = [];
  var basis = {
    e: [1, 0, 0, 1],
    t: [-1/2, Math.sqrt(3)/2, -Math.sqrt(3)/2, -1/2],
    tt: [-1/2, -Math.sqrt(3)/2, Math.sqrt(3)/2, -1/2],
    s: [-1, 0, 0, 1],
    st: [1/2, -Math.sqrt(3)/2, -Math.sqrt(3)/2, -1/2],
    stt: [1/2, Math.sqrt(3)/2, Math.sqrt(3)/2, -1/2]
  };

  var requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame;
  var cancelAnimationFrame = window.cancelAnimationFrame
    || window.mozCancelAnimationFrame;

  // initialize points
  for (var i=-pointsPerDirection/2; i<pointsPerDirection/2; i++) {
    for (var j=-pointsPerDirection/2; j<pointsPerDirection/2; j++) {
      var isCenter = i == 0 && j == 0;
      var x = (i+(j % 2)/2)*gap + center.x;
      var y = Math.sqrt(3)/2*j*gap + center.y;
      var size = isCenter ? 6 : 4;
      var fill = "black";
      var edge = false;
      if (j == -2 && i == 0) {
        fill = "red";
        edge = true;
      } else if (j == 1 && i == -2) {
        fill = "green";
        edge = true;
      } else if (j == 1 && i == 1) {
        fill = "blue";
        edge = true;
      }
      points.push({
        xOld: x,
        yOld: y,
        x: x,
        y: y,
        size: size,
        edge: edge,
        fill: fill
      });
    }
  }

  // transforms points without animation or redraw
  function transformWith(matrix) {
    var a11 = matrix[0];
    var a12 = matrix[1];
    var a21 = matrix[2];
    var a22 = matrix[3];
    points.forEach(function (p) {
      var xNew = a11*(p.x-center.x) + a21 * (p.y-center.y) + center.x;
      var yNew = a12*(p.x-center.x) + a22 * (p.y-center.y) + center.y;
      p.xOld = p.x;
      p.yOld = p.y;
      p.x = xNew;
      p.y = yNew;
    })
  }

  // transforms coefficients of basis into operation matrix
  function matrixFrom(coeff) {
    var op = [];
    for (var i=0; i<4; i++) {
      var number = 0;
      Object.keys(basis).forEach(function (b) {
        number += coeff[b] ? coeff[b] * basis[b][i] : 0;
      })
      op.push(number);
    }
    return op;
  }
  
  // renders the points onto the canvas
  // transitionRatio gives the advance of the animation (between 0 and 1)
  function render(transitionRatio) {
    // draw background
    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = "white";
    context.fill();

    // draw edges
    var firstEdge = true;
    context.beginPath();
    points.forEach(function (p) {
      var x = transitionRatio*p.x + (1-transitionRatio)*p.xOld;
      var y = transitionRatio*p.y + (1-transitionRatio)*p.yOld;
      if (!p.edge) {
        return;
      }

      if (firstEdge) {
        context.moveTo(x, y);
        firstEdge = false;
      } else {
        context.lineTo(x, y);
      }
    });
    context.closePath();
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.stroke();

    // draw points
    var edges = [];
    points.forEach(function (p) {
      var x = transitionRatio*p.x + (1-transitionRatio)*p.xOld;
      var y = transitionRatio*p.y + (1-transitionRatio)*p.yOld;
      context.beginPath();
      context.arc(x, y, p.size, 0, 2 * Math.PI, false);
      context.fillStyle = p.fill ? p.fill : "black";
      context.fill();
    });
  }

  var startTime;
  // renders one frame and triggers the next animation frame
  function animationFrame() {
    var time = Date.now();
    var elapsed = Math.min(1, animationSpeed*(time-startTime)/1000);
    render(elapsed);
    if (elapsed < 1) {
      requestAnimationFrame(animationFrame);
    }
  }

  // operates on lattice with coeff
  // options: duration
  this.operateWith = function(coeff, options) {
    transformWith(matrixFrom(coeff));
    startTime = Date.now();
    animationFrame();
  }

  // initial rendering
  render(1);
}
