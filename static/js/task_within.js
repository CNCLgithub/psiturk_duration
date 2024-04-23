/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;

// Names of elements used in the experiment
var MOVIESCREEN = "moviescreen";
var DRAGBOX = "dragbox"
var NEXTBUTTON = "nextbutton";
var PROGRESS = "progress";
var RELOAD = "reloadbutton";
var RES_SLIDER = "trialRes";
var INS_INSTRUCTS = "instruct";
var INS_HEADER = "instr_header";
var PAGESIZE = window.screen.availWidth*0.6; // Set the page size (really, the size of images and videos) to be a portion of the width of the screen

var IMG_TIME = 100 // time to display images in ms

var SCALE_COMPLETE = false; // users do not need to repeat scaling (though we aren't using scaling in this experiment)

var PROLIFIC_ID = "";

// All pages to be loaded
var pages = [
  "instructions/instructions.html",
  "instructions/instruct-1.html",
  "quiz.html",
  "restart.html",
  "stage.html",
  "postquestionnaire.html",
  "complete.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
  "instructions/instruct-1.html"
];


/****************
 * Prolific ID  *
 ****************/

var ProlificID = function(condlist) {
    while (true) {
        PROLIFIC_ID = prompt("Please enter your prolific ID to proceed:");
        // a small check on length
        if (PROLIFIC_ID.length == 24) {
            psiTurk.recordTrialData({
                'prolific_id': PROLIFIC_ID,
            });
            console.log("prolific_id recorded:", PROLIFIC_ID);
            InstructionRunner(condlist);
            return;
        }
        alert("Make sure you enter the prolific ID correctly, please try again.");
    }
}


/****************
 * Functions  *
 ****************/

// used to shuffle the array of trials
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};


var black_div = function() {
  return '<div style=\"background-color: black; width: 1280px; height: 720px;\"></div>'
}

var cut2black = function() {
  var sc = document.getElementById(MOVIESCREEN);
  sc.innerHTML = make_img("mask.png", true, false) + "<br>";
}

var cut2white = function() {
  var sc = document.getElementById(MOVIESCREEN);
  sc.innerHTML = make_img("mask_2.png", true, false) + "<br>";
}

var make_img = function(imgname, is_intro, freeze) {
  if (typeof(is_intro) === 'undefined') is_intro = false;
  if (typeof(freeze) === 'undefined') freeze = true
  var mcl = "movieobj"
  if (is_intro) {
    mcl = "movieobj_sm"
  }
  var r = `<image id="thisimg" `
  if (freeze) {
    r += "onload=\"cut2black()\" "
  }
  r += `class="${mcl}" src="static/data/${imgname}" alt="Movie" style="margin-right: ${PAGESIZE*.05}px; height: auto; width: ${PAGESIZE}px">`
  console.log(r)
  return r
};

var make_mov = function(movname, is_intro, has_ctr) {
  if (typeof(is_intro) === 'undefined') is_intro = false;
  if (typeof(has_ctr) === 'undefined') has_ctr = true;
  var mcl = "movieobj";
  var ctr = "";
  var fmovnm = "static/data/movies_within/" + movname;
  var foggnm = fmovnm.substr(0, fmovnm.lastIndexOf('.')) + ".ogg";
  var ret = //`<span id="qspan">Press spacebar when you see a video distortion</span>` +
   //`<div class="center">` +
   `<video id="thisvideo" style="border: solid transparent;" class="${mcl}\${ctr}" width="${PAGESIZE}px">` +
      `<source src="${fmovnm}" type="video/mp4">` +
      `<source src="${foggnm}" type="video/ogg">` +
      `Your browser does not support HTML5 mp4 video.</video>`;
      //`</div>`;
  return ret;
};


/********************
 * HTML manipulation
 *
 * All HTML files in the templates directory are requested
 * from the server when the PsiTurk object is created above. We
 * need code to get those pages from the PsiTurk object and
 * insert them into the document.
 *
 ********************/

function allowNext() {
  var button = document.getElementById(NEXTBUTTON)
  button.disabled = false;
  button.style.display = "inline-block";
}

function scaleSlider() {
  return "<span id=\"qspan\">Move the slider to match the width of your card</span>"+
    "<input id=\"scale_slider\" type=\"range\" min=\"0\" max=\"100\" default=\"50\" width=\"1500\"/>";
};


function responseSlider() {
  return `<span id="qspan">How long do you think the video is?</span>` +
    `<div id="lab-div">` +
    `<div id="lab-left"><i>1 second</i></div>` +
    `<div id="lab-center"><i>2 seconds</i></div>` +
    `<div id="lab-right"><i>3 seconds</i></div>` +
    `</div>` +
    `<input id="response_slider" type="range" min="0" max="30" default="0" width="${PAGESIZE}px" disabled/>`
};

// collect response time during video and indicate when a key is press
function draw(duration) {

  var video = document.getElementById('thisvideo');
  video.style.borderColor = "red";
  //var x = document.createElement("CANVAS");
  //var ctx = x.getContext("2d");

  //ctx.drawImage(video, 0, 0, video.videoWidth,video.videoHeight);

  // ctx.strokeStyle = "#FF0000";
  // ctx.strokeRect(0,0,video.videoWidth,video.videoHeight);

  setTimeout(function(){
    video.style.borderColor = "transparent";
  	//x.parentNode.removeChild(x);
  	},duration);

   // document.body.appendChild(x);

}

// Collect choice after watching video
// var choiceRegion = function () {
//     var choice_test =`<h4> Did you see a letter? <span style=\"color:blue;\"></span></h4>`+
//      `<ul style="list-style-type:none">`+
//         `<li id="e-choice">`+
//         `<input id="e-choice" type="radio" name="choice" value="1"/>` +
//         `<div class="check"></div>`+
//         `<label for="e-choice"><i>E</i></label>` +
//         `</li>` +
//         `<li id="f-choice">` +
//         `<input id="f-choice" type="radio"  name="choice" value="2"/>` +
//         `<div class="check"></div>` +
//         `<label for="f-choice"><i>F</i></label>` +
//         `</li>` +
//         `<li id="no-choice">` +
//         `<input id="no-choice" type="radio"  name="choice" value="0"/>` +
//         `<div class="check"></div>` +
//         `<label for="no-choice"><i>No letter</i></label>` +
//         `</li>` +
//         `</ul>`;
//     return choice_test;
// }

function make_fullscreen_button() {
    var ret = `<button type="button" style="margin: 0 auto" id="fullscreen_button">Switch to full screen mode</button>`;
    return ret;
}

var openFullscreen = function() {
    console.log("going full screen");
    var elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

// open the video full screen
function toggleFullScreen(elem) {

// open the full screen
	if (!document.fullscreenElement) {
  		if (elem.requestFullscreen) {
    		elem.requestFullscreen();
  		} else if (elem.webkitRequestFullscreen) { /* Safari */
    		elem.webkitRequestFullscreen();
  		} else if (elem.msRequestFullscreen) { /* IE11 */
    		elem.msRequestFullscreen();
    	}
  	// } else
//   	// close the full screen
//   	 {
//   		if (elem.exitFullscreen) {
//     		elem.exitFullscreen();
//   		} else if (elem.webkitExitFullscreen) { /* Safari */
//     		elem.webkitExitFullscreen();
//   		} else if (elem.msExitFullscreen) { /* IE11 */
//     		elem.msExitFullscreen();
// 		}
 	}
}



class Page {

  // Handles media presentation and scale handling.

  /*******************
   * Public Methods  *
   *******************/
  constructor(text, mediatype, mediapath, show_response = false) {
    // page specific variables
    this.text = text;
    this.mediatype = mediatype;
    this.mediapath = mediapath;
    this.mask = true;
    this.pageSize = PAGESIZE;
    // html elements
    this.instruct = document.getElementById(INS_INSTRUCTS);
    this.scale_region = document.getElementById("scale_region");
    this.response = document.getElementById("response_region");
    this.choice = document.getElementById(RES_SLIDER);
    this.showResponse = show_response;
    this.next = document.getElementById(NEXTBUTTON);
    this.next.disable = true;
    this.mvsc = document.getElementById(MOVIESCREEN);
    this.mvsc.innerHTML = "";
    this.reloadbtn = document.getElementById(RELOAD);
    this.spacebar = [];
    this.spacebarkey = [];
    this.hkey = [];
  }

  // Loads content to the page
  // The `callback` argument can be used to handle page progression
  // or subject responses
  showPage(callback) {
    // create callback to progress when done
    this.next.onclick = function() {
      callback();
    };

	// preventing from scrolling on space bar click
	window.addEventListener('keydown', function(e) {
		if(e.keyCode == 32 && e.target == document.body) {
			e.preventDefault();
		}
	});

    this.addText();

    // If there is a slider, then progression is contingent
    // on complete presentation of the media.
    this.addMedia();
  }


  // Returns the placement of each color scaled from [0, 1]
//  retrieveResponse() {
//    var confidence = document.getElementById("response_slider");
//    //var choice = $('input[name=clothchoice]:checked', `#${RES_SLIDER}`).val();
//    //var rep = [choice, confidence.value]
//    return confidence.value
//  }

    // Return the spacebar presses
  	get_keypresses() {
        return [this.spacebarkey,this.hkey];
  }


  /************
   * Helpers  *
   ***********/

  // injects text into page's inner html
  addText() {
    if (this.text !== "") {
      this.instruct.innerHTML = this.text;
    }
  }

  // formats html for media types
  addMedia() {
    if (this.mediatype === 'image') {
      this.mvsc.innerHTML = make_img(this.mediapath, true, false) + "<br>";
      this.showImage();
    } else if (this.mediatype === 'movie') {
      this.mvsc.innerHTML = make_mov(this.mediapath, true);
      this.showMovie();
    } else if (this.mediatype == 'scale'){
      this.mvsc.innerHTML = make_img(this.mediapath, true, false) + "<br>";
      this.scalePage();
    }  else if (this.mediatype == 'fullscreen'){
            this.goFullscreen();
    } else {
      this.mvsc.innerHTML = "";
      this.showImage();
    }
  };

  scalePage() {
    if (SCALE_COMPLETE) {
      this.mvsc.innerHTML = "";
      this.instruct.innerHTML = "Your screen has already been scaled.";
      this.showImage();

    } else {
      this.scale_region.innerHTML = scaleSlider();
      var slider_value = document.getElementById("scale_slider");
      var scale_img = document.getElementById("thisimg");
      slider_value.oninput = function(e) {
        PAGESIZE = (e.target.value / 50.0) * 500;
        scale_img.width = `${PAGESIZE}px`;
        scale_img.style.width = `${PAGESIZE}px`;
        SCALE_COMPLETE = true;
      }
    }
  }

  goFullscreen() {
        this.mvsc.innerHTML = make_fullscreen_button();
        var button = document.getElementById(NEXTBUTTON)
        button.disabled = true;
        var fs_button = document.getElementById("fullscreen_button");
        let self = this;
        fs_button.onclick = function() {
            console.log("click registered for FS");
            openFullscreen();
            allowNext();
        }
    }
//  addResponse() {
//    this.response.innerHTML = responseSlider();
//  }

  //addChoice() {
  //  this.choice.innerHTML = choiceRegion();
  //}


  // The form will automatically enable the next button
//  enableResponse() {
//	var box = document.getElementById("response_slider");
//    box.disabled = false;
//   	box.onmousedown = function() {
//      allowNext();
//    };
//  }

  disableResponse() {
    document.getElementById("response_slider").disabled = true;
  }

  clearResponse() {
    this.scale_region.innerHTML = "";
    this.response.innerHTML = "";
    //this.choice.innerHTML = "";
  }


  // plays movie
  showMovie() {

	var starttime = new Date().getTime();

    this.next.disabled = true;
    var sc = document.getElementById(MOVIESCREEN);
    var mov = document.getElementById('thisvideo');
    var image = document.getElementById('thisimg');
    //console.log(image)
    var saved_time = ""
    let me = this;
    var time = 0
    //console.log(time)
    var key_is_down = 0
    var response_recorded = 0
	// add timing for any key presses that were made
//	document.onkeydown = function(event){
//		if (event.keyCode == 32 && key_is_down == 0) {
//			event.preventDefault();
//			saved_time = new Date().getTime()
//			time = new Date().getTime()- starttime;
//			if (time > 900 && me.next.disabled === true) {
//			    document.getElementById('thisimg').style.borderColor = "red";
//			    key_is_down = 1};
//            }};
//    document.onkeyup = function(event){
//        if (event.keyCode == 32 && key_is_down == 1) {
//            event.preventDefault();
//			var response = new Date().getTime() - saved_time;
//			console.log("saved_time")
//			console.log(saved_time)
//            document.getElementById('thisimg').style.borderColor = "transparent";
//            me.nkey.push(response);
//            console.log(response)
//            allowNext()}};

// else if (event.keyCode == 72){
//                        event.preventDefault();
//
//                        var time = new Date().getTime() - starttime;
//                        if (time > 500 && me.next.disabled === true) {
//                                // tell them
//                                //tempAlert('space',500)
//
//                                 // outline the video
//                                draw(500)
//
//                                 // save the data
//                                 me.hkey.push(time);
//
//              }
//            }

    // The "next" botton will only activate after recording a response
    if (this.showResponse) {
      this.next.style.display = "none";
      //console.log("first")
      var movOnEnd = function() {
        if (me.mask) {
          cut2black();
          document.onkeydown = function(event){
		if (event.keyCode == 32 && key_is_down == 0 && response_recorded == 0) {
			event.preventDefault();
			saved_time = new Date().getTime()
			//console.log(saved_time)
			time = new Date().getTime()- starttime;
			if (time > 1500 && me.next.disabled === true) {
			    document.getElementById('thisimg').style.border = "5px solid #ff0000";
			    key_is_down = 1};
            }};
    document.onkeyup = function(event){
        if (event.keyCode == 32 && key_is_down == 1 && response_recorded == 0) {
            event.preventDefault();
			var response = new Date().getTime() - saved_time;
			//console.log(saved_time)
			console.log(response)
            document.getElementById('thisimg').style.border = "5px solid #ffffff";
            me.spacebarkey.push(response);
            response_recorded = 1
            cut2white();
            allowNext()}};
        }
        //me.addChoice();
        //me.addResponse();
        //me.enableResponse();
      };

    }
    else {
      // Otherwise allow next once movie is complete
      //console.log("second")
      var movOnEnd = function() {
        if (me.mask) {
          cut2black();
          document.onkeydown = function(event){
		if (event.keyCode == 32 && key_is_down == 0 && response_recorded == 0) {
			event.preventDefault();
			saved_time = new Date().getTime()
			//console.log(saved_time)
			time = new Date().getTime()- starttime;
			if (time > 1500 && me.next.disabled === true) {
			    document.getElementById('thisimg').style.border = "5px solid #ff0000";
			    key_is_down = 1};
            }};
    document.onkeyup = function(event){
        if (event.keyCode == 32 && key_is_down == 1 && response_recorded == 0) {
            event.preventDefault();
			var response = new Date().getTime() - saved_time;
			//console.log(saved_time)
			console.log(response)
            document.getElementById('thisimg').style.border = "5px solid #ffffff";
            me.spacebarkey.push(response);
            response_recorded = 1
            cut2white();
            allowNext()}};
        }
        me.next.disabled = false;

      };
    }
    mov.oncanplaythrough = function() {
      mov.controls=false;
      mov.play();
    };

    mov.onended = movOnEnd;

  }

// shows an image
  showImage() {
    if (this.showResponse) {
      this.next.disabled = true;
      //this.addChoice();
      //this.addResponse();
      //this.enableResponse();
    } else {
      this.next.disabled = false;
    }
  }
};

/****************
 * Instructions  *
 ****************/

var InstructionRunner = function(condlist) {
  psiTurk.showPage('instructions/instructions.html');

  var instruct = document.getElementById(INS_INSTRUCTS);
  var dragbox = document.getElementById(DRAGBOX);
  var mvsc = document.getElementById(MOVIESCREEN);
  var reloadbtn = document.getElementById(RELOAD);
  var nTrials = condlist.length;

  // each instruction is an array of 4 elements
  // 1: The text to be shown (if any)
  // 2: The type of format (image, movie, text, scale)
  // 3: Any media needed (can be an empty string)
  // 4: Whether to show the response div (true/false) // not sure what this means

  var instructions = [
    [
        "Hi! This experiment requires you to be using a <b>private Chrome desktop browser</b>."+
        "The program should have automatically detected whether you are using a phone or a tablet. If you are using a phone or tablet and it has still allowed you to continue, please reopen the experiment in a private Chrome desktop browser now. " +
        "If you can only use a tablet or a phone, and are unable to switch to a private Chrome desktop browser, please quit the experiment and return the HIT.<br>" +
        "If you are on a private Chrome desktop browser -- great! Click <b>Next</b> to continue.",
        "", "", false
    ],
    [
        "Thank you for volunteering to help out with our study.<br>" +
        "<ul>" +
        "<li>Please take a moment to adjust your seating so that you can comfortably watch the monitor and use the keyboard/mouse." +
        "<li>Feel free to dim the lights as well." +
        "<li>Close the door or do whatever is necessary to minimize disturbance during the experiment." +
        "<li>Please also take a moment to silence your phone so that you are not interrupted by any messages mid-experiment." +
        "<li>Please maintain an arm-length distance from your monitor for the duration of this experiment (10 minutes)." +
        "</ul><br>" +
        "Click <b>Next</b> when you are ready to continue.",
        "", "", false
    ],
    [
        "This experiment requires you to be in <b>full screen</b> mode. The experiment will switch to full screen mode when you press the button below.<br>" +
        "Don't worry, we will return your browser to its normal size later. If you do need to leave in the middle, you can press the ESC key -- but please avoid this. Your responses are only useful to us if you stay in this mode until the end of the experiment.<br>"+
        "Click <b>Switch to full screen</b> and then <b>Next</b> to continue.",
        "fullscreen", "", false
    ],

    [
        "<b>Before we begin, follow the instructions below to setup your display.</b><br><hr />" +
        "<p>Please sit comfortably in front of you monitor and outstretch your arm holding a credit card (or a similary sized ID card). <br>" +
        "<p>Adjust the size of the image using the slider until its <strong>width</strong> matches the width of your credit card (or ID card).",
        "scale", "generic_cc.png", false
    ],
    [
      "In this study, you will watch a series of short videos. Your main task is to hold down the space bar for the duration of the video just played. In these videos, you will see a liquid ball interacting with a maze-like formation of planks.",
      "", "", false
    ],

    [
      "In some videos, you will see a row of obstacles facing upward at the bottom of the video.",
            "image", "more_pegs_2.png", false
    ],
    [ "In some other videos, you will see a row of obstacles facing downward at the bottom of the video.",
            "image", "more_pegs_control_2.png", false
    ],

    [
        "During the experiment, only hold down the space bar when you are asked to do so. <br>" +
        "When you are instructed to hold down the space bar, you can only hold down the space bar <b>once</b> to indicate the duration. <br>" +
        "A red border will flash, indicating that you have pressed the space bar. <br>" +
        "Click <b>Next</b> for a practice trial.",
        "text", "", false
    ],
    [
        "Try practice holding down the space bar to indicate the duration of this video just played. <br>",
        "movie", "water_more_pegs_2.mp4", true
    ],

    [
        "Great! Now you have probably got a rough idea of what's going on. We have two more practice trials to help you get more used to the task.",
        "","", false
    ],

    [
        "Try practice holding down the space bar to indicate the duration of this video just played. <br>",
        "movie", "honey_more_pegs_control_2.mp4", true
    ],

    [
        "Try practice holding down the space bar to indicate the duration of this video just played. <br>",
        "movie", "water_branching_more_pegs_2.mp4", true
    ],

    [
      "These videos will start automatically and will only play once. You will not be able to pause or rewind the videos. <br>" +
        "<hr /><i>Note</i>: You will <b>NOT</b> be able to progress to the next trial until you have indicated the duration of the video by holding the space bar.",
      "", "", false
    ],


    ["We will now have a short check to make sure that you have understood the instructions. <br>" +
      "Then you will proceed to the actual experiment to make in total " + nTrials +  " such judgements.<br>", // name the number of trials
      "", "", false
    ],

  ];

  var ninstruct = instructions.length;

  // Plays next instruction or exits.
  // If there is another page, it is reach via callback in `page.showPage`
  var do_page = function(i) {

    if (i < ninstruct) {
      var page = new Page(...instructions[i]);
      page.showPage(function() {
        //toggleFullScreen(document.body)
        page.clearResponse();
        do_page(i + 1);
      });
    } else {
      end();
    }
  };

  var end = function() {
    psiTurk.finishInstructions();
    quiz(function() {
        InstructionRunner(condlist)
      },
      function() {
        currentview = new Experiment(condlist)
      })
  };

  // start the loop
  do_page(0);
};

/*********
 * Quiz  *
 *********/

// Describes the comprehension check
var loop = 1;
var quiz = function(goBack, goNext) {
  function record_responses() {
    var allRight = true;
    $('select').each(function(i, val) {
      psiTurk.recordTrialData({
        'phase': "INSTRUCTQUIZ",
        'question': this.id,
        'answer': this.value
      });
      if (this.id === 'trueFalse1' && this.value != 'b') {
        allRight = false;
      } else if (this.id === 'trueFalse2' && this.value != 'c') {
        allRight = false;
      }
      // }else if(this.id==='densOrder' && this.value != 'second'){
      //     allRight = false;
      // }
    });
    return allRight
  };

  psiTurk.showPage('quiz.html')
  $('#continue').click(function() {
    if (record_responses()) {
      // Record that the user has finished the instructions and
      // moved on to the experiment. This changes their status code
      // in the database.
      psiTurk.recordUnstructuredData('instructionloops', loop);
      psiTurk.finishInstructions();
      console.log('Finished instructions');
      // Move on to the experiment
      goNext();
    } else {
      // Otherwise, replay the instructions...
      loop++;
      psiTurk.showPage('restart.html');
      $('.continue').click(
        function() {
          psiTurk.doInstructions(instructionPages, goBack)
        });
    }
  });
};

/**************
 * Experiment *
 **************/

var Experiment = function(triallist) {

  psiTurk.showPage('stage.html');

  var triallist = shuffle(triallist);

  var screen = document.getElementById(MOVIESCREEN);
  var button = document.getElementById(NEXTBUTTON);
  var reloadbtn = document.getElementById(RELOAD);
  var prog = document.getElementById(PROGRESS);

  var starttime = -1;

  //toggleFullScreen(document.body)

  // uses `Page` to show a single trial
  var runTrial = function(curIdx) {

    // We've reached the end of the experiment
    if (curIdx === triallist.length) {
      end();
    }

    var flnm = triallist[curIdx];

    show_progress(curIdx);

    starttime = new Date().getTime();
    var pg = new Page("Pay attention to the duration of the video", "movie", flnm, true);

    // `Page` will record the subject responce when "next" is clicked
    // and go to the next trial

    pg.showPage(
      function() {
      	// make it go full screen if it isn't already
  		toggleFullScreen(document.body)

        register_response(pg, curIdx);

        // Clears slider from screen
        pg.clearResponse();
        runTrial(curIdx + 1);

      }
    );
  };



  // Record the subject's response for a given trial.
  var register_response = function(trialPage, cIdx) {

    //var rt = new Date().getTime() - starttime;
    //var rep = trialPage.retrieveResponse();
    var keys = trialPage.get_keypresses();

    psiTurk.recordTrialData({
      'TrialName': triallist[cIdx],
      //'Choice': rep[0],
      //'Confidence': rep,
      'Space_Key':keys[0],
      'H_Key':keys[1],
      'IsInstruction': false,
      'TrialOrder': cIdx
    });
  };

  var end = function() {
    psiTurk.saveData();
    new Questionnaire();
  };

	// show current trial number
    var show_progress = function(cIdx) {
        prog.innerHTML = (cIdx + 1) + " / " + (triallist.length);
    };

  // Let's begin!
  runTrial(0);
};



/****************
 * Questionnaire *
 ****************/

var Questionnaire = function() {

  var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

  record_responses = function() {

    psiTurk.recordTrialData({
      'phase': 'postquestionnaire',
      'status': 'submit'
    });

    $('textarea').each(function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });
    $('select').each(function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });

  };

  prompt_resubmit = function() {
    document.body.innerHTML = error_message;
    $("#resubmit").click(resubmit);
  };

  resubmit = function() {
    document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
    reprompt = setTimeout(prompt_resubmit, 10000);

    psiTurk.saveData({
      success: function() {
        clearInterval(reprompt);
        psiTurk.computeBonus('compute_bonus', function() {
          finish()
        });
      },
      error: prompt_resubmit
    });
  };

  // Load the questionnaire snippet
  psiTurk.showPage('postquestionnaire.html');
  psiTurk.recordTrialData({
    'phase': 'postquestionnaire',
    'status': 'begin'
  });

  $("#next").click(function() {
    record_responses();
    psiTurk.saveData({
      success: function() {
        psiTurk.completeHIT(); // when finished saving compute bonus, the quit
      },
      error: prompt_resubmit
    });
  });


};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/

$(window).load(function() {
  function do_load() {
    $.ajax({
      dataType: 'json',
      url: "static/data/withinsub_cond.json",
      async: false,
      success: function(data) {
        condlist = shuffle(data[0]);
	console.log(data[0])
        InstructionRunner(condlist);
        ProlificID(condlist);
      },
      error: function() {
        setTimeout(500, do_load)
      },
      failure: function() {
        setTimeout(500, do_load)
      }
    });
  };

  do_load();

});
