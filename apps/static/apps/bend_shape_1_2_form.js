

$.fn.hasExtension = function(exts) {
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test($(this).val());
}

function rot(point, angle){
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var newpoint = new Object();
  newpoint.x = point.x * c - point.y * s;
  newpoint.y = point.x * s + point.y * c;
  return newpoint;
}


jQuery(function() {
  var img_scale = 1;
  var cvs2 = document.createElement("canvas");
  var ctx2 = cvs2.getContext("2d");
  var objDrawFuncs = {};
  var lineListeners = [];
  var hasFocus = -1;
  var pixel_dist = 1;
  var known_dist = 0;
  var known_unit = "";
  var Ry = 0;
  var Rz = 0;
  var min_R = 0;
  var min_t = 0;
  var min_R_y = 0;
  var min_R_z = 0;
  var arc_length = 0;
  var output_freq = 400;
  var curve;

  var ct= 0;

  var fix = function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement,
        rect = target.getBoundingClientRect();
    e.offsetX = e.clientX - rect.left;
    e.offsetY = e.clientY - rect.top;
  };

  //var Bezier = require('bezier-js');
  // bezier curve stuff
  function handleCurveInteraction(cvs) {
    curve.mouse = false;
    var lpts = curve.points.slice();
    lpts.push(curve.apex);
    //console.log(curve.points);
    var moving = false, mx = my = ox = oy = 0, cx, cy,cx2, cy2, mp = -1, mp2= -1;
    //var apex_move = false;

    var handler = { onupdate: function() {} };

    cvs.addEventListener("mousedown", function(evt) {
      //console.log(hasFocus);
      if (hasFocus == -1){
        fix(evt);
        mx = evt.offsetX;
        my = evt.offsetY;
        for (let i=0; i< lpts.length; i++){
          let p = lpts[i];
          if(Math.abs(mx-p.x)<10 && Math.abs(my-p.y)<10) {
            moving = true;
            mp = i;
            cx = p.x;
            cy = p.y
            switch (i){
              case 0:
                mp2 = 1;
                break;
              case 3:
                mp2 = 2;
                break;
              default:
                mp2 = -1;
                break;
            }
            if (mp2 != -1){
              cx2 = lpts[mp2].x;
              cy2 = lpts[mp2].y;
            }
            hasFocus = 1;
          }
        }

      }
    }, false);

    cvs.addEventListener("mousemove", function(evt) {
      fix(evt);
      var found = false;

      if(!lpts) return;
      for (let i = 0; i < lpts.length; i++){
        let p = lpts[i];
        let mx = evt.offsetX;
        let my = evt.offsetY;
        if(Math.abs(mx-p.x)<10 && Math.abs(my-p.y)<10) {
          found = found || true;
          //console.log("curve found!");
        }
      }

      cvs.style.cursor = found ? "pointer" : "default";
      //console.log(cvs.style.cursor);

      if(!moving) {
        return handler.onupdate(evt);
      }
      if (hasFocus == 1){
        ox = evt.offsetX - mx;
        oy = evt.offsetY - my;
        if (mp == 4){
          let p = curve.project({x: evt.offsetX, y: evt.offsetY});
          apex = Object.assign(apex, p);
        } else {
          lpts[mp].x = cx + ox;
          lpts[mp].y = cy + oy;
          if (mp2 != -1){
            lpts[mp2].x = cx2 + ox;
            lpts[mp2].y = cy2 + oy;
          }
          curve.update();
          let new_apex = curve.get(curve.apex.t);
          apex = Object.assign(curve.apex, new_apex)

        }
        handler.onupdate();
      }
    }, false);

    cvs.addEventListener("mouseup", function(evt) {
      if(!moving) return;
      moving = false;
      mp = -1;
      mp2 = -1;
      hasFocus = -1;
      cvs.style.cursor = "default";

      output_curve(output_freq, known_dist / pixel_dist );
    }, false);

    cvs.addEventListener("click", function(evt) {
      fix(evt);
      var mx = evt.offsetX;
      var my = evt.offsetY;
    }, false);

    return handler;
  }

  function handleLineInteraction(cvs, line) {
    var lpts = [line.p1, line.p2];
    var moving = false, mx = my = ox = oy = 0, cx, cy, mp = false;

    var handler = { onupdate: function() {} };
    function lineMouseDown(evt){
      if ( ($("#scalebar_bool").prop('checked')) && (hasFocus == -1)) {
        fix(evt);
        mx = evt.offsetX;
        my = evt.offsetY;
        lpts.forEach(function(p) {
          if(Math.abs(mx-p.x)<10 && Math.abs(my-p.y)<10) {
            moving = true;
            mp = p;
            cx = p.x;
            cy = p.y;
            hasFocus = 2;
          }
        });
      }
    }
    function lineMouseMove(evt){

        fix(evt);
        var found = false;

        if(!lpts) return;
        lpts.forEach(function(p) {
          var mx = evt.offsetX;
          var my = evt.offsetY;
          if(Math.abs(mx-p.x)<10 && Math.abs(my-p.y)<10) {
            found = found || true;
          }
        });
        cvs.style.cursor = (found || cvs.style.cursor == "pointer") ? "pointer" : "default";

        if(!moving) {
          return handler.onupdate(evt);
        }
      if (($("#scalebar_bool").prop('checked')) && (hasFocus == 2)) {
        ox = evt.offsetX - mx;
        oy = evt.offsetY - my;
        mp.x = cx + ox;
        mp.y = cy + oy;

        handler.onupdate();

      }
    }
    function lineMouseUp(evt){
      if ($("#scalebar_bool").prop('checked')) {
        if(!moving) return;
        // console.log(curve.points.map(function(p) { return p.x+", "+p.y; }).join(", "));
        moving = false;
        mp = false;
        hasFocus = -1;
        cvs.style.cursor = "default";
        output_curve( output_freq, known_dist / pixel_dist);
      }
    }
    function lineClick(evt){
      if ($("#scalebar_bool").prop('checked')) {
        fix(evt);
        var mx = evt.offsetX;
        var my = evt.offsetY;
      }
    }
    lineListeners = [lineMouseDown, lineMouseMove, lineMouseUp, lineClick];

    cvs.addEventListener("mousedown", lineMouseDown, false);
    cvs.addEventListener("mousemove", lineMouseMove, false);
    cvs.addEventListener("mouseup", lineMouseUp, false);
    cvs.addEventListener("click", lineClick, false);

    return handler;
  }

  function bindDrawFunctions(idx) {

    var figure = $("figure")[0];
    var cvs = $("canvas")[0];
    var ctx = cvs.getContext("2d");

    var randomColors = [];
    for(var i=0,j; i<360; i++) {
      j = (i*47)%360;
      randomColors.push("hsl("+j+",50%,50%)");
    }
    var randomIndex = 0;


    return {
      getCanvas: function() { return cvs; },

      reset: function(curve, evt) {
        //cvs.width = cvs.width;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.drawImage(cvs2, 0, 0);
        ctx.strokeStyle = "black";
        if (evt && curve) {
          curve.mouse = {x: evt.offsetX, y: evt.offsetY};
        }
        randomIndex = 0;
      },

      setColor: function(c) {
        ctx.strokeStyle = c;
      },

      noColor: function(c) {
        ctx.strokeStyle = "transparent";
      },

      setRandomColor: function() {
        randomIndex = (randomIndex+1) % randomColors.length;
        var c = randomColors[randomIndex];
        ctx.strokeStyle = c;
      },

      setRandomFill: function(a) {
        randomIndex = (randomIndex+1) % randomColors.length;
        a = (typeof a === "undefined") ? 1 : a;
        var c = randomColors[randomIndex];
        c = c.replace('hsl(','hsla(').replace(')',','+a+')');
        ctx.fillStyle = c;
      },

      setFill: function(c) {
        ctx.fillStyle = c;
      },

      noFill: function() {
        ctx.fillStyle = "transparent";
      },

      drawSkeleton: function(curve, offset, nocoords) {
        offset = offset || { x:0, y:0 };
        var pts = curve.points;
        ctx.strokeStyle = "lightgrey";
        this.drawLine(pts[0], pts[1], offset);
        if(pts.length === 3) { this.drawLine(pts[1], pts[2], offset); }
        else {this.drawLine(pts[2], pts[3], offset); }
        ctx.strokeStyle = "black";
        if(!nocoords) this.drawPoints(pts, offset);
      },

      drawCurve: function(curve, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        var p = curve.points, i;
        ctx.moveTo(p[0].x + ox, p[0].y + oy);
        if(p.length === 3) {
          ctx.quadraticCurveTo(
            p[1].x + ox, p[1].y + oy,
            p[2].x + ox, p[2].y + oy
          );
        }
        if(p.length === 4) {
          ctx.bezierCurveTo(
            p[1].x + ox, p[1].y + oy,
            p[2].x + ox, p[2].y + oy,
            p[3].x + ox, p[3].y + oy
          );
        }
        ctx.stroke();
        ctx.closePath();
      },

      drawLine: function(p1, p2, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        ctx.moveTo(p1.x + ox,p1.y + oy);
        ctx.lineTo(p2.x + ox,p2.y + oy);
        ctx.stroke();
      },

      drawPoint: function(p, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, 5, 0, 2*Math.PI);
        ctx.stroke();
      },

      drawPoints: function(points, offset) {
        offset = offset || { x:0, y:0 };
        points.forEach(function(p) {
          this.drawCircle(p, 3, offset);
        }.bind(this));
      },

      drawArc: function(p, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        ctx.moveTo(p.x + ox, p.y + oy);
        ctx.arc(p.x + ox, p.y + oy, p.r, p.s, p.e);
        ctx.lineTo(p.x + ox, p.y + oy);
        ctx.fill();
        ctx.stroke();
      },

      drawCircle: function(p, r, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, r, 0, 2*Math.PI);
        ctx.stroke();
      },

      drawbbox: function(bbox, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        ctx.beginPath();
        ctx.moveTo(bbox.x.min + ox, bbox.y.min + oy);
        ctx.lineTo(bbox.x.min + ox, bbox.y.max + oy);
        ctx.lineTo(bbox.x.max + ox, bbox.y.max + oy);
        ctx.lineTo(bbox.x.max + ox, bbox.y.min + oy);
        ctx.closePath();
        ctx.stroke();
      },

      drawHull: function(hull, offset) {
        ctx.beginPath();
        if(hull.length === 6) {
          ctx.moveTo(hull[0].x, hull[0].y);
          ctx.lineTo(hull[1].x, hull[1].y);
          ctx.lineTo(hull[2].x, hull[2].y);
          ctx.moveTo(hull[3].x, hull[3].y);
          ctx.lineTo(hull[4].x, hull[4].y);
        } else {
          ctx.moveTo(hull[0].x, hull[0].y);
          ctx.lineTo(hull[1].x, hull[1].y);
          ctx.lineTo(hull[2].x, hull[2].y);
          ctx.lineTo(hull[3].x, hull[3].y);
          ctx.moveTo(hull[4].x, hull[4].y);
          ctx.lineTo(hull[5].x, hull[5].y);
          ctx.lineTo(hull[6].x, hull[6].y);
          ctx.moveTo(hull[7].x, hull[7].y);
          ctx.lineTo(hull[8].x, hull[8].y);
        }
        ctx.stroke();
      },

      drawShape: function(shape, offset) {
        offset = offset || { x:0, y:0 };
        var order = shape.forward.points.length - 1;
        ctx.beginPath();
        ctx.moveTo(offset.x + shape.startcap.points[0].x, offset.y + shape.startcap.points[0].y);
        ctx.lineTo(offset.x + shape.startcap.points[3].x, offset.y + shape.startcap.points[3].y);
        if(order === 3) {
          ctx.bezierCurveTo(
            offset.x + shape.forward.points[1].x, offset.y + shape.forward.points[1].y,
            offset.x + shape.forward.points[2].x, offset.y + shape.forward.points[2].y,
            offset.x + shape.forward.points[3].x, offset.y + shape.forward.points[3].y
          );
        } else {
          ctx.quadraticCurveTo(
            offset.x + shape.forward.points[1].x, offset.y + shape.forward.points[1].y,
            offset.x + shape.forward.points[2].x, offset.y + shape.forward.points[2].y
          );
        }
        ctx.lineTo(offset.x + shape.endcap.points[3].x, offset.y + shape.endcap.points[3].y);
        if(order === 3) {
          ctx.bezierCurveTo(
            offset.x + shape.back.points[1].x, offset.y + shape.back.points[1].y,
            offset.x + shape.back.points[2].x, offset.y + shape.back.points[2].y,
            offset.x + shape.back.points[3].x, offset.y + shape.back.points[3].y
          );
        } else {
          ctx.quadraticCurveTo(
            offset.x + shape.back.points[1].x, offset.y + shape.back.points[1].y,
            offset.x + shape.back.points[2].x, offset.y + shape.back.points[2].y
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },

      drawText: function(text, offset) {
        offset = offset || { x:0, y:0 };
        ctx.fillText(text, offset.x, offset.y);
      }
    };
  }

  function find_intersection(p1, p2, d1, d2){
    var del = {x: p1.x - p2.x, y: p1.y - p2.y};
    var det = -d2.x * d1.y + d1.x * d2.y;
    var det_a = -del.x * d1.y + d1.x * del.y;
    var det_b = d2.x * del.y - del.x * d2.y;
    var a = det_a / det;
    var b = det_b / det;
    return {x: p2.x + a * d2.x, y: p2.y + a* d2.y};
  }

  function find_distance(p1, p2){
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  function draw_spokes(dfs){
    // draw a spoke at every 50 unit
    let scale = (known_dist == 0) ? 1: known_dist / pixel_dist;

    with(dfs){
      let LUTpoints = curve.getLUT(output_freq);
      let LUTdists = [0];
      for (let t = 0 ; t < LUTpoints.length - 1; t++){
        LUTdists.push(find_distance(LUTpoints[t], LUTpoints[t + 1]) * scale);
      }
      //console.log(LUTdists.reduce((a, b) => a+ b, 0));
      //console.log(curve.length());

      // populate an array of t's such that they're all closest to 50 units
      let t_marks = [];
      let interval = 50;
      let curr_int = 50;
      let curr_sum = 0;

      for (t = 1; t < LUTdists.length - 1; t++){
        curr_sum += LUTdists[t];
        if (Math.abs(curr_sum - curr_int) < Math.abs(curr_sum + LUTdists[t + 1] - curr_int)) {
          curr_int += interval;
          t_marks.push(t);
        };
      }
      //console.log(t_marks);

      let nv_scale = 5;
      for (tm of t_marks){
        let nv = curve.normal(tm / output_freq);
        let pt = curve.get(tm/ output_freq)
        setColor("#FF0000");
        drawLine({x: pt.x - nv_scale * nv.x, y: pt.y - nv_scale * nv.y}, {x: pt.x + nv_scale * nv.x, y: pt.y + nv_scale * nv.y});
      }
    }
  }


  function draw_cross(dfs){
    with (dfs){
      // draw the tangent line
      var apex = curve.apex;
      var apex_t = apex.t;
      var derivative = curve.derivative(apex_t)
      var apex_derivative = {x: apex.x, y: apex.y};
      apex_derivative.x += derivative.x;
      apex_derivative.y += derivative.y;

      drawPoint(apex);
      //drawLine(apex, apex_derivative);

      // find out which side are p1 and p4 on
      var p1 = curve.points[0];
      var p4 = curve.points[3];
      var same_side = 1;
      for (pt of [p1, p4]){
        same_side *= Math.sign((derivative.x) * (pt.y - apex.y) - (derivative.y) * (pt.x - apex.x));
      }
        // if they're on the opposite side, return false
      if (same_side <= 0){
        //console.log("Not on the same side");

        return false;
      }
      // extend the normal (l1) from the apex towards the p1 and p4
      var normal = curve.normal(apex_t);
      // use Cramer's rule to find the intersection
      var intersection = find_intersection(apex, p1, normal, derivative);
      setColor("#FFFF00");
      //drawPoint(intersection);
      drawLine(apex, intersection);
      drawLine(p1, intersection);
      // draw a vertical line intersecting l1 and l2 from p1 to the end point of l2 (below)
      var intersection2 = find_intersection(p1, p4, derivative, normal);
      drawLine(p1, intersection2);

      // draw a dotted line l2 parallel to l1 from p4
      var ctx = getCanvas().getContext("2d");
      ctx.setLineDash([3, 3]);
      drawLine(p4, intersection2);
      // draw an extension to l1
      let extension = 10;
      ext_pt = {x: (intersection.x - apex.x) * extension + apex.x, y: (intersection.y - apex.y) * extension + apex.y}
      drawLine(intersection, ext_pt);
      ext_pt1 = find_intersection(ext_pt, p1, derivative, normal);
      ext_pt4 = find_intersection(ext_pt, p4, derivative, normal);
      drawLine(ext_pt1, p1);
      drawLine(ext_pt4, p4);
      drawLine(ext_pt1, ext_pt4);
      ctx.setLineDash([]);

      // update the Ry and Rz boxes
      Ry = find_distance(apex, intersection);
      Rz = find_distance(p1, intersection2) / 2;

      if (known_dist == 0){
        $('#Ry_display').val(Number(Ry).toFixed(2));
        $('#Rz_display').val(Number(Rz).toFixed(2));
        $('#min_R_display').val(Number(min_R).toFixed(2));
        $('#arc_display').val(Number(arc_length).toFixed(2));
        //$('#min_R_y_display').val(Number(min_R_y).toFixed(2));
        //$('#min_R_z_display').val(Number(min_R_z).toFixed(2));
      } else {
        $('#Ry_display').val(Number(Ry / pixel_dist * known_dist).toFixed(2));
        $('#Rz_display').val(Number(Rz / pixel_dist * known_dist).toFixed(2));
        $('#min_R_display').val(Number(min_R / pixel_dist * known_dist).toFixed(2));
        $('#arc_display').val(Number(arc_length / pixel_dist * known_dist).toFixed(2));
        //$('#min_R_y_display').val(Number(min_R_y / pixel_dist * known_dist).toFixed(2));
        //$('#min_R_z_display').val(Number(min_R_z / pixel_dist * known_dist).toFixed(2));
      }

    }
  }

  function bezier_draw(){
    (function(drawfunctions) {
      with(drawfunctions) {
        with(Math) {
          let w = getCanvas().width;
          let h = getCanvas().height;
          curve = new Bezier(max(w / 2-50, 10),max(h / 2-50, 10),
                                min(w / 2 + 50, w-10),max(h/2-50, 10),
                                min(w/2 + 50, w-10), min(h/2 +50, h-10),
                                max(w/2-50, 10), min(h/2+50, h-10));
          var apex_t = 0.5;
          var apex = curve.get(apex_t);
          apex.t = apex_t;
          curve.apex = apex;
          var draw = function() {
            drawSkeleton(curve);
            setColor("#00FF00");
            drawCurve(curve);
            setFill('#777777');
            drawText("large PET edge", {
              x: curve.points[0].x - 30,
              y: curve.points[0].y - 10,
            });
            drawText("small PET edge", {
              x: curve.points[3].x - 30,
              y: curve.points[3].y - 10,
            });

            // find the minimum radius location and draw a blue circle
            let min_curvature = Math.abs(curve.curvature(0).r);
            for (let t = 1; t <= output_freq; t++){
              //console.log(Math.abs(curve.curvature(t / output_freq).r) + " vs. " + min_curvature);
              //console.log(min_curvature);
              if (Math.abs(curve.curvature(t / output_freq).r) < min_curvature){
                min_t = t;
                min_curvature = Math.abs(curve.curvature(t / output_freq).r);
              }
            }
            setColor("#0000FF");
            drawCircle(curve.get(min_t / output_freq), 3);
            //console.log(min_t);
            //console.log("----------------------");
            min_R = Math.abs(curve.curvature(min_t / output_freq).r);
            arc_length = curve.length();


            //console.log("drawing apex");
            //console.log(apex);
            setColor("#00FF00");
            draw_cross(drawfunctions);

            draw_spokes(drawfunctions);
            //reset colors
            //setColor("#000000");
            //setFill("#000000");
          };
          objDrawFuncs.curveDraw = draw;

          draw();
          handleCurveInteraction(getCanvas()).onupdate = function(evt) {
            reset();
            for (const drawFunc in objDrawFuncs) {
              objDrawFuncs[drawFunc](evt);
            }
          }
        }
      }
    } (bindDrawFunctions( 0 ))
   );

  }

  function output_curve(freq, scale = 1){
    var normal = curve.normal(curve.apex.t);
    var LUTpoints = [...curve.getLUT(steps= freq)];
    LUTpoints.push(curve.get(1));
    var hangle = (normal.x == 0) ?  Number.MAX_SAFE_INTEGER: Math.atan(normal.y / normal.x)
    var output = [];

    if (known_dist == 0){
      scale = 1;
    }

    for (let p = 1; p < LUTpoints.length; p++){
      // perform a translation such that p1 is at 0, 0 and p4 is at +y
      LUTpoints[p] = {x: LUTpoints[p].x - LUTpoints[0].x, y:LUTpoints[p].y - LUTpoints[0].y};
      // perform a rotation such that the normal line is horizontal
      LUTpoints[p] = rot(LUTpoints[p], -hangle);
    }
    LUTpoints[0] = {x: 0, y: 0};

    // if p4 is negative then flip it
    if (LUTpoints[LUTpoints.length - 1].y < 0){
      //console.log("y flipped");
      for (let p = 1; p < LUTpoints.length; p++){
        LUTpoints[p].y *= -1;
      }
    }

    // if apex is facing left flip it

    if ((LUTpoints[1].x < 0) && (LUTpoints[LUTpoints.length - 2].x < LUTpoints[LUTpoints.length - 1].x)){
      //console.log("x flipped");
      for (let p = 1; p < LUTpoints.length; p++){
        LUTpoints[p].x *= -1;
      }
    }




    for (let p = 1; p < LUTpoints.length; p++){
      let curvature = curve.curvature(p / freq);
      output[p] = Number(LUTpoints[p].x * scale).toFixed(3) + "\t" + Number(LUTpoints[p].y * scale).toFixed(3) + "\t" + Number(curvature.r).toFixed(3);
    }
    output[0] = "0.000\t0.000\t" + Number(Math.abs(curve.curvature(0).r)).toFixed(3);

    let PET_offset = Math.abs(LUTpoints[LUTpoints.length - 1].x * scale);
    let pres = "Data Summary\nRy\t" + $('#Ry_display').val() + "\tRz\t" + $('#Rz_display').val();
    pres += "\nMinimum Radius\tr\t" + $('#min_R_display').val() + "\ty\t" + $('#min_R_y_display').val() + "\tz\t" + $('#min_R_z_display').val();
    pres += "\nArc Length\t" + $('#arc_display').val() + "\tPET Offset\t" + Number(PET_offset).toFixed(2) + "\n";
    let interposer = "---\t---\t---\n";


    $("#txt_output").val(pres + interposer + output.join("\n"));

    // refresh the min_R coordinates
    min_R_y = LUTpoints[min_t].x;
    min_R_z = LUTpoints[min_t].y;

    if (known_dist == 0){
      $('#min_R_y_display').val(Number(min_R_y).toFixed(2));
      $('#min_R_z_display').val(Number(min_R_z).toFixed(2));
      $('#PEToffset_display').val(Number(PET_offset).toFixed(2));
    } else {
      $('#min_R_y_display').val(Number(min_R_y * scale).toFixed(2));
      $('#min_R_z_display').val(Number(min_R_z * scale).toFixed(2));
      $('#PEToffset_display').val(Number(PET_offset).toFixed(2))
    }
  }

  function scalebar_draw(){
    (function(drawfunctions) {
      with(drawfunctions) {
        with(Math) {
          var line = {p1: { x:getCanvas().width - 200, y:getCanvas().height - 100 }, p2: {x: getCanvas().width - 100, y: getCanvas().height - 100}};
          var offset = {x: getCanvas().width - 200, y: getCanvas().height - 100};
          var draw = function() {
            setColor("#FAD201");
            drawLine(line.p1, line.p2);
            drawPoints([line.p1, line.p2]);
            pixel_dist = find_distance(line.p1, line.p2);
          };
          objDrawFuncs.scaleDraw = draw;
          draw();
          handleLineInteraction(getCanvas(), line, curve).onupdate = function(evt) {
            reset();
            for (const drawFunc in objDrawFuncs) {
              objDrawFuncs[drawFunc](evt);
            }
          }
        }
      }
    } (bindDrawFunctions( 0 ))
   );

  }

  function scalebar_remove(){
    (function(drawfunctions) {
      with(drawfunctions) {
        with(Math) {
          reset();
          for (const drawFunc in objDrawFuncs) {
            objDrawFuncs[drawFunc](evt);
          }
        }
      }
    } (bindDrawFunctions( 0 ))
   );

  }

  function readUrl(input) {
    if (input.files && input.files[0]) {
        let target_div = $(".inputDnD > input:file");
        if (!$(input).hasExtension(['.jpg', '.jpeg', 'png'])) {
          target_div.attr('data-title', "Invalid extension.");
          target_div.removeClass('text-success');
          target_div.addClass('text-warning');
          return;
        }
        else {
          target_div.attr('data-title', "Drop Bend Image Here");
          target_div.addClass('text-success');
          target_div.removeClass('text-warning');
        }

        let reader = new FileReader();
        reader.onload = function(e){
          let bg_img = new Image();
          bg_img.src = e.target.result;
          bg_img.onload = function(){
              let canvas = $('#canvas');
              img_scale = canvas.parent().width() / bg_img.width;

              let old_canvas_height = canvas[0].height;
              canvas[0].height = bg_img.height * img_scale;
              canvas[0].width = canvas.parent().width();
              cvs2.height = canvas[0].height;
              cvs2.width = canvas[0].width;
              //canvas[0].getContext("2d").drawImage(bg_img, 0, 0, bg_img.width * img_scale, bg_img.height * img_scale);
              ctx2.drawImage(bg_img, 0, 0, bg_img.width * img_scale, bg_img.height * img_scale);
              canvas[0].getContext("2d").drawImage(cvs2, 0, 0);

              if (old_canvas_height == 0){
                bezier_draw();
              }
              //canvas[0].dispatchEvent(new Event("mousemove"));

              $("#scalebar_bool").attr('disabled', false);

          };
        };
        reader.readAsDataURL(input.files[0]);
    }

  }

  // initialize the onchange event handler
  $(".inputDnD").on("drop", function(e){
    var uploader = $(this).children("input:file")[0];
    uploader.files = e.originalEvent.dataTransfer.files;
//    readUrl(uploader);
  });

  $("input:file").on("change", function(e){
    //console.log("tirggered");
    readUrl(this);
  })


/*  $(".inputDnD > input[type='file']").on('change', function(){
    readUrl(this);
  });*/

  // when scale bar is available vs. not
  $("#scalebar_bool").on('change', function(){
    if (this.checked) {
      scalebar_draw();

      $("#scalebar_length").attr('disabled', false);
      $("#scalebar_length").on('change keyup paste', function(){
          var regex_res = $(this).val().match(/^(\d+\.?\d*)(\D*)$/);
          if (regex_res){
            known_dist = parseFloat(regex_res[1]);
            $('#Ry_display').val(Number(Ry * known_dist / pixel_dist ).toFixed(2));
            $('#Rz_display').val(Number(Rz / pixel_dist * known_dist).toFixed(2));
            $('#min_R_display').val(Number(min_R / pixel_dist * known_dist).toFixed(2));
            $('#arc_display').val(Number(arc_length / pixel_dist * known_dist).toFixed(2));
            $('#min_R_y_display').val(Number(min_R_y / pixel_dist * known_dist).toFixed(2));
            $('#min_R_z_display').val(Number(min_R_z / pixel_dist * known_dist).toFixed(2));

            if (regex_res[2]){
              $("#radii_legend").html("Bend Radii (" + regex_res[2] + ")");
              $("#min_R_legend").html("Minimal Radius (" + regex_res[2] + ")");
              $("#line_legend").html("Additional Bend Info (" + regex_res[2] + ")");
              known_unit = regex_res[2];
            } else {
              $("#radii_legend").html("Bend Radii (au)");
              $("#min_R_legend").html("Minimal Radius (au)");
              $("#line_legend").html("Additional Bend Info (au)");
              known_unit = "";
            }
          } else {
            $(this).val("");
            known_dist = 0;
            known_unit = "";
            $("#radii_legend").html("Bend Radii (px)");
            $("#min_R_legend").html("Minimal Radius (px)");
            $("#line_legend").html("Additional Bend Info (px)");
          }
          output_curve(output_freq, known_dist / pixel_dist );
      });

    } else {
      (function(drawfunctions) {
        with(drawfunctions) {
          with(Math) {
            // delete draw function and eventListeners
            delete objDrawFuncs['scaleDraw'];
            let cvs = getCanvas();

            cvs.removeEventListener("mousedown", lineListeners[0], false);
            cvs.removeEventListener("mousemove", lineListeners[1], false);
            cvs.removeEventListener("mouseup", lineListeners[2], false);
            cvs.removeEventListener("click", lineListeners[3], false);
            $("#scalebar_length").off('change keyup paste');
            $('#Ry_display').val(Number(Ry).toFixed(2));
            $('#Rz_display').val(Number(Rz).toFixed(2));
            $('#min_R_display').val(Number(min_R).toFixed(2));
            $('#arc_display').val(Number(arc_length).toFixed(2));
            $('#min_R_y_display').val(Number(min_R_y).toFixed(2));
            $('#min_R_z_display').val(Number(min_R_z).toFixed(2));
            reset();
            for (const drawFunc in objDrawFuncs) {
              objDrawFuncs[drawFunc]();
            }
          }
        }
      } (bindDrawFunctions( 0 ))
     );
     $("#scalebar_length").val("");
     $("#scalebar_length").attr('disabled', true);
     known_dist = 0;
     pixel_dist = 1;
     $("#radii_legend").html("Bend Radii (px)");
     $("#min_R_legend").html("Minimal Radius (px)");
     $("#line_legend").html("Additional Bend Info (px)");
    }
    output_curve(output_freq, known_dist / pixel_dist );

  });

});
