//Activates JavaScript strict mode
//This is to ensure that coding mistakes are caught
"use strict";

//Waiting until browzer finishes loading HTML
//This is to ensure JavaScript can access page elements
//so that the webpage doesn't look half finished
document.addEventListener("DOMContentLoaded", () => {

//HELPERS-----------------------------------------------------

  //$ will be used as a shortcut for document.querySelector()
  //Returns first matching HTML element

  //So it basically finds the first matching description is comes across
  //while scanning the document
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  //$$ is a shortcut for querySelectorAll()
  //The spread operator (...) converts NodeList into an array
  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

//LOCAL STORAGE-----------------------------------------------

  //Object for saving and loading information
  const storage = {

    //Retrieve key and fallback
    //Key is the name of the data
    //Fallback is the value to use if no saved data exists
    get(key, fallback) {

      //Attempt to look for information under this key
      try {
        const value = localStorage.getItem(key);
        
        //Otherwise, convert stored JSON back into Javascript data
        return value === null ? fallback : JSON.parse(value);
      } catch {

        //Return fallback if stored JSON is invalid or storage is blocked
        //This is prevent the program from crashing
        return fallback;
      }
    },

    //Save Javascript value under supplied key
    set(key, value) {

      //Attempt to convert arrays, objects, and values into a
      //string that localStorage can store
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {

        //If failed, send make an error message about what the problem is
        console.warn("Storage unavailable:", error);
      }
    }
  };

  
//UNIQUE ID GENERATOR-----------------------------------------

  //Object for generating a secure, unique UUID
  //This is to identify individual user accounts 

  //If UUID generation isn't avaliable,
  //Use the current timestamp or random number
  const createId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()}`;

//HTML SECURITY-----------------------------------------------
  const escapeHTML = (value) =>

    //Convert supplied value into text

    //Use /[&<>"']/g to find characers that have a special
    //meaning in HTML

    //Also replace each character with its safe HTML equivalent
    
    //This is prevent task names containing HTML from
    //being interpreted as an actual page markup
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

//DATE HELPERS------------------------------------------------   
  const dateKey = (date) => {
    
    //Extract year from a Date object
    const year = date.getFullYear();

    //Get all twelve months from 1-12
    //(because getMonth() returns 0-11, add 1)
    //(padStart() then makes the months from 3 => =0)
    const month = String(date.getMonth() + 1).padStart(2, "0");
    
    //Get the date for that day
    //(padStart() makes date go from 3 => 03)
    const day = String(date.getDate()).padStart(2, "0");
    
    //Print out the date for today
    return `${year}-${month}-${day}`;
  };

  //Return today's date in YYYY-MM-DD format
  const todayKey = () => dateKey(new Date());

  //Parsing through date to make sure everything is correct
  const parseDate = (value) => {
    //Ensure that it follows the YYYY-MM-DD format.
    //This is to return NULL is it doesn't instead of the program crashing
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
      return null;
    }

    //Spliting a date into an array
    //I.e. "2025-03-28" => [2025, 03, 28]
    const [year, month, day] = value.split("-").map(Number);
    
    //Create an object for the date
    //Subtract 1 from months since they are zero-indexed
    const date = new Date(year, month - 1, day);

    //Verify the date didn't roll over
    //I.e. Feburary 30 would become March
    return dateKey(date) === value ? date : null;
  };

  //Formatting the date 
  const formatDate = (value) => {
    //Convert stored date string into a date object
    const date = parseDate(value);

    //Display a readable date if valid
    //Otherwise show "No date" so no crashing
    return date
      ? date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "No date";
  };

//SHOW & HIDE HELPERS-----------------------------------------   

  //Removing the CSS class that hides the element
  //so that the element may be shown
  const show = (element) =>
    element?.classList.remove("hidden");

  //Adding the CSS class that hides the element
  //so that the element may be hidden
  const hide = (element) =>
    element?.classList.add("hidden");

//MODAL CONTROLS------------------------------------------------   
  
  //Object for opening the modal
  const openModal = (element) => {
    
    //If modal doesn't exist, stop it.
    if (!element) return;
    
    //Add the show element so that the modal is visible
    element.classList.add("show");

    //Then tell assistive technology that the modal is visible
    element.setAttribute("aria-hidden", "false");
  };

  //Object for closing the modal
  const closeModal = (element) => {

    //If modal doesn't exist, stop it.
    if (!element) return;

    //Remove the show element so that the modal is hidden
    element.classList.remove("show");

    //Tell assistive technology modal is hidden
    element.setAttribute("aria-hidden", "true");
  };

//ANIMATED CROW--------------------------------------------------

  //Find the crow's main HTML container
  const crowCharacter = $("#crow-character");
  
  //Find the pupil inside of the crow (it is a separate image than the rest of the body)
  //If crow container doesn't exist, search document
  const crowPupil = $(".crow-pupil", crowCharacter || document);

  //Check whether user prefers reduced animation
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  //Stores current animation frame ID
  //Null means there's no running frame
  let crowAnimationFrame = null;

  //Stores repeating timer for random bouncing
  //Null means there's no running frame
  let crowBounceInterval = null;

  //Function for initializing all the crow's animations
  function initializeAnimatedCrow() {

    //Make sure the crow container first exists before proceeding
    //If not, send a warning
    if (!crowCharacter) {
      console.warn(
        "Animated crow not found. Check #crow-character in index.html."
      );
      return;
    }

    //Check that the pupil exists before proceeding
    //If not, send a warning
    if (!crowPupil) {
      console.warn(
        "Crow pupil not found. Check .crow-pupil in index.html."
      );
      return;
    }

    //Cropping the sprite dimensions
    const SPRITE_WIDTH = 1500;
    const SPRITE_HEIGHT = 1400;

    //Determining the eye location in relation to cropped sprite
    const EYE_CENTER_X = 1472 - 400;
    const EYE_CENTER_Y = 560 - 380;

    //Maximum pupil offset in pixels at base size
    const MAX_PUPIL_TRAVEL = 4;

    //Gets the cursor's current screen coordinates
    //so that the cursor can be tracked by the pupil
    //Null indicates no pointer position avaliable
    let pointerX = null;
    let pointerY = null;

    //Current pupil position
    let currentX = 0;
    let currentY = 0;

    //Target pupil position (this is where we wnat to track)
    let targetX = 0;
    let targetY = 0;

    //Function for handling the movement of the pointer
    function handlePointerMove(event) {
      
      //Gets the pointer's horizontal position
      pointerX = event.clientX;

      //Gets the pointer's vertical position
      pointerY = event.clientY;
    }

    //Function for handling when pointer isn't present
    function handlePointerLeave() {

      //If X and Y pointer position not present, return pupil to the center
      pointerX = null;
      pointerY = null;
    }

    //Listen/track for pointer movement through document
    document.addEventListener("pointermove", handlePointerMove, { passive: true });

    //Detect when the pointer leaves the brower's viewing range
    document.addEventListener("pointerout", (event) => {
        
        //If there is no related target, trigger the handling
        //the pointer leaving function
        if (!event.relatedTarget) {
          handlePointerLeave();
        }
      },
      { passive: true }
    );

    //Reset tracking whenever the browswer loses focus
    window.addEventListener("blur", handlePointerLeave);

    //Function for animating the crow's pupil
    //It'll run repeatedly using requestAnimationFrame()
    function animateCrowPupil() {

      //Stop moving the pupil if reduced motion is enabled
      if (reducedMotionQuery.matches) {
        crowPupil.style.setProperty("--pupil-x", "0px");
        crowPupil.style.setProperty("--pupil-y", "0px");
        crowAnimationFrame = null;
        return;
      }

      //Get the crow's current position and size
      const rect = crowCharacter.getBoundingClientRect();

      //Get the crow's eye's horizontal position
      const eyeX = rect.left + (EYE_CENTER_X / SPRITE_WIDTH) * rect.width;

      //Get the crow's eye's vertical position
      const eyeY = rect.top + (EYE_CENTER_Y / SPRITE_HEIGHT) * rect.height;

      //If cursor isn't avaliable or isn't detected
      //look straight ahead
      if (pointerX === null || pointerY === null) {
        targetX = 0;
        targetY = 0;
      } else {

        //Otherwise, calculate the distance from the eye to the pointer
        //on horizontal and vertical axes.
        const dx = pointerX - eyeX;
        const dy = pointerY - eyeY;

        //Find distance through math.hypot
        const distance = Math.hypot(dx, dy);

        //If distance is more than 0 (the further the cursor)
        if (distance > 0) {

          //The stronger the pupil movement, up to intensity of 1
          const intensity = Math.min(1, distance / 150);

          //Determining the horizontal direction the pupil needs to travel
          targetX = (dx / distance) * MAX_PUPIL_TRAVEL * intensity;

          //Determining the vertical direction the pupil needs to travel
          targetY = (dy / distance) * MAX_PUPIL_TRAVEL * intensity;
        
        } else {
          

          //Otherwise, set both target positions to zero
          targetX = 0;
          targetY = 0;
        }
      }

      //Move 12% of the remaining distance for each frame
      //This is so the pupil movement appears to be smooth
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      //Adjust the pupil travel based on crow's current size
      //250px is set at the base illustrated crow width
      const scale = rect.width / 250;

      //Update the CSS custom property controlling the horizontal movement
      crowPupil.style.setProperty("--pupil-x", `${(currentX * scale).toFixed(2)}px`);

      //Update the CSS custom property controlling the vertical movement
      crowPupil.style.setProperty("--pupil-y", `${(currentY * scale).toFixed(2)}px`);

      //Asking the browswer to run function on the next frame
      crowAnimationFrame = requestAnimationFrame(animateCrowPupil);
    }

    //Function for starting the pupil animation
    function startPupilAnimation() {

      //If the motion is disabled and the animation is already running
      //do not start the pupil animation
      if (reducedMotionQuery.matches || crowAnimationFrame !== null) {
        return;
      }

      //Asking the browswer to run function on the next frame
      crowAnimationFrame = requestAnimationFrame(animateCrowPupil);
    }

    //Function for stopping the pupil animation
    function stopPupilAnimation() {

      //If animation frame isn't null
      //Then stop the currently running animation frame
      //and set it to null
      if (crowAnimationFrame !== null) {
        cancelAnimationFrame(crowAnimationFrame);
        crowAnimationFrame = null;
      }

      //Reset the stored position to the center
      currentX = 0;
      currentY = 0;

      //Reset it to actual CSS position
      crowPupil.style.setProperty("--pupil-x", "0px");
      crowPupil.style.setProperty("--pupil-y", "0px");
    }

    //Function for the random crow bounces
    function crowRandomAnimation() {

      //If it is in reduced-motion mode or the tabs are hidden
      //Do not bounce the crow
      if (reducedMotionQuery.matches || document.hidden) {
        return;
      }

      //Randomly generate a value from 0 to less than 1
      //This condition will skip approximately half the checks
      if (Math.random() >= 0.5) {
        return;
      }

      //Remove the bounce class so that it can be restarted
      crowCharacter.classList.remove("crow-bounce");

      //Restart the CSS bounce animation by forcing the browser
      //to recalculate layout
      void crowCharacter.offsetWidth;

      //Add the bounce clsas so that it triggers the bounce animation
      crowCharacter.classList.add("crow-bounce");
    }

    //Listening/tracking the crow's animation finishing
    crowCharacter.addEventListener("animationend", (event) => {
        
      //Making sure to respond to the animation on crow container
        if (event.target === crowCharacter && event.animationName === "crowIllustratedBounce") {
          
          //Remove the bounce class after bounce is finished
          crowCharacter.classList.remove("crow-bounce");
        }
      }
    );

    //Function for updating crow motion preference
    function updateCrowMotionPreference() {

      //Check whether the user enabled reduced motion
      if (reducedMotionQuery.matches) {
        
        //If so, stop pupil animation and remove class for bouncing
        stopPupilAnimation();
        crowCharacter.classList.remove("crow-bounce");

      } else {

        //Otherwise, start the animation again if motion is allowed
        startPupilAnimation();
      }
    }

    //Detecting accessibility preference changes
    //If browser supports eventlistener
    if (typeof reducedMotionQuery.addEventListener === "function") {
      
      //Then listen for the setting to change
      //so that it can pass the function updateCrowMotionPreference
      reducedMotionQuery.addEventListener("change", updateCrowMotionPreference);
    } else {

      //Otherwise, use the older browwer compatibility
      reducedMotionQuery.addListener(updateCrowMotionPreference);
    }

    //Pause animations when tab becomes hiddden
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopPupilAnimation();
        } else {

          //Otherwise, restart animation when tab becomes visible again
          startPupilAnimation();
        }
      }
    );

    //Variable set for crow bounce animation
    //This is determine when the intervals when the crow bounces
    crowBounceInterval = setInterval(crowRandomAnimation, 5000);

    //Executing the pupil animation function
    //so that is begin's tracking user's mouse
    startPupilAnimation();
  }

  //Initializing the animated crow
  //Run the crow's animation setup once
  initializeAnimatedCrow();
    
//CROW SPEECH------------------------------------------------------
  
  //Setting up an object for how long a user is idle for
  //So that the crow may know when to ask where the user went
  const CROW_IDLE_TIME = 10 * 60 * 1000;

  //Setting an up object for how long the user has been away from webpage
  //So that the crow may welcome user back
  const CROW_WELCOME_BACK_TIME = 4 * 60 * 60 * 1000;

  //Minimum time in between encouragement messages (4 minutes)
  const CROW_ENCOURAGEMENT_MIN = 4 * 60 * 1000;

  //Maximum time in tween encouragement messages (7 minutes)
  const CROW_ENCOURAGEMENT_MAX = 7 * 60 * 1000;

  //Records the user's most recent visit
  const CROW_LAST_VISIT_KEY = "crowLastVisit";

  //The timeout responsible for hiding the current speech bubble
  //Null means no timeout has been stored
  let notificationTimeout = null;

  //Stores timestamp until the important speech messages have priority
  let crowSpeechPriorityUntil = 0;

  //Stores timer for the next random encouragement message
  //Null means there isn't a current timer stored
  let crowEncouragementTimer = null;

  //Remember when user last interacted with the website
  let lastCrowActivity = Date.now();

  //Used to limit how frequently pointer movements update the activity timestamp
  let lastActivityUpdate = 0;

  //Used to track when the crow will assk where user has went
  //Set at false initially until user is gone for a long time
  let crowHasAskedWhereUserWent = false;

  //References crow's video element
  let crowCompletionVideo = null;

  //Stores fallbcak timeout for stopping the task completion animation
  let crowCompletionTimeout = null;

  //Crow messages collections
  //Collection for startup message (crow welcoming user)
  const crowStartupMessages = [
    "CAW! Glad to see you!",
    "Hey, human! Ready to get things done?",
    "Welcome to the nest!",
    "CAW CAW! Let's make some progress!",
    "There you are! What's our plan today?",
    "Your favorite crow is here to help!",
    "Let's make today productive!",
    "Good to see you again, human!"
  ];

  //Collection for return messages (crow welcoming user back after a long time)
  const crowReturnMessages = [
    "Welcome back! I missed you!",
    "CAW! You're finally back!",
    "Look who returned to the nest!",
    "There you are! Ready to get productive?",
    "Welcome home, human!",
    "The crow has been waiting for you!",
    "You're back! Let's get some work done!",
    "My favorite human has returned!",
    "CAW CAW! Good to see you again!"
  ];

  //Collection for encouragement messages (when crow encourages user at random intervals) 
  const crowEncouragementMessages = [
    "You've got this!",
    "One task at a time. Keep going!",
    "Remember to drink some water!",
    "Progress is progress, even if it's small.",
    "I'm rooting for you!",
    "Keep your eyes on the prize!",
    "You can do hard things!",
    "A little effort goes a long way.",
    "You're doing better than you think!",
    "Don't forget to take a short break!",
    "Stay focused! Your goals are waiting.",
    "CAW! Let's get something done!",
    "Every completed task is a victory.",
    "You've come this far. Keep going!",
    "I believe in you, human!"
  ];

  //Collection for idle messages (crow asking where using went after long period of inactivity)
  const crowIdleMessages = [
    "Hello...? Where did you go?",
    "CAW? Human? You still there?",
    "Did you abandon the nest?",
    "It's awfully quiet around here...",
    "Hey! Where'd you disappear to?",
    "I'm starting to miss you!",
    "Did you fly away without me?",
    "I'll just be waiting here...",
    "Psst... you still working?"
  ];

  //Collection for praise messages (crow praising user after completing a task)
  const crowPraiseMessages = [
    "CAW! Another task conquered!",
    "Look at you getting things done!",
    "That's what I like to see!",
    "One less thing to worry about!",
    "You're on a roll!",
    "Outstanding work, human!",
    "Another victory for the nest!",
    "CAW CAW! I'm proud of you!",
    "You absolutely crushed that task!",
    "Keep collecting those wins!",
    "That's some serious productivity!",
    "You're making great progress!",
    "The crow approves!",
    "Another task bites the dust!",
    "Your future self thanks you!"
  ];

  //Function for picking a random crow phrase from 
  //arrays of messages above
  function randomCrowPhrase(messages) {
    
    //Confirms messages is in an array and if array has items
    if (!Array.isArray(messages) || messages.length === 0) {
      
      //Return default messages if can't use or find array
      return "CAW!";
    }

    //Object for finding a random index in array
    //Math.random produces a random decimal from 0 to 1(not included)
    //Find a random position in the array by multiplying messages.length
    //Math.floor used to round to a valid index 
    const index = Math.floor(Math.random() * messages.length);

    //Return the message in that random index
    //This is to randomize what the crow chooses to say
    return messages[index];
  }

  //Function for displaying the text in the crow's speech bubble
  //Message is the text the crow should display
  //Duration is how long the message remains visible
  //Priority is to see if the message is important or not
  function notify(message, duration = 3500, priority = false) {
    
    //Find the speech bubble in HTML
    const speech = $("#crow-popup-speech");

    //If the element doesn't exist, send a warning and stop
    if (!speech) {
      console.warn("Crow speech bubble not found:", message);
      return;
    }

    //Checking if it is an ordinary message
    //This is to prevent interruptions to important messages with ordinary encouragement.
    if (!priority && Date.now() < crowSpeechPriorityUntil) {
      
      //Ignore ordinary message
      return;
    }

    //If the message is important
    //Make sure the message is protected for its entire duration
    if (priority) {
      crowSpeechPriorityUntil = Date.now() + duration;
    }

    //Cancel any previous hiding timer

    //This is to make sure an earlier timout
    //doesn't hide a newer message too soon
    clearTimeout(notificationTimeout);

    //Set the speech bubble's visible text
    speech.textContent = String(message);

    //Add the show class so that the speech bubble will appear
    speech.classList.add("show");

    //Scheduling the speech bubble to disappear
    notificationTimeout = setTimeout(() => {

      //Remove the show class so that bubble is hidden
      speech.classList.remove("show");

      //Then reset the timeout 
      notificationTimeout = null;
    }, duration);
  }

//TASK COMPLETION VIDEO------------------------------------------------------

  //Function for initializing the crow animation for completing a task
  function initializeCrowCompletionVideo() {

    //Check if the crow container exists
    //If not, do nothing
    if (!crowCharacter) return;

    //Search for an existing video
    //so that there aren't duplicate video elements
    const existingVideo = $(".crow-completion-video", crowCharacter);

    //Reuse the existing video if avaliable
    //Otherwise, create a new video element
    const video = existingVideo || document.createElement("video");

    //Apply the class used to position and hide/show the completion animation
    video.className = "crow-completion-video";

    //The video file that should be loaded
    video.src = "birdAnimation.webm";

    //Mute video so browser can play it without requiring audio permission
    video.muted = true;

    //Allows inline playback on mobile devices
    video.playsInline = true;

    //Ask the brower a preload video data
    video.preload = "auto";

    //Hide video from assistive technology
    video.setAttribute("aria-hidden", "true");

    //If the video doesn't exist 
    //Insert the video
    if (!existingVideo) {
      crowCharacter.appendChild(video);
    }

    //Save the video element to a variable
    //so that other functions can control it
    crowCompletionVideo = video;

    //Automatically stop animation video when video playbackends
    video.addEventListener("ended", () => {
      stopCrowCompletionAnimation();
    });

    //If the video file cannot be accessed
    //Then send a warning and stop the animation 
    video.addEventListener("error", () => {
      console.warn("Could not load birdAnimation.webm.");

      stopCrowCompletionAnimation();
    });
  }

  //Function for stopping the crow celebration animation
  function stopCrowCompletionAnimation() {

    //Cancel the animation fallback timer
    clearTimeout(crowCompletionTimeout);

    //Clear the stored timer reference
    crowCompletionTimeout = null;

    //If the video or crow is missing
    //Exit the video
    if (!crowCompletionVideo || !crowCharacter) {
      return;
    }

    //Pause the animation video
    crowCompletionVideo.pause();

    //Remove the class that hides the regular crow sprite
    //This is so that the regular crow sprite comes back
    crowCharacter.classList.remove("crow-celebrating");
  }

  //Function for playing the crow celebrating animation
  function playCrowCompletionAnimation() {

    //Making sure that the crow container and video exists
    //If not, do nothing
    if (!crowCharacter || !crowCompletionVideo) {
      return;
    }

    //Stop any previous completion timeout
    clearTimeout(crowCompletionTimeout);

    //Remove the crow bounce so that it doesn't interfere with celebration animation
    crowCharacter.classList.remove("crow-bounce");

    //Add the celebration animation 
    crowCharacter.classList.add("crow-celebrating");

    //Stop exisitng playback
    crowCompletionVideo.pause();

    //Rewing the video to the beginning every time it plays
    crowCompletionVideo.currentTime = 0;

    //Attempt to play the video
    const playback = crowCompletionVideo.play();

    //Catch an browser playback errors
    if (playback?.catch) {
      playback.catch((error) => {

        //Send a warning message if there is a playback error
        console.warn("Crow animation playback failed:", error);

        //Stop the video from playing
        stopCrowCompletionAnimation();
      });
    }

    //Fallback if the video's ended event never fires.
    crowCompletionTimeout = setTimeout(() => {
      stopCrowCompletionAnimation();
    }, 2500);
  }

//TASK COMPLETION PRAISE------------------------------------------------------

  //Function for crow praise when task is completed
  function praiseCompletedTask() {

    //Choosing a random praise message from array of praise messages
    const phrase = randomCrowPhrase(crowPraiseMessages);

    //Attempt the completion animation
    try {
      playCrowCompletionAnimation();
    } catch (error) {

      //If not, send back an error message
      console.error("Crow completion animation failed:", error);

      //And stop crow animation
      stopCrowCompletionAnimation();
    }

    //Display praise message for 4.5 seconds 

    //True makes sure this is an important message
    //so that random encouragement doesn't interrupt it
    notify(phrase, 4500, true);
  }

//WELCOME AND WELCOME-BACK MESSAGES------------------------------------------------------

  //Function for checking if user has been gone for a long time
  //so that crow may send return back message
  function checkCrowWelcomeBack() {

    //Record the current timestamp
    const now = Date.now();

    //Retrieve the previous visit timestamp
    //Provide a fallback if visst timestamp is invalid
    const previousVisit = Number(storage.get(CROW_LAST_VISIT_KEY, 0)) || 0;

    //Store the greeting chosen by conditions below
    let greeting;

    //Checking if it is first time visit
    if (previousVisit <= 0) {

      //If so, choose one of the following greetings
      greeting =
        "Welcome to Crowspace! Feeling productive today? " +
        "I'll be watching your progress!";
    }

    //Checking if the user is returning after a long time
    else if (now - previousVisit >= CROW_WELCOME_BACK_TIME) {
      
      //If so, choose a random crow return messsage
      greeting = randomCrowPhrase(crowReturnMessages);
    }

    //Otherwise, if it is a normal visit back
    else {

      //Choose a crow phrase from welcome messages
      greeting = randomCrowPhrase(crowStartupMessages);
    }

    //Waiting for 0.8 seconds before speaking
    //So that the page has a short opportunity
    //to finish initial visual setup
    setTimeout(() => {

      //Show greeting for 5.5 seconds
      //Has high priority
      notify(greeting, 5500, true);
    }, 800);

    //Save the current visit timestamp for future visits
    storage.set(CROW_LAST_VISIT_KEY, now);
  }

//USER INACTIVITY/ACTIVITY DETECTION------------------------------------------------------

  //Function for if user is inactive
  function isCrowUserInactive() {

    //Calculate the elapsed time since user's last recorded activity
    return (Date.now() - lastCrowActivity >= CROW_IDLE_TIME);
  }

  //Function for recording user activity
  function recordCrowActivity() {

    //Check whether user was inactive before recording interaction
    const wasIdle = isCrowUserInactive();

    //Replace the old timestamp with a now timestamp
    lastCrowActivity = Date.now();

    //If user was away for a long time
    //Allow another inactivity message during future idle period
    if (wasIdle) {
      crowHasAskedWhereUserWent = false;
    }
  }

  //Function for handling crow activity during which a user interacts
  function handleCrowActivity() {
    
    //Record the current time
    const now = Date.now();

    //Ignore repeated events that happen less than a second apart
    //This is to avoid processing every pointer movement.
    if (now - lastActivityUpdate < 1000) {
      return;
    }

    //Track when activity was last processed
    lastActivityUpdate = now;

    //Update the user activity timestamp
    recordCrowActivity();
  }

  //Function for handling crow inactivity messages
  function checkCrowInactivity() {

    //Do not show inactivity message while browser tab is hidden
    if (document.hidden) return;

    //Check if user is inactive and the crow hasn't asked yet
    if (isCrowUserInactive() && !crowHasAskedWhereUserWent) {
      
      //If so, activate the crow asking where the user went
      crowHasAskedWhereUserWent = true;

      //Choose a random phrase from crow idle messages
      const phrase = randomCrowPhrase(crowIdleMessages);

      //Display message for five seconds, set high priority
      notify(phrase, 5000, true);
    }
  }

//RANDOM ENCOURAGEMENT MESSAGES------------------------------------------------------

  //Function for scheduling when the crow should say a message of encouragement
  function scheduleCrowEncouragement() {

    //Cancel any previously scheduled encouragement timer
    //This is to prevent overlapping schedules
    clearTimeout(crowEncouragementTimer);

    //Generate a random delay between min and max encouragement times
    const delay = CROW_ENCOURAGEMENT_MIN + Math.random() * (
        CROW_ENCOURAGEMENT_MAX -
        CROW_ENCOURAGEMENT_MIN
      );

    //Schedule the next encouragement check
    crowEncouragementTimer = setTimeout(() => {

      //Check if tab is visible and user isn't currently inactive
      if (!document.hidden && !isCrowUserInactive()) {

        //Choose a random phrase from the crow encouragement messages
        //Ordinary phrase, not important
        notify(randomCrowPhrase(crowEncouragementMessages), 4000, false);
      }

      //Schedule the next random encouragement.
      scheduleCrowEncouragement();
    }, delay);
  }

//CROW PERSONALITY INITIALIZATION------------------------------------------------------

  //Function for initializing crow personality
  function initializeCrowPersonality() {

    //Create or find the celebration video
    initializeCrowCompletionVideo();

    [
      "pointermove",      //Mouse or pointer movement
      "pointerdown",      //Mouse button or pointer pressed
      "keydown",          //Keyboard key is pressed
      "wheel",            //Mouse wheel or trackpad scroll
      "touchstart"        //Touchscreen interaction
    ].forEach((eventName) => {

      //Register an activity listener for each event in array
      document.addEventListener(eventName, handleCrowActivity, { passive: true });
    });

    //Check whether the user is still active.
    setInterval(checkCrowInactivity, 60 * 1000);

    //Save last visit while the site is active.
    setInterval(() => {
      if (!document.hidden) {
        storage.set(CROW_LAST_VISIT_KEY, Date.now());
      }
    }, 60 * 1000);

    //Detect when the user leaves or returns to brower tab
    document.addEventListener("visibilitychange", () => {
        
        //If document is hidden
        if (document.hidden) {
          
          //Save the time when the user has left
          storage.set(CROW_LAST_VISIT_KEY, Date.now());
        } else {

          //Otherwise, when tab is visible, update activity tracking
          recordCrowActivity();
        }
      }
    );

    //Save the current timestamp when the user leaves the website or closes it
    window.addEventListener("pagehide", () => {
      storage.set(CROW_LAST_VISIT_KEY, Date.now());
    });

    //Show greeting when website opens
    checkCrowWelcomeBack();

    //Begin scheduling random encouragement
    scheduleCrowEncouragement();
  }

  //Run the crow personality initialization
  initializeCrowPersonality();

//SAVED DATA------------------------------------------------------

  //Object for storing and loading previously made tasks
  //Use an empty array as fallback if nothing has been saved yet
  let tasks = storage.get("crowTasks", []);

  //Object for storing and loading previously made dates
  //Use an empty array as fallback if nothing has been saved
  let importantDates = storage.get("crowImportantDates", []);
  
  //Object for storing and loading previously made classes
  //Use an empty array as fallback if nothing has been saved
  let classes = storage.get("crowClasses", []);

  //Object for storing and loading previously obtained tokens
  //Set tokens to zero if none has been saved yet
  let tokens = Number(storage.get("crowTokens", 0));

  //Making sure the tasks are is an array
  if (!Array.isArray(tasks)) tasks = [];

  //Making sure the important dates is an array
  if (!Array.isArray(importantDates)) importantDates = [];
  
  //Making sure the classes is an array
  if (!Array.isArray(classes)) classes = [];

  //Making sure the tokens are a valid, finite number
  //Otherwise, set tokens to 0
  if (!Number.isFinite(tokens)) tokens = 0;

  //Saving the current tasks array
  const saveTasks = () => storage.set("crowTasks", tasks);

  //Saving the current important dates array
  const saveImportantDates = () => storage.set("crowImportantDates", importantDates);

  //Saving the current classes array
  const saveClasses = () => storage.set("crowClasses", classes);

  //Saving the current coin balance
  const saveTokens = () => storage.set("crowTokens", tokens);

//LIGHT AND DARK MODE------------------------------------------------------

  //Find the theme toggle button in HTML
  const themeToggle = $("#theme-toggle");

  //Find the icon inside the theme button
  const themeIcon = $("#theme-icon");

  //Find the text label inside the theme button
  const themeLabel = $("#theme-label");

  //Function for changing the website to dark mode or light mode
  function applyTheme(theme) {

    //Checking if requested theme is dark
    //Will be set to a value of either true or false
    const dark = theme === "dark";

    //Toggling dark mode and light mode
    //Add dark mode if dark is true
    //Remove dark mode if dark is false
    document.body.classList.toggle("dark-mode", dark);

    //If the theme icon exists, update it
    if (themeIcon) {

      //If dark mode, choose the sun emoji
      //Otherwise, if light mode, choose the moon emoji
      themeIcon.textContent = dark 
        ? "☀️" 
        : "🌙";
    }

    //If theme label exists, update it
    if (themeLabel) {

      //If dark mode, label should be light mode
      //Otherwise, if light mode, label should be dark mode
      themeLabel.textContent = dark
        ? "Light Mode"
        : "Dark Mode";
    }

    //Update the accessible name of the button 
    //This is so users understand what the button does
    themeToggle?.setAttribute(

      //If dark mode, button will switch to light mode
      //Otherwise, if light mode, button will switch to dark mode
      "aria-label", dark 
        ? "Switch to light mode" 
        : "Switch to dark mode"
    );

    //Identify whether is toggle is currently active
    //using aria-pressed

    //String() converts true/false to text
    themeToggle?.setAttribute("aria-pressed", String(dark));
  }

  //Read previously selected theme to determine theme mode
  //If none has been saved, set automatically to light mode
  applyTheme(storage.get("crowTheme", "light"));

  //Check whether dark-mode class is active
  themeToggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
      
      //If dark mode active, switch to light
      //Otherwise, if light mode active, switch to dark
      ? "light"
      : "dark";

    //Immediately apply the new theme
    applyTheme(nextTheme);

    //Store what the current theme is so that this can
    //be tracked later for toggling
    storage.set("crowTheme", nextTheme);
  });

//COINS AND STORE------------------------------------------------------

  //Function for displaying coin balance 
  function updateTokens() {

    //Find the main coin counter
    const count = $("#token-count");

    //Find the coin counter inside store
    const storeCount = $("#store-token-count");

    //Update the main counter if it exists
    if (count) {
      count.textContent = tokens;
    }
    
    //Update the store counter if it exists
    if (storeCount) {
      storeCount.textContent = tokens;
    }
  }
  
  //Show the loaded coin balance immediately
  updateTokens();

  //Function for adding tokens to coin balance
  //Amount tracks number of coins to add
  //Announce tracks whether crow should announce reward
  function addTokens(amount, announce = true) {
    
    //Increase the current coin balance
    tokens += amount;

    //Save the new balance to localStorage
    saveTokens();

    //Refresh the visible coin counters
    updateTokens();

    //Check if crow can announce the reward if requested
    if (announce) {
      notify(`🪙 +${amount} coin${amount === 1 ? "" : "s"}!`);
    }
  }

  //Finding the store button and determining when it is clicked
  //When button is clicked, update counters, store contents, and open store modal
  $("#store-button")?.addEventListener("click", () => {
    
    //Display the latest coin balance
    updateTokens();

    //Refresh the collectibles cards
    renderCollectiblesStore();

    //Show the store modal
    openModal($("#store-modal"));
  });

  //Close store when its close button clicked
  $("#close-store-modal")?.addEventListener("click", () => {
    closeModal($("#store-modal"));
  });

  //Crow collectibles store and inventory
  //This array is where all the collectibles info is saved
  const COLLECTIBLES = [
    {
      id: "shiny-pebble",
      name: "Shiny Pebble",
      emoji: "🪨",
      price: 5,
      rarity: "Common",
      description: "A little treasure for your next."
    },
    {
      id: "golden-feather",
      name: "Golden Feather",
      emoji: "🪶",
      price: 15,
      rarity: "Uncommon",
      description: "A feather with a golden glow."
    },
    {
      id: "lucky-clover",
      name: "Lucky Clover",
      emoji: "🍀",
      price: 25,
      rarity: "Uncommon",
      description: "A lucky charm for those bad days."
    },
    {
      id: "crow-crown",
      name: "Royal Crow Crown",
      emoji: "👑",
      price: 50,
      rarity: "Rare",
      description: "A crown fit for the ruler of the nest."
    },
    {
      id: "moon-crystal",
      name: "Moon Crystal",
      emoji: "💎",
      price: 100,
      rarity: "Epic",
      description: "A mysterious crystal from the night sky."
    },
    {
      id: "phoenix-egg",
      name: "Phoenix Egg",
      emoji: "🥚",
      price: 200,
      rarity: "Legendary",
      description: "The rarest treasure in the collection."
    }
  ];

  //Restore previously purchased items by loading IDs of purchased items
  let ownedCollectibles = storage.get(
    "crowOwnedCollectibles",
    []
  );

  //Making sure the collectibles owned are stored in an array
  if (!Array.isArray(ownedCollectibles)) {
    ownedCollectibles = [];
  }

  //Cleaning the ownership data by removing 
  //dublicate IDs and references to collectibles that no longer exist
  ownedCollectibles = [

    //Removes the duplicate values
    //Keep IDs only if they match an item in collectibles array
    ...new Set(ownedCollectibles.filter((id) => 
        COLLECTIBLES.some((item) => item.id === id)
      )
    )
  ];

  //Saving the IDs of all the collectibles the user owns
  //This is to prevent previously purchased items from
  //becoming avaliable again
  function saveCollectibles() {
    storage.set("crowOwnedCollectibles", ownedCollectibles);
  }

  //Create a collectible card without unsafe HTML
  //Item is the collectible object to display
  //Owned is checking if user already owns item
  //inStore is boolean checking if item is in store
  function createCollectibleCard(item, owned, inStore) {
    
    //Create the main card element
    const card = document.createElement("article");
    
    //Setting the card's CSS classes
    card.className = `collectible-card rarity-${item.rarity.toLowerCase()}`;
    
    //Creating the element for emoji
    const emoji = document.createElement("div");
    
    //Adding emoji's styling class
    emoji.className = "collectible-emoji";
    
    //Displaying the item's emoji
    emoji.textContent = item.emoji;

    //Creating the rarity label element
    const rarity = document.createElement("span");
    
    //Adding the rarity's styling class
    rarity.className = "collectible-rarity";

    //Displaying the item's rarity
    rarity.textContent = item.rarity;

    //Creating the heading name element
    const name = document.createElement("h3");
    
    //Displaying item's name
    name.textContent = item.name;

    //Creating the paragraph brief description for item
    const description = document.createElement("p");

    //Displaying item's description
    description.textContent = item.description;

    //Place all of the elements above inside a card
    card.append(emoji, rarity, name, description);

    //Checking if item is in store
    //Store cards need price and purchase controls
    if (inStore) {

      //Create the element displaying the price
      const price = document.createElement("div");

      //Adding the collectible's price styling
      price.className = "collectible-price";

      //Displaying the item's price
      price.textContent = `🪙 ${item.price} coins`;

      //Creating a purchase button
      const button = document.createElement("button");
      
      //Prevent the button from submitting a form
      button.type = "button";

      //Styling class for the button
      button.className = "collectible-buy";

      //Checking if the user already owns the collectible
      if (owned) {

        //If user already owns collectible, set button to "owned"
        button.textContent = "✓ Owned";

        //Disable the button to prevent another purchase
        button.disabled = true;

        //Add styling for owned items
        button.classList.add("is-owned");
      } else if (tokens < item.price) {

        //If you don't have enough tokens,
        //have the button text indicate you don't have enough tokens
        button.textContent = "Not enough coins";

        //Disable button so that user can't purchase the item
        button.disabled = true;
      } else {

        //Otherwise, assume the item is avaliable
        //and set text to say you can buy the collectible
        button.textContent = "Buy Collectible";

        //Purchase the item upon the button being clicked
        button.addEventListener("click", () => {
          buyCollectible(item.id);
        });
      }

      //Add the price and button to the collectible card
      card.append(price, button);
    } else {

      //Otherwise, if you already own the item,
      //create a label showing that you own it
      const ownedLabel = document.createElement("div");
      
      //Styling class for owned collectible item
      ownedLabel.className = "collectible-owned-label";
      
      //Show that the item has been collected
      ownedLabel.textContent = "✓ Collected";

      //Add the ownership label to the card
      card.appendChild(ownedLabel);
    }

    //Return the completed card to the caller
    return card;
  }

  //Spend coins and permanently unlock an item
  //Find the requested item and check whether you can buy it
  //Then it saves the purchase if you don't own it
  function buyCollectible(itemId) {

    //Search the collectibles array for a matching id
    //If no match, return undefined
    const item = COLLECTIBLES.find((entry) => entry.id === itemId);

    //Do nothing if the item simply doesn't exist
    if (!item) return;
    
    //Check whether the item had already been purchased
    if (ownedCollectibles.includes(item.id)) {
      notify("You alreaady own this collectible!");
      return;
    }

    //Check whether the user can afford the item
    if (tokens < item.price) {
      notify("Not enough coins! Complete more tasks.");
      return;
    }

    //Deduct the amount of tokens used to puchase item from
    //total balance of coins
    tokens -= item.price;

    //Add the item ID to the ownership array
    ownedCollectibles.push(item.id);

    //Save the updated coin balance
    saveTokens();

    //Save the updated owned item list
    saveCollectibles();

    //Update the displayed coin balance
    updateTokens();

    //Refresh the store buttons and prices
    renderCollectiblesStore();

    //Show the purchased item in the inventory
    renderCollectiblesInventory();

    //Notification that you recieved the item
    //This is to affirm that the item has been purchase
    notify(`You collected ${item.name}!`, 4500, true);
  }

  //Function to build the store contents
  function renderCollectiblesStore() {

    //Find the store grid in HTML
    const container = $("#collectibles-store-grid");
    
    //Stop if the grid is missing
    if (!container) return;

    //Remove previously rendered cards as to prevent duplicate displays
    container.replaceChildren();

    //Loop through every avaliable collectible
    COLLECTIBLES.forEach((item) => {
      
      //Determine whether the user owns the item
      const owned = ownedCollectibles.includes(item.id);
      
      //Create the append the store card
      //True will tell that the card belongs in the store
      container.appendChild(createCollectibleCard(item, owned, true));
    });
  }

  //Function for displaying only purchased collectibles
  function renderCollectiblesInventory() {

    //Finding the inventory grid
    const grid = $("#collectibles-inventory-grid");
    
    //Finding the element showing how many collectibles have been obtained
    const count = $("#collectibles-inventory-count");

    //Stopping if the inventory grid is missing
    if (!grid) return;

    //Filter all collectibles down to the items whose IDs appear in ownership data
    const owned = COLLECTIBLES.filter(
      (item) => ownedCollectibles.includes(item.id)
    );

    //Update the inventory completion count
    if (count) {

      //This is display the amount collected out of the ones that are to collected
      count.textContent = `${owned.length} / ${COLLECTIBLES.length} collected`;
    }

    //Clear previously displayed inventory cards
    grid.replaceChildren();

    //Show a placeholder is nothing is owned
    if (owned.length === 0) {

      //Create a empty-state container
      const empty = document.createElement("div");

      //Styling class for empty-state container
      empty.className = "inventory-empty";

      //Creating a gift icon element
      const icon = document.createElement("div");

      //Styling class for gift icon
      icon.className = "inventory-empty-icon";

      //Set the text content to a gift emoji
      icon.textContent = "🎁";

      //Create the empty-state heading
      const heading = document.createElement("h3");

      //Set the empty inventory description to the message below
      heading.textContent = "Your inventory is empty";

      //Create the explanation text for what the store is about
      const message = document.createElement("p");

      //Set the explanation as the message below
      message.textContent = "Earn coins by completeting tasks, then buy collectibles from the shop."

      //Combine all the empty-state elements
      empty.append(icon, heading, message);

      //Display the empty state
      grid.appendChild(empty);

      //Stop so no collectible cards are rendered
      return;
    }

    //Displaying owned items through
    //looping through every owned collectibles
    owned.forEach((item) => {
      
      //Add an inventory-style collectible card
      //True means owned, false means not a store card
      grid.appendChild(createCollectibleCard(item, true, false));
    });
  }

  //Initiliaze the store and inventory
  //Populating the store with collectibles cards
  renderCollectiblesStore();

  //Populating the inventory with owned collectibles
  renderCollectiblesInventory();

//GREETING AND PROGRESS-----------------------------------------------------

  //Function that handles the greeting depending on the time of the day
  //Number of incomplete tasks
  //and the current date today
  function updateGreeting() {

    //Get today's date at the current moment
    const now = new Date();

    //Get the current hour using 24-hour system
    const hour = now.getHours();

    //Get the greeting based on the different conditions below
    //If is during the morning, send a "Good Morning" message
    const greeting = hour < 12
      ? "Good Morning"

      //If afternoon, send "Good Afternoon"
      : hour < 17
        ? "Good Afternoon"

        //Otherwise, it should be "Good Evening"
        : "Good Evening";

    //Find the element that displays the greeting
    const name = $("#crow-name");

    //Find the element that displays how many tasks are incomplete
    const message = $("#crow-message");

    //Find the element that displays today's date
    const date = $("#date");

    //Check that greeting element exists, if so
    //update what the greeting will be depending on the time of day it is
    if (name) name.textContent = `${greeting}!`;

    //Check that the incomplete tasks element exists, if so
    if (message) {

      //Create a new array containing tasks that meet the condition
      //Keep task if task not completed
      const incomplete = tasks.filter((task) => !task.completed).length;

      //Update the message with the number of incomplete tasks left to do
      message.textContent = `You have ${incomplete} task${incomplete === 1 ? "" : "s"} to work on.`;
    }

    //Check that the date element exists
    if (date) {

      //Convert the date object into a readable date string based on user's locale
      //Undefinted means to use brower's default language/locale setting
      date.textContent = now.toLocaleDateString(undefined, {
        weekday: "long",      //Full weekday name
        month: "long",        //Full month name
        day: "numeric",       //Day number without leading zero
        year: "numeric"       //Four digit year
      });
    }
  }

  //Function for calculating the percentage for this week's
  //tracked tasks that are completed
  //Also updates the progress bar based on tasks completed
  function renderProgress() {

    //Set the start of the week
    //Get the date of Monday as the beginning of the week
    const start = getWeekStart();

    //Set the end of the week
    //This will be the beginning of the next Monday
    const end = getWeekEnd(start);

    //Get tasks that belong to current week
    //Weekly tasks are determined by start and end of week
    const weeklyTasks = getWeeklyTasks(start, end);

    //Filter the weekly takss to keep only those
    //currenly marked as completed
    const completed = weeklyTasks.filter((task) => task.completed).length;

    //Get the percentage for the weekly progress bar
    //You do this by dividing the completed by the total tasks that week
    //If no tasks, just set percentage to 0 to avoid dividing by 0
    const percentage = weeklyTasks.length
      ? Math.round((completed / weeklyTasks.length) * 100)
      : 0;

    //Find element displaying the percentage
    const label = $("#progress-percent");

    //Find element displaying the colored filling inside progress bar
    const fill = $("#progress-fill");

    //If percentage label exists, display the calculated percentage
    if (label) label.textContent = `${percentage}%`;

    //If progress fill exists, change CSS width to match percentage
    if (fill) fill.style.width = `${percentage}%`;
  }

//TASKS-----------------------------------------------------
//TASK SECURITY SYSTEM-----------------------------------------------------

  //Tracking rapid task completion
  const FARM_WINDOW_MS = 5 * 60 * 1000;     // 5 minutes
  
  //Tracking how quickly task is considered to be completed quickly
  const QUICK_TASK_MS = 60 * 1000;          // 60 seconds
  
  //Determining how long task creation will be banned for
  const TASK_BAN_MS = 24 * 60 * 60 * 1000;  // 24 hours

  //Setting an amount for the max amount of times user can change due date
  const MAX_DATE_EDITS = 3;

  //Keep restriction history even after refresh
  //This is prevent people from attempting to cheese the system
  let taskSecurity = storage.get("crowTaskSecurity", {
    bannedUntil: 0,      
    quickCompletions: []
  });

  //Validate the loaded security data
  //If local storage contains invalid data, just restore to expected object structure
  if (!taskSecurity || typeof taskSecurity != "object" || !Array.isArray(taskSecurity.quickCompletions)) {
    taskSecurity = {
      bannedUntil: 0,
      quickCompletions: []
    };
  }

  //Function for saving current anti-farming data
  //Includes the creation ban if user creates and and completes a task
  //in rapid succession
  function saveTaskSecurity() {
    storage.set("crowTaskSecurity", taskSecurity);
  }

  //Function for tracking if task creation remains banned
  function isTaskCreationBanned() {

    //If current time is before ban expiration,
    //then task creation remains banned
    return Date.now() < Number(taskSecurity.bannedUntil || 0);
  }

  //Function for getting a ban message when attempting create a new task
  function getTaskBanMessage() {

    //Tracks the remaining time by subtracting ban expiration date by today's date
    const remaining = Math.max(0, Number(taskSecurity.bannedUntil || 0) - Date.now()
    );

    //Converts that remaining time into hours
    const hours = Math.ceil(remaining / 3600000);

    //Send a message that informs and scolds the person of the ban
    return `Farming coins are we?
    New task creation will be locked for ${hours} more hour(s).
    You can still complete and edit existing tasks.
    `;
  }

  //Function for checking coin farming
  //Record only first, first-time completions
  function checkCoinFarming(task) {

    //Record current timestamp
    const now = Date.now();

    //Get the tasks's original creation timestamp
    const createdAt = Number(task.createdAt);

    //Ignore older tasks without a valid creation timestamp.
    //If date is not a valid number, trigger this condition
    if (!Number.isFinite(createdAt) || createdAt <= 0 || createdAt > now) {
      return;
    }

    //Remove completions older than five minutes.
    taskSecurity.quickCompletions = taskSecurity.quickCompletions.filter((time) => {
      
      //Keeping only valid timestamps that haven't expired
      return(
        Number.isFinite(time) &&
        time <= now &&
        now - time <= FARM_WINDOW_MS
      );
    });

    //Calculating the elapsed time between creating and completing the task
    //This is to determine if a user is trying to farm coins
    if (now - createdAt <= QUICK_TASK_MS) {

      //Add completion timestamp to recent-completions array
      taskSecurity.quickCompletions.push(now);

    } else {

      //Otherwise, break consecutive quick-completion streak
      taskSecurity.quickCompletions = [];
    }

    //If the user makes 3 or more rapid completions
    if (taskSecurity.quickCompletions.length >= 3) {

      //Then set a date the uesr is going to banned until
      //That should be now's time plus the 24 hours
      taskSecurity.bannedUntil = Math.max(Number(taskSecurity.bannedUntil || 0), now + TASK_BAN_MS);

      //Break the consecutive quick-completions streak
      taskSecurity.quickCompletions = [];

      //Save the updated rapid-completion history
      //Even if threshhold was not reached
      saveTaskSecurity();

      //Sent an alert message when regarding the ban
      //when this condition is met
      alert(
        "Three rapid task completions detected.\n" +
        "Task creation locked for 24 hours." 
      );

      return;
    }

    //Save update rapid-completion history
    saveTaskSecurity();
  }

//TASKS CRUD-----------------------------------------------------

  //Tracks what task is being currently edited
  //Null means the modal is being used to create a new task
  let editingTaskId = null;

  //Find the task creation/editing modal
  const taskModal = $("#task-modal");

  //Find the task name input inside the modal 
  const taskName = $("#modal-task-name");

  //Find the task category input
  const taskCategory = $("#task-category");

  //Find the due date input
  const taskDueDate = $("#task-due-date");

  //Function for calculating task priority
  //This is help determine how urgent a task is
  function getPriority(dueDate) {

    //Tasks without due dates recieve low priority
    if (!dueDate) return "low";

    //Convert the stored due date into a date object
    const due = parseDate(dueDate);

    //Get today's date at local midnight
    const today = parseDate(todayKey());

    //If the due date is invalid, assign low priority
    if (!due) return "low";

    //Calculate the days until the task is due
    //Convert milliseconds into days
    const days = Math.round((due - today) / 86400000);

    //Tasks due in 2 or less than 2 days are high priority
    if (days <= 2) return "high";

    //Tasks due in 7 or less than 7 days are medium priority
    if (days <= 7) return "medium";

    //Otherwise, task priority is low
    return "low";
  }

  //Function for detecting if a task is overdue
  //Will be true if task has a due date, due date is in past, and task isn't completed
  function isOverdue(task) {
    return Boolean(
      task.dueDate &&
      task.dueDate < todayKey() &&
      !task.completed
    );
  }

  //Function that clears task editor and restores default settings
  //Also used to create a new task or closing editing session
  //This is so you don't see your old data on the task editor
  function resetTaskModal() {

    //Restore the due date input
    if (taskDueDate) {

      //Allow date editing by default
      taskDueDate.disabled = false;

      //Remove any previous tooltip
      taskDueDate.title = "";
    }
    
    //Clear the ID of the task being edited
    editingTaskId = null;

    //Clear the task name field
    if (taskName) taskName.value = "";

    //Clear the task category field
    if (taskCategory) taskCategory.value = "";

    //Clear the task due date field
    if (taskDueDate) taskDueDate.value = "";

    //Find the modal confirmation button
    const button = $("#confirm-task-button");

    //If the button modal exists, then set button name to "Add task"
    if (button) button.textContent = "Add Task";
  }

  //Function for opening task modal
  function openTaskEditor(task = null) {

    //Blocking new tasks, but allow task edits
    if (!task && isTaskCreationBanned()) {
      
      //Display remaining ban time
      alert(getTaskBanMessage());
      return;
    }

    //Clear previous form information
    resetTaskModal();

    //If task object exists, populate editor with its data
    if (task) {

      //Remember which task is being edited
      editingTaskId = task.id;

      //Display the saved task name
      if (taskName) taskName.value = task.name;

      //Display saved category
      if (taskCategory) {
        taskCategory.value = task.category || "";
      }

      //Display saved due date
      if (taskDueDate) {
        taskDueDate.value = task.dueDate || "";

        //Read how many times the task's due date has been changed
        //this is to detect if a person is trying to procrastinate
        const editCount = Number(task.dueDateEditCount) || 0;

        //Disable due date change if allowed date changes have all been used up
        taskDueDate.disabled = editCount >= MAX_DATE_EDITS;

        //Setting up a explanatory tooltip
        //If task due date is disabled, send a message informing such
        //Otherwise, tell how many chanegs are left
        taskDueDate.title = taskDueDate.disabled
          ? "Due date permanently locked after 3 changes"
          : `${MAX_DATE_EDITS - editCount} date changes remaining`;
      }

      //Update the button text to indicte saving an edit
      const button = $("#confirm-task-button");
      
      //If button exists, and user is editing task info, set confirmation button to "Save changes"
      if (button) button.textContent = "Save Changes";
    } else if (taskName) {

      //Otherwise, copy and text entered in the main task input into the modal
      taskName.value = $("#task-input")?.value.trim() || "";
    }

    //Display the modal
    openModal(taskModal);

    //Place keyboard focus in the name input when opening task editor
    taskName?.focus();
  }

  //Function for changing a task's completion state
  //Task is the object to be updated
  //Comopleted is the boolean for detecting if task completed or not
  function setTaskCompleted(task, completed) {

    //Ignore duplicate completion events.
    if (Boolean(task.completed) === Boolean(completed)) {
      return;
    }

    //Update the tasks's completion status
    task.completed = completed;

    //Checking if task was completed
    if (completed) {

      //Save the exact completion timestamp
      //This is so the weekly report can use this to determine when a task has been completed
      task.completedAt = Date.now()
        
      //Award one coin only the first timethe task is completed.
      if (!task.coinAwarded) { 
        task.coinAwarded = true;

        //Don't replace praise with coin speech.
        addTokens(1, false);

        //Checking for coin farming after completion of task
        checkCoinFarming(task);
      } 

      //Play the animation for the crow congratulating on task completion
      praiseCompletedTask();

    } else {

      //An unchecked task is no longer completed
      task.completedAt = null;
    }

    //Save completion immediately
    saveTasks();

    //Manually render everything because the code breaks if I 
    //try using renderAll() 
    //Who knows why :(
    
    //Refresh task list
    renderTasks();

    //Refresh dashboard progress bar
    renderUpcomingTasks();

    //Refresh the greeting's incomplete task count
    renderProgress();
    
    //Refresh the greeting's incomplete task count
    updateGreeting();

    //Refresh task entries displayed on the calendar
    renderCalendar();

    //Refresh floating Today's Task window
    renderTodayPanel();

    //Refresh the weekly progress repot
    //If it doesn't work, catch an error
    try {
      renderWeeklyReport();
    } catch (error) {
      console.error("Weekly report update failed:", error);
    }
  }

  //Listen for clicks on adding task button
  //If clicked, open the task editor
  $("#add-task-button")?.addEventListener("click", () => {
    openTaskEditor();
  });

  //Listen for keyboard input in dashbaord task entry field.
  $("#task-input")?.addEventListener("keydown", (event) => {
    
    //If user presses enter, also open task editor
    if (event.key === "Enter") {
      openTaskEditor();
    }
  });

  //Listen for if user closes the task modal
  $("#close-task-modal")?.addEventListener("click", () => {
    closeModal(taskModal);
  });

  //Listen for if user confirms creating a task or editing a task
  //If user is banned from editing the due date, send a ban message
  $("#confirm-task-button")?.addEventListener("click", () => {
    if (!editingTaskId && isTaskCreationBanned()) {
      alert(getTaskBanMessage());
      return;
    }
    
    //Read the entered task name
    const name = taskName?.value.trim();

    //Do not save tasks with an empty name
    if (!name) {
      alert("Please enter a task name.");
      return;
    }

    //Build an object containing the values enter in task modal
    const data = {
      name,                                           //Name of task
      category: taskCategory?.value.trim() || "",     //Category of task
      dueDate: taskDueDate?.value || ""               //Due date of task
    };

    //If editingTaskId exists, then update an existing task instead of creating a new one
    if (editingTaskId) {
      
      //Find the task with matching ID
      //find() will return the first matching item
      const task = tasks.find((item) => item.id === editingTaskId);

      //Stop if the task no longer exists
      if (!task) return;

      //Read previously saved due date
      const oldDate = task.dueDate || "";

      //Read newly selected due date
      const newDate = data.dueDate || "";

      //Check whether due date has been changed
      const dateChanged = oldDate !== newDate;
      
      //Read the number of previous changes
      //Older tasks with no counter begin with 0
      const editCount = Number(task.dueDateEditCount) || 0;

      //Rejecting fourth date change
      if (dateChanged && editCount >= MAX_DATE_EDITS) {
        
        //Send message banning user from date changes
        alert(
          "This task's due date is permanently locked.\n" +
          "You cannot change the due date after changing it three times.\n" +
          "Please adhere to deadlines."
        );

        //Set the due date back to the old due date
        if (taskDueDate) {
          taskDueDate.value = oldDate;
        }

        return;
      }
      
      //Whenever a date is changed, add one more to the due date edit count
      if (dateChanged) {
        task.dueDateEditCount = editCount + 1;
      }

      //Task keeps the original ID, creation date, completion history, and one-time coin reward status
      Object.assign(task, data);

      //Warn the user of the lock after they changed the due date for the third time
      if (dateChanged && task.dueDateEditCount === MAX_DATE_EDITS) {
        alert(
          "You have already used up all three date changes.\n" +
          "Task's due date is now permanently locked. \n" +
          "And you can no longer delete this task."
        );
      }

      //Confirm that the task has been updated after user edits task
      notify("Task updated!");

    } else {

      //Otherwise, if not editing, add a new task object to th tasks array
      tasks.push({

        //Assign a unique identifier
        id: createId(),

        //Spread the entered name, category, and due date into the object
        ...data,

        //Newly created tasks are incomplete
        completed: false,

        //No coins awarded if task isn't complete
        coinAwarded: false,

        //Determines the day the task was created
        createdAt: Date.now()
      });

      //Confirm to the user that their task has been added
      notify("Task added!");
    }

    //Save all tasks to localStorage
    saveTasks();

    //Cloes the task editor modal
    closeModal(taskModal);

    //Refresh the task editor modal
    resetTaskModal();

    //Find the quick task entry input
    const input = $("#task-input");

    //Clear the quick entry after saving
    if (input) input.value = "";

    //Refresh everything on the website
    //Renderall() works here for some reason idk
    renderAll();
  });

//RENDER TASKS CARD-----------------------------------------------------
  
  //Function for rendering the task cards
  //Displays all the saved tasks in a task list
  function renderTasks() {

    //Main HTML list containing task rows
    const list = $("#task-list");

    //Task counter in the existing section
    const count = $("#task-count");

    //Task counter in the dynamically generated tasks page header
    const pageCount = $("#tasks-page-count");

    //Messages displayed when no tasks exist
    const empty = $("#empty-task-message");

    //Updating the page task count
    //Check whether the page task counter element exists
    //Use a singular task only when the number tasks is exactly one
    if (pageCount) {
      pageCount.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    }

    //Stop if the task list doesn't exist
    if (!list) return;

    //Remove a previously rendered children
    //This prevents duplicate task rows
    list.replaceChildren();

    //Update the task counter
    //Check whether the task counter element exists
    //Display the total number of saved tasks
    if (count) {
      count.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    }

    //Create a new array containing tasks that have not been completed
    const remainingTasks = tasks.filter((task) => !task.completed);

    //Show the empty state element only when zero tasks are saved
    //Toggle will add or remove the class according to condition
    empty?.classList.toggle("show", remainingTasks.length === 0);

    //Make a copy of the tasks array but sorted
    //Sort the tasks by due dates
    //The closer the due date, the higher up the list it is
    const sorted = tasks
      .filter((task) => !task.completed)
      .sort((a, b) =>
        //3333
        String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999"))
      );

    //Loop through the sorted task array
    sorted.forEach((task) => {

      //Calculate the tasks's priority level
      const priority = getPriority(task.dueDate);

      //Create a new list item
      const item = document.createElement("li");

      //Apply the basic task styling class and a priority specific class
      item.className = `task priority-${priority}`;

      //If task is completed, add the copmleted CSS class
      if (task.completed) item.classList.add("completed");

      //If task is overdue, add the overdue CSS class
      if (isOverdue(task)) item.classList.add("overdue");

      //Generate task row for HTML
      //innerHTML creates the tasks's checkbox, information, and buttons
      //escapeHTML protects user entered text before inserting into HTML
      item.innerHTML = `
        <input
          class="task-checkbox"
          type="checkbox"
          ${task.completed ? "checked" : ""}
          aria-label="Complete task"
        >

        <div class="task-info">
          <span class="task-text">
            ${escapeHTML(task.name)}
          </span>

          <div class="task-details">
            ${task.category
              ? `<span class="task-category">
                  ${escapeHTML(task.category)}
                </span>`
              : ""}

            ${task.dueDate
              ? `<span class="task-due">
                  ${escapeHTML(formatDate(task.dueDate))}
                </span>`
              : ""}

            <span class="priority ${priority}">
              ${priority}
            </span>
          </div>
        </div>

        <button
          class="edit-button"
          type="button"
          aria-label="Edit task"
        >✎</button>

        <button
          class="delete-button"
          type="button"
          aria-label="Delete task"
        >✕</button>
      `;

      //Find the checkbox inside this specific task item
      //EventListener also runs the callback whenever the checkback changes between checked and unchecked
      $(".task-checkbox", item).addEventListener("change", (event) => {
          
          //Read if checkbox is checked.
          const completed = event.target.checked; 

          //If task was checked off...
          if (completed) {

            //Prevent clicking it again while fading away
            event.target.disabled = true;

            //Then start the fade out animation
            item.classList.add("task-fade-out");

            //Then wait 400ms for the animation to finish
            setTimeout(() => {
              setTaskCompleted(task, true);
            }, 400);
          } else {
            
            //Otherwise, preserve the original state
            setTaskCompleted(task, false);
          }
        });

      //Find edit button inside this task item
      //Also see if the edit button was clicked so that the task editor opens
      $(".edit-button", item).addEventListener("click", () => {
          openTaskEditor(task);
        }
      );

      //Find the delete button for this task
      //Also listen for the user clicking it
      $(".delete-button", item).addEventListener("click", () => {

          //Stores the number of times this tasks's due date has changed
          //This is to lock the deletion function if due date is changed too many times
          const dateChanges = Number(task.dueDateEditCount) || 0;

          //Permanent deletion lock  
          if (dateChanges >= MAX_DATE_EDITS) {

            //Give an alert message to the due date change ban
            alert(
              "Task can no longer be deleted.\n" +
              "You have already changed its due date three times.\n" +
              "Finish your tasks on time!"
            );

            return;
          }

          //Confirming delete when user chooses to delete a task
          //This is to ensure that the user doesn't accidentally
          //delete an important task
          if (!confirm("Delete this task?")) return;

          //Create a new array containing only entries/tasks that satisfy the condition
          //Keep every task whose ID is different from being deleted
          tasks = tasks.filter((entry) => entry.id !== task.id);

          //Save the modified tasks array to the localStorage
          saveTasks();

          //Render everything on the website
          renderAll();
        }
      );

      //Visually indicate pemanently locked deletion
      if ((Number(task.dueDateEditCount) || 0) >= MAX_DATE_EDITS) {
        
        //Find the delete button belonging to this task
        const deleteButton = $(".delete-button", item);

        //If the deletebutton exists
        if (deleteButton) {

          //Then add the class that the deletion is locked
          deleteButton.classList.add("deletion-locked");

          //Then users see the message that deletion is permanently locked
          deleteButton.title = "Deletion permanently locked after 3 due-date changes";
          
          //Provides an accessible description for assistive technology
          //A screen reader will identify the deletion is locked
          deleteButton.setAttribute(
            "aria-label",
            "Task deletion permanently locked"
          );
        }
      }

      //Add the completed task element to the main HTML task list
      //This is what makes the task row appear on the tasks page
      list.appendChild(item);
    });
  }

//IMPORTANT DATES-----------------------------------------------------
//IMPORTANT DATES CRUD------------------------------------------------

  //Tracks what important date is being edited
  //Null means the user is creating a new important date
  let editingDateId = null;

  //Find the important date modal in HTML
  //Used for both adding and editing important dates
  const dateModal = $("#important-date-modal");

  //Function for resetting the important date editor
  function resetDateModal() {
    
    //Clear the ID of the date being edited
    //This will ensure each new date created has a unique ID
    editingDateId = null;

    //Find the name input
    const name = $("#modal-important-date-name");

    //Find the category input
    const category = $("#important-date-category");

    //Find the date picker input
    const date = $("#important-date-date");

    //Find the confirmation button
    const button = $("#confirm-important-date-button");

    //Clear the name field if it exists
    if (name) name.value = "";

    //Clear the category if it exists
    if (category) category.value = "";

    //Clear the date if it exists
    if (date) date.value = "";

    //Find the school / work radio button
    const defaultRadio = $('input[name="important-date-type"][value="school-work"]');

    //If radio button exists,
    //select school / work as the default
    if (defaultRadio) defaultRadio.checked = true;

    //It button exists,
    //restore the button to its default text
    if (button) button.textContent = "Add Important Date";
  }

  //Function for opening up the important date editor
  function openDateEditor(item = null) {

    //Clear the important date editor
    //So that the old data doesn't remain in the editor
    resetDateModal();

    //If an item exists, edit it
    if (item) {
      
      //Save the ID of the date being edited
      editingDateId = item.id;

      //Find the modal's name element
      const name = $("#modal-important-date-name");

      //Find the modal's category element
      const category = $("#important-date-category");

      //Find the modal's date element
      const date = $("#important-date-date");

      //If name exists, load the previously saved name
      if (name) name.value = item.name;

      //If category exists, load the previously saved category
      if (category) category.value = item.category || "";

      //If date exists, load the previously saved date
      if (date) date.value = item.date || "";

      //Returns all radios buttons that have the important date type name
      const radio = $$('input[name="important-date-type"]').find((input) => input.value === item.type);

      //Select the matching radio button
      if (radio) radio.checked = true;

      //Change the confirmation button text for editing
      const button = $("#confirm-important-date-button");

      //Change the button name to "Save Changes" for confirmation
      if (button) button.textContent = "Save Changes";

    } else {

      //Find the name input inside the modal
      const name = $("#modal-important-date-name");

      //If name exists, 
      //copy text typed in the main important date quick entry input
      if (name) {
        name.value = $("#important-date-input")?.value.trim() || "";
      }
    }

    //Display the important date modal
    openModal(dateModal);
  }

  //Listen for clicks on the add button for important dates
  //Open the important dates editor if so
  $("#add-important-date-button")?.addEventListener("click", () => {
      openDateEditor();
    }
  );

  //Listen the keyboard events in the quick entry input
  //Open the important dates editor if so
  $("#important-date-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        openDateEditor();
      }
    }
  );

  //Listen for the close button being clicked
  //Close important dates editor if so
  $("#close-important-date-modal")?.addEventListener("click", () => {
      closeModal(dateModal);
    }
  );

  //Listen for when creating a new important date or editing a preexisitng one confirmation button is clicked
  $("#confirm-important-date-button")?.addEventListener("click", () => {

      //Read the important date's name
      const name = $("#modal-important-date-name")?.value.trim();

      //Read the selected date
      const date = $("#important-date-date")?.value;

      //Confirm the user provided a name and a date
      if (!name || !date) {

        //If not, alert the user to do so
        alert("Enter a name and date.");
        return;
      }

      //Collect the remaining information into an object named data
      const data = {
        name,                                                           //The important date name
        date,                                                           //The important date selected date
        category: $("#important-date-category")?.value.trim() || "",    //The important date category
        type: $('input[name="important-date-type"]:checked')            //The important date type (school/work / personal)
          ?.value || "school-work"                                     
      };

      //If editingDateId has an ID, update a previously saved date
      if (editingDateId) {

        //Search the saved importantDates array for an entry with a matching id
        const item = importantDates.find((entry) => entry.id === editingDateId);

        //If item was found, update the existing object with the new data
        if (item) Object.assign(item, data);

      } else {

        //Otherwise, if not updating an existing important dates,
        //add a new important date to the array
        //Also create a new, unique ID for the important date
        importantDates.push({
          id: createId(), ...data
        });
      }

      //Save important dates to a localStorage
      saveImportantDates();

      //Hide the editor modal
      closeModal(dateModal);

      //Clear editing state and inputs
      resetDateModal();

      //Find the quick-entry input
      const input = $("#important-date-input");
      
      //Clear its text after saving
      if (input) input.value = "";

      //Render everthing on the website
      renderAll();

      //Inform the user that the important date has been saved
      notify("Important date saved!");
    }
  );

//RENDER IMPORTANT DATES CARD-----------------------------------------------------
  
  //Function for rendering the important dates cards
  //Displays all the saved important dates in a task list
  function renderImportantDates() {

    //Find the list where important dates are displayed
    const list = $("#important-date-list");

    //Find the date counter
    const count = $("#important-date-count");

    //Find the empty state message
    const empty = $("#empty-important-date-message");

    //Stop if he main list is missing
    if (!list) return;

    //Remove previously generated important date rows
    //Prevents duplicates when this function runs again
    list.replaceChildren();

    //Update the important date counter
    //Check whether the important date counter element exists
    //Display the total number of saved important date
    if (count) {
      count.textContent = `${importantDates.length} date${importantDates.length === 1 ? "" : "s"}`;
    }

    //Show the empty state message only when no dates have been saved
    empty?.classList.toggle("show", importantDates.length === 0);

    //Creates a copy of the important dates array but sorted
    //Sort by the due dates: earlier dates at the top, later dates at the bottom
    [...importantDates].sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      )

      //Loop through each sorted date
      .forEach((item) => {

        //Create a new list item
        const element = document.createElement("li");

        //Add based CSS class and selected type as second class
        //This is so personal and school/work dates look different
        element.className = `important-date-item ${item.type || "school-work"}`;

        //Construct the row's HTML
        //escapeHTML prevents user entered names and categoreies from becoming executable HTML
        //formateDate() converts YYYY-MM-DD into a readable date
        element.innerHTML = `
          <span class="important-date-icon">
            ${item.type === "personal" ? "🎉" : "📅"}
          </span>

          <div class="important-date-info">
            <span class="important-date-name">
              ${escapeHTML(item.name)}
            </span>

            <div class="important-date-details">
              <span>
                ${escapeHTML(formatDate(item.date))}
              </span>

              ${item.category
                ? `<span>
                    ${escapeHTML(item.category)}
                  </span>`
                : ""}

              <span class="important-date-type-badge">
                ${item.type === "personal"
                  ? "Personal"
                  : "School / Work"}
              </span>
            </div>
          </div>

          <div class="important-date-actions">
            <button
              class="important-date-edit"
              type="button"
              aria-label="Edit important date"
            >✎</button>

            <button
              class="important-date-delete"
              type="button"
              aria-label="Delete important date"
            >✕</button>
          </div>
        `;

        //Finding the edit button in this row and listening to if it'd be clicked
        //Open the editor with this date's existing data when clicked
        $(".important-date-edit", element).addEventListener("click", () => {
          openDateEditor(item)
        });

        //Finding the delete button in this row and listen to if it'd be clicked
        $(".important-date-delete", element).addEventListener("click", () => {

          //Creates a new array containing every date except the selected one
          //Comparison uses unique IDs
          importantDates = importantDates.filter((entry) => entry.id !== item.id);

          //Save the update array
          saveImportantDates();

          //Refresh the whole website
          renderAll();  
        });

        //Insert the completed date row into the important dates list
        list.appendChild(element);
      });
  }

//CLASSES----------------------------------------------------------
//CLASSES ELEMENTS-----------------------------------------------------

  //Find class creation modal
  const classModal = $("#class-modal");

  //Find the class name input inside the modal
  const className = $("#modal-class-name");

  //Tracks which class is currently being edited
  let editingClassId = null;

  //An array that converts the weekday numbers into readable names
  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  //Function for determining whether the class is weekly or one time
  function updateClassOptions() {

    //Find the selected class repeat radio button
    const repeat = $('input[name="class-repeat"]:checked')?.value;

    //If repeat is "once", use then needs to select the specific date
    //Basically, it checks if the class only happens once
    if (repeat === "once") {

      //Hide the weekly weeday selector
      hide($("#weekly-class-options"));

      //Show the one time day selector
      show($("#one-time-class-options"));
    } else {

      //Otherwise, show the weekly weekday selector for weekly classes
      show($("#weekly-class-options"));

      //And hide the one time day selector
      hide($("#one-time-class-options"));
    }
  }

  //Find all class repeat radio buttons
  //Run the updateClassOptions() whenever user switches class types
  $$('input[name="class-repeat"]').forEach((radio) => {
    radio.addEventListener("change", updateClassOptions);
  });

  //Function for resetting and clearing the class editor
  function resetClassModal(){
    
    //Switch back to add class mode
    editingClassId = null;

    //Clear the class name
    if (className) {
      className.value = "";
    }

    //Find one-time date input element
    const dateInput = $("#class-date");

    //Clear the one-time date input
    if (dateInput) {
      dateInput.value = "";
    }

    //Find weekly date input element
    const weeklyInput = $("#class-weekday");

    //Reset the weekly date input
    if (weeklyInput) {
      weeklyInput.value = "1";
    }

    //Find weekly radio button 
    const weeklyRadio = $('input[name="class-repeat"][value="weekly"]');

    //Make weekly the default schedule option
    if (weeklyRadio) {
      weeklyRadio.checked = true;
    }
    
    //Find confirm class button 
    const confirmButton = $("#confirm-class-button");

    //Set the button name back to "Add Class" afterwards
    if (confirmButton) {
      confirmButton.textContent = "Add Class"
    }
    
    //Update which schedule inputs are visible
    updateClassOptions();
  } 

//CLASSES CRUD-----------------------------------------------------
  //Function for opening up the class editor
  function openClassEditor(item = null) {

    //Clear the old information 
    //So that users don't see the old stuff here when editing
    resetClassModal();

    //If item exists
    if (item) {

      //Figure out which class is being edited using the ID
      editingClassId = item.id;

      //Put the saved class name into the input
      if (className) {
        className.value = item.name || "";
      }

      //Read the saved schedule type
      //Have a fallback that supports older classes
      const repeat = item.repeat || item.type || "weekly";

      //Find the correct radio button for the saved schedule.
      const selectedRadio = $(`input[name="class-repeat"][value="${repeat}"]`);

      //Select that schedule type.
      if (selectedRadio) {
        selectedRadio.checked = true;
      }

      //Find the weekday input element
      const weekdayInput = $("#class-weekday");

      //If weekdayInput exists, set the weekday to the weekday inputed
      if (weekdayInput) {
        weekdayInput.value = String(item.weekday ?? "1");
      }

      //Find the date input element
      const dateInput = $("#class-date");

      //If dateInput exists, set the date to the inputed date
      if (dateInput) {
        dateInput.value = item.date || "";
      }

      //Find the confirm button in HTML
      const confirmButton = $("#confirm-class-button");

      //If confirm button exists, set the name to "Save Changes" for confirmation
      if (confirmButton) {
        confirmButton.textContent = "Save Changes";
      }

    } else {

      //Otherwise, if adding a class, add this class to the list
      if (className) {
        className.value = $("#class-input")?.value.trim() || "";
      }
    }

    //Show the correct inputs based on the selected schedule type.
    updateClassOptions();

    //Open the existing class details modal.
    openModal(classModal);
  }

  //Listen for clicks on the add class button
  //If add button clicked, open the class editor
  $("#add-class-button")?.addEventListener("click", () => {
    openClassEditor();
  });

  //Listen for the keyboard input "Enter"
  //This will also open up the class editor
  $("#class-input")?.addEventListener("keydown", (event) => {
    if(event.key === "Enter") {
      openClassEditor();
    }
  });

  //Listening when close button is clicked as to close modal
  $("#close-class-modal")?.addEventListener("click", () => {
    closeModal(classModal);

    //Reset the editing information
    resetClassModal();
  });

  //Listening for the confirm add/change class 
  $("#confirm-class-button")?.addEventListener("click", () => {
    
    //Get the name entered by the user
    const name = className?.value.trim();

    //Get the repeat value (checking if class repeats) from the user
    const repeat = $('input[name="class-repeat"]:checked')?.value || "weekly";

    //Do not allow an empty class name
    if (!name) {

      //Alert message for empty class
      alert("Please enter a class name.");
      return;
    }

    //Storing information that will be added or updated
    const data = {
      name,
      repeat
    };

    //If the class type is weekly,
    //save the selected weekday for that weekly class
    if (repeat === "weekly") {
      data.weekday = Number($("#class-weekday")?.value || "1");
    } else {

      //Otherwise, the class type is one time
      //And save the date for the one time class
      data.date = $("#class-date")?.value || "";

      //Ask user to choose a date for the one time class if input is empty
      if (!data.date) {
        alert("Choose a date for this class.");
        return;
      }
    }
      //If editingClassId is not null, the user is editing an existing class
      const wasEditing = editingClassId !== null;

      //Update the existing class by checking if user is editing first
      if (wasEditing) {

        //Find the existing class by its ID
        const existing = classes.find((entry) => entry.id === editingClassId);

        //Stop if the saved class cannot be found
        if (!existing) {

          //Alert message for class that can't be found
          alert("This class could not be found. Please reopen it.");

          //Close the class modal
          closeModal(classModal);

          //Empty out all the fields in the class modal
          resetClassModal();

          //Refresh the whole website
          renderAll();

          return;
        }

        //Update the existing class object withough ID changing
        Object.assign(existing, data);

        //Deleting old class type assigned to class
        //If the class is now weekly, remove any old one-time date
        if (repeat === "weekly") {
          delete existing.date;

        } else {
          //If the class is now one-time, remove its old weekly weekday
          delete existing.weekday;
        }

        //Remove the old type property if it exists on legacy class data
        delete existing.type;

      } else {

        //Otherwise, if creating a new class,
        //create a new class object and generate a unique ID
        classes.push({
          id: createId(),
          ...data
        });
      }

      //Save the updated classes array in the browser's localStorage
      saveClasses();

      //Hide the Class Details popup
      closeModal(classModal);

      //Reset back to Add Class mode
      resetClassModal();

      //Find the quick input element
      const quickInput = $("#class-input");

      //Clear the quick-add input
      if (quickInput) {
        quickInput.value = "";
      }

      //Refresh everything in the website
      renderAll();

      //Display a message saying the class was update/added as confirmation
      notify(wasEditing
        ? "Class updated!"
        : "Class added!"
      );
    }
  );

  //Function for creating a class list
  //Displays all the classes
  function createClassesList() {

    //Find the existing Classes section
    const section = $(".classes-section");

    //If the section doesn't exist or the list has already been created, stop
    if (!section || $("#saved-classes-container")) {
      return;
    }

    //Create a container for saved classes
    const container = document.createElement("div");

    container.id = "saved-classes-container";

    //Add a heading, counter, and list in innerHTML
    container.innerHTML = `
      <div class="saved-classes-heading">
        <h3>Your Classes</h3>
        <span id="saved-classes-count">0</span>
      </div>

      <div id="saved-classes-list"></div>
    `;

    //Insert the new container into the page
    section.appendChild(container);
  }

//CLASSES RENDERING-----------------------------------------------------
  //Function for rendering the classes
  //and how they will be displayed
  function renderClassesList() {

    //Find the saved classes list
    const list = $("#saved-classes-list");

    //Find the total class counter
    const count = $("#saved-classes-count");

    //If list doesn't exist, do nothing
    if (!list) return;

    //Clear previously displayed class rows
    list.replaceChildren();

    //Show the total number of classes
    if (count) {
      count.textContent = String(classes.length);
    }

    //If there aren't any saved classes
    if (!classes.length) {

      //Create an empty state container
      const empty = document.createElement("p");

      //Styling the empty state container
      empty.className = "saved-classes-empty";

      //Empty classes will just display message below
      empty.textContent = "No classes added yet.";

      //Setting the list to having nothing in it
      list.appendChild(empty);
      return;
    }

    //Get each item in the class array
    classes.forEach((item) => {

      //Get the class schedule type
      const repeat = item.repeat || item.type || "weekly";

      //Format the class schedule
      const schedule = repeat === "weekly"
        ? `Every ${weekdayNames[Number(item.weekday)] || "week"}`
        : formatDate(item.date);

      //Creating the class row
      const row = document.createElement("div");

      //Styling the class row
      row.className ="saved-class-item";

      //Creating the info for the class 
      const info = document.createElement("div");

      //Styling the info for the class
      info.className = "saved-class-info";

      //Create the class name element
      const name = document.createElement("strong");

      //Giving thee name for the class name,
      //otherwise, return unnamed class
      name.textContent = item.name || "Unnamed class";

      //Create the schedule description
      const details = document.createElement("small");

      //Give the description the description of the schedule
      details.textContent = schedule;

      //Add the name and schedule
      info.append(name, details);

      //Create an edit button
      const editButton = document.createElement("button");

      //Prevent accidental form submission
      editButton.type = "button";

      //Styling the edit button
      editButton.className = "saved-class-edit";

      //Use a pencil as the button icon
      editButton.textContent = "✎";

      //Show what the button does when you hover over it
      editButton.title = "Edit class";

      //Give the button an accessible label for assistive technology
      editButton.setAttribute(
        "aria-label",
        `Edit ${item.name || "class"}`
      );

      //When clicked, open the class details modal with this class's saved values.
      editButton.addEventListener("click", () => {
          openClassEditor(item);
        }
      );

      //Create the existing delete button
      const remove = document.createElement("button");

      //Prevent from accidently deleting a task
      remove.type = "button";

      //Styling the delete button
      remove.className = "saved-class-delete";

      //Use an X as the button icon
      remove.textContent = "✕";

      //This is the message you see when you hover over it
      remove.title = "Delete class";

      //Give button an accessible label for assistive technology
      remove.setAttribute(
        "aria-label",
        `Delete ${item.name || "class"}`
      );

      //Listening for if the class is getting removed
      //And if the delete button has been clicked
      remove.addEventListener("click", () => {

          //Ask user to confirm deletion
          //Allow user to cancel deletion
          if (!confirm(`Delete "${item.name}"?`)) {
            return;
          }

          //Keep every class except the one being deleted
          classes = classes.filter(
            (entry) => entry.id !== item.id
          );

          //Save the updated classes array
          saveClasses();

          //Refresh the whole website
          renderAll();

          //Send the user a message confirming that they deleted the class
          notify("Class deleted.");
        }
      );

      //Create a container to hold both action buttons side by side
      const actions = document.createElement("div");

      //Styling action buttons element
      actions.className = "saved-class-actions";

      //Adding the edit and delete button to actions
      actions.append(
        editButton,
        remove
      );

      //Adding class information and the action buttons
      row.append(
        info,
        actions
      );

      //Insert the row into the class list
      list.appendChild(row);
    });
  }

//CALENDAR-----------------------------------------------------
//CALENDAR ELEMENTS--------------------------------------------

  //Create a date object representing now's time
  const initialDate = new Date();

  //Get the current year
  let displayedYear = initialDate.getFullYear();

  //Get the current month
  let displayedMonth = initialDate.getMonth();

  //Function for finding the class scheduled for a calendar day
  function getClassesForDate(date) {

    //Create a new array containing matching classes
    return classes.filter((item) => {

      //Read the saved repeat type
      const repeat = item.repeat || item.type;

      //Check that the class type is weekly
      if (repeat === "weekly") {

        //If so, give the item a weekday number
        return Number(item.weekday) === date.getDay();
      }

      //Otherwise, for non weekly classes, compared storted date
      //against calendar day
      return item.date === dateKey(date);
    });
  }

//CALENDAR RENDERING-----------------------------------------------------
  
  //Function for rendering the appearance of the calendar
  function renderCalendar() {

    //Find the grid where calendar day cells will be inserted
    const grid = $("#calendar-grid");

    //Find the heading that displays the current month and year
    const heading = $("#calendar-month");

    //If the calendar elements like the cells or headings is missing, stop and do nothing
    if (!grid || !heading) return;

    //Create a date object representing the first day of the displayed month
    //Day starts at 1
    const first = new Date(
      displayedYear,
      displayedMonth,
      1
    );

    //Create a date object for determining how many days in currently displayed month
    //0 is the final day of last month
    const daysInMonth = new Date(
      displayedYear,
      displayedMonth + 1,
      0
    ).getDate();

    //Convert the first day into a readable month and year
    heading.textContent = first.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      });

    //Remove previously generated calender cells
    //This is to prevent duplicate dates when changing months or refreshing
    grid.replaceChildren();

    //Keep creating blank cells until the starting weekday has been reached
    //Start the loop at 0
    for (let index = 0; index < first.getDay(); index++) {
      
      //Create an empty calendar cell
      const blank = document.createElement("div");

      //Styling the blank calendar spaces
      blank.className = "calendar-day empty";

      //Add the blank cell to the grid
      grid.appendChild(blank);
    }

    //Generate every day in the month for each cell
    //Start at day 1
    for (let day = 1; day <= daysInMonth; day++) {
      
      //Create a date object for current day in loop
      const date = new Date(
        displayedYear,
        displayedMonth,
        day
      );

      //Convert the date into YYYY-MM-DD format
      const key = dateKey(date);

      //Create a new div representing one day
      const cell = document.createElement("div");

      //Styling the calendar day element
      cell.className = "calendar-day";

      //Comparing the calender cell's date with today's date
      if (key === todayKey()) {

        //Add the CSS class used to highlight current day
        cell.classList.add("today");
      }

      //Create a div to display the number of the day
      const number = document.createElement("div");

      //Styling the number of the day
      number.className = "calendar-date-number";

      //Convert the numeric day to text
      number.textContent = String(day);

      //Insert the day number into the calendar cell
      cell.appendChild(number);

      //Saved tasks for each calendar day
      tasks
        //Checking task's due date matches the current calendar cell
        .filter((task) => task.dueDate === key)

        //Create an element for each match
        .forEach((task) => {

          //Create a span for the first time
          const element = document.createElement("span");

          //Apply the tasks's priority class
          element.className = `calendar-task ${getPriority(task.dueDate)}`;

          //Add a special CSS class if the task is completed
          if (task.completed) {
            element.classList.add("completed");
          }

          //Display the saved task name
          element.textContent = task.name;

          //When hovering over the task, show the task name
          element.title = task.name;

          //Add the task to the designated calendar cell
          cell.appendChild(element);
        });

      //Saved important dates for each calendar day
      importantDates
        
        //Checking calendar's date matches current calendar cell
        .filter((item) => item.date === key)

        //Create an element for each match
        .forEach((item) => {

          //Create an element for the date
          const element = document.createElement("span");

          //Styling the each date based on personal and school/work
          element.className = `calendar-important-date ${item.type || "school-work"}`;

          //Display important date's name
          element.textContent = item.name;

          //When hovering over important date, display its name
          element.title = item.name;

          //Add the important date to the designated calendar cell
          cell.appendChild(element);
        });

      //Saved classes for each calendar day
      getClassesForDate(date).forEach((item) => {
        
        //Create an element for the class
        const element = document.createElement("span");

        //Determine whether class is weeekly or one time
        const repeat = item.repeat || item.type;

        //Styling based on whether the class time it weekly or one time
        element.className = `calendar-class ${repeat === "weekly"
          ? "weekly"
          : "one-time"}`;

        //Show the class name
        element.textContent = item.name;

        //When hovering over class, show its name
        element.title = item.name;

        //Add class to its designated calendar cell
        cell.appendChild(element);
      });

      //Insert the entire cell into the grid after adding all necessary stuff
      grid.appendChild(cell);
    }
  }

  //Listens for when the user clicks button for previous button
  $("#previous-month")?.addEventListener("click", () => {
    
    //If clicked, display last month
    displayedMonth--;

    //If the displayed month after being subtracted is less than 0
    //Set the displayed month to 11 (December), and subtract the year
    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear--;
    }

    //Rebuild the calendar based on the month changes
    renderCalendar();
  });

  //Listens for when the user clicks the button for the next month
  $("#next-month")?.addEventListener("click", () => {
    
    //If clicked, show next month
    displayedMonth++;

    //If displayed month is more than 11 (December),
    //then set displayed month to 0 (January) and next year
    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear++;
    }

    //Rebuild calender based on the month changes
    renderCalendar();
  });

//COIN PENALTY SYSTEM-----------------------------------------------------
  
  //Number of milliseconds converted to a 24 hour day
  const MS_PER_DAY = 86400000;

  //Function for converting date into day number
  function dayNumber(value) {

    //Convert date spring into JavaScript date object
    const date = parseDate(value);

    //Stop if the date is invalid
    if (!date) return null;

    //Create a calendar timestamp with the provided year, month, and day in UTC
    return Math.floor(Date.UTC(
      date.getFullYear(),         //Extract the year
      date.getMonth(),            //Extract the month
      date.getDate()              //Extract the day
    ) / MS_PER_DAY);
  }

  //Function for applying the penalities for coins
  function applyOverduePenalties() {

    //Store today's date as YYYY-MM-DD
    const today = todayKey();

    //Convert today's date into numeric day index
    const todayNumber = dayNumber(today);

    //Stores the combined number of coins that is to be deducted from all tasks
    let totalPenalty = 0;

    //Tracks whether at least a task needs penalty infomation updated
    let changed = false;

    //Check each task stored in the tasks array
    tasks.forEach((task) => {

      //If task is completed or task has no due date, do nothing
      if (task.completed || !task.dueDate) return;

      //If due date yet to come, do nothing
      if (task.dueDate >= today) return;

      //Convert the tasks's due date into numeric calendar day index
      const dueNumber = dayNumber(task.dueDate);

      //If date is invalid date, don't charge
      if (dueNumber === null) return;

      //Find task creation timestamp and fonvert it to local date
      //Otherwise, use tasks's due date
      //Fallback supports older tasks
      const createdDate = task.createdAt
        ? dateKey(new Date(task.createdAt))
        : task.dueDate;

      //Convert creation date into numeric day index
      const createdNumber = dayNumber(createdDate);

      //Track the most recent calendar day already charged
      //If no previous penalty exists, start from the later of the tasks's due and creation day
      const lastPenaltyNumber = task.lastPenaltyDate
        ? dayNumber(task.lastPenaltyDate)
        : Math.max(dueNumber, createdNumber ?? dueNumber);

      //Otherwise, skip task if previous penalty date is invalid
      if (lastPenaltyNumber === null) return;

      //Subtracting the last charged day with today's day number
      //This is to figure out how much the penalty is
      const daysToCharge = Math.max(0, todayNumber - lastPenaltyNumber);

      //If tasks have at least on uncharged overdue day
      //process those tasks
      if (daysToCharge > 0) {

        //Add this task's penalty to combined total
        totalPenalty += daysToCharge;

        //Recorrd today as the most recent penalty date for this task
        task.lastPenaltyDate = today;

        //Mark that the saved data has changed
        changed = true;
      }
    });

    //If penalties were calculated,
    //update the coin amount
    if (changed) {

      //Subtract tokens with the total penalty calculated
      tokens -= totalPenalty;

      //Save the tasks, including updated lastPenaltyDate
      saveTasks();

      //Save new coin balance
      saveTokens();

      //Refresh visible coin counters
      updateTokens();

      //Send a message to user of the overdue penalty
      notify(`Overdue penalty: -${totalPenalty} coin${totalPenalty === 1 ? "" : "s"}`);
    }
  }

//TODAY'S TASK FLOATING WINDOW-----------------------------------------------------
  
  //Stores the seperate Picture-in-Picture window when one is currently open
  //Null means no window is tracked
  let todayTasksWindow = null;

  //Stores the fallback floating panel when Picture-in-Picture is unavaliable
  let todayTasksFallback = null;

  //Function for getting today's tasks
  function getTodayTasks() {

    //Get today's local calendar date as YYYY-MM-DD
    const today = todayKey();

    //Return matching tasks from saved tasks array
    return tasks

      //Creates array containing tasks that meet conditions
      .filter((task) =>

      //Task must have a due date
      //Include every task due today...
      task.dueDate && (task.dueDate === today || (
        
        //due the day before too but only if unfinished  
        task.dueDate < today &&
          !task.completed
        )
      )
    )

    //Sorting the tasks by completion
    //Overdue tasks on top, not overdue tasks placed later
    //Also sort by due date 
    .sort((a, b) =>
      Number(Boolean(a.completed)) - Number(Boolean(b.completed)) ||
      a.dueDate.localeCompare(b.dueDate)
    );
  }

  //Function for rendering today's task window
  //Doc is the document belonging to Picture-in-Picture window
  function renderTodayTasksContent(doc) {

    //Search inside the document, not necessarily main webpage
    const list = doc.getElementById("floating-tasks-list");

    //Stop if the task list does not exist
    if (!list) return;

    //Remove all existing child elements
    //This prevents duplicate tasks rows when floating panel refreshes
    list.replaceChildren();

    //Retrieve the tasks due today and unfinished overdue tasks
    const relevant = getTodayTasks();

    //If no tasks match conditions, display empty state message
    if (!relevant.length) {

      //Create a paragraph inside floating window's document
      const empty = doc.createElement("p");

      //Styling the empty state element
      empty.className = "floating-empty";

      //Display the message below if there's no tasks today
      empty.textContent = "No tasks due today or overdue. 🎉";

      //Add the message to the task list
      list.appendChild(empty);
      return;
    }

    //Loop through the matching tasks
    relevant.forEach((task) => {

      //A task is overdue if its due date is earlier today
      const overdue = task.dueDate < todayKey();

      //Create a row label element
      //This allows users to click the task row to toggle checkbox
      const row = doc.createElement("label");

      //Styling the row label element
      row.className = "floating-task";

      //If overdue exists, add the overdue task styling
      if (overdue) {
        row.classList.add("overdue");
      }

      //If task is completed, add the completed task styling
      if (task.completed) {
        row.classList.add("completed");
      }

      //Create an input element in the floating document
      const checkbox = doc.createElement("input");

      //Make it a checkbox
      checkbox.type = "checkbox";

      //Restore its checked state fromo saved task
      checkbox.checked = Boolean(task.completed);

      //Create a div for tasks's name and due date information
      const details = doc.createElement("div");

      //Styling the details element
      details.className = "floating-task-details";

      //Create a strong element to display the task name
      const name = doc.createElement("strong");

      //Show the task's saved name
      name.textContent = task.name;

      //Create a smaller text element for the task's deadline
      const due = doc.createElement("small");

      //Choose text according to whether task is overdue or not
      due.textContent = overdue
        ? `⚠ Overdue · ${formatDate(task.dueDate)}`
        : `Due today · ${formatDate(task.dueDate)}`;

      //Add the name and due date inside details container
      details.append(name, due);
      
      //Add the checkbox and details to the main row
      row.append(checkbox, details);

      //Listen for if the user checks or unchecks a floating task
      checkbox.addEventListener("change", () => {

        //Search the main tasks array for the matching task ID
        //This is to retrieve the correct current stored object
        const current = tasks.find((item) => item.id === task.id);

        //Stop if the task was deleted or no longer can be found
        if (!current) return;

        //Reuse the completion function from the tasks section
        setTaskCompleted(current, checkbox.checked);
      });

      //Insert the finished task row into the floating checklist
      list.appendChild(row);
    });
  }

  //Function for creating the Picture-in-Picture window
  function createFloatingTasksLayout(doc) {
    
    //Remove existing child elements from target document's head
    //This is to prepare the viewport for settings and styles
    doc.head.replaceChildren();

    //Create a new meta element
    const meta = doc.createElement("meta");

    //Give the meta element for the viewport name
    meta.name = "viewport";

    //Set the content width behavior for responsive layouts
    meta.content = "width=device-width, initial-scale=1";

    //Create a style element for all the floating panel's CSS
    const style = doc.createElement("style");

    //CSS stored in a template literal so JavaScript
    //can insert it into target document
    style.textContent = `
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-width: 220px;
        background: #f6f7f7;
        color: #1d303b;
        font-family: Arial, sans-serif;
      }

      .floating-header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px;
        background: #d0f1e3;
      }

      .floating-header button {
        border: 0;
        border-radius: 7px;
        padding: 5px 9px;
        background: white;
        cursor: pointer;
      }

      .floating-subtitle {
        padding: 12px 14px 0;
        color: #78878e;
        font-size: 11px;
      }

      #floating-tasks-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
        padding: 12px 14px;
      }

      .floating-task {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
        background: white;
        border: 1px solid #e4ebeb;
        border-radius: 12px;
        cursor: pointer;
      }

      .floating-task input {
        width: 17px;
        height: 17px;
        accent-color: #198f86;
      }

      .floating-task-details {
        min-width: 0;
      }

      .floating-task strong {
        display: block;
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      .floating-task small {
        display: block;
        margin-top: 6px;
        color: #839198;
        font-size: 11px;
      }

      .floating-task.overdue {
        background: #fff0f0;
        border-color: #efc8c8;
      }

      .floating-task.overdue small {
        color: #b94f4f;
      }

      .floating-task.completed {
        opacity: .55;
      }

      .floating-task.completed strong {
        text-decoration: line-through;
      }

      .floating-empty {
        padding: 25px 10px;
        text-align: center;
        color: #84939a;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #171c24;
          color: #edf3f4;
        }

        .floating-header {
          background: #294c43;
          color: #d1f5e8;
        }

        .floating-task {
          background: #242c36;
          border-color: #46525d;
        }

        .floating-task small {
          color: #aebdc6;
        }

        .floating-task.overdue {
          background: #493038;
          border-color: #805157;
        }
      }
    `;

    //Add both elements into target document's head
    doc.head.append(meta, style);

    //Create innerHTML for the floating window
    doc.body.innerHTML = `
      <header class="floating-header">
        <strong>📋 Today's Tasks</strong>
        <button
          id="floating-close"
          type="button"
        >✕</button>
      </header>

      <div class="floating-subtitle">
        Due today + unfinished overdue tasks
      </div>

      <main id="floating-tasks-list"></main>
    `;

    //Find the close button inside the floating document
    doc.getElementById("floating-close")
      ?.addEventListener("click", () => {

        //If a separate PiP window exists is open, close it
        if (todayTasksWindow && !todayTasksWindow.closed) {
          
          //Close the separate window
          todayTasksWindow.close();

          //Clear the saved reference
          todayTasksWindow = null;

        } else if (todayTasksFallback) {
          
          //If no PiP window is open, remove fallback element

          //Remove the entire panel from the main webpage
          todayTasksFallback.remove();

          //Clear its stored reference
          todayTasksFallback = null;
        }
      });

    //Generate the current task rows inside the newly created layout
    renderTodayTasksContent(doc);
  }

  //Function for opening a fallback task panel
  //This is when the PiP window is unavaliable or cannot be opened
  function openFallbackTasksPanel() {

    //Create a div to contain floating tasks interface
    const panel = document.createElement("div");

    //Give the panel a unique ID
    panel.id = "today-tasks-fallback";

    //Used for stylizing the window
    //Assigns several inline CSS declarations at once
    panel.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 340px;
      height: 500px;
      max-width: calc(100vw - 20px);
      max-height: calc(100vh - 20px);
      min-width: 240px;
      min-height: 200px;
      resize: both;
      overflow: auto;
      background: white;
      border: 1px solid #dce5e5;
      border-radius: 16px;
      box-shadow: 0 18px 55px rgba(0,0,0,.25);
      z-index: 9000;
    `;

    //Create a fram containing a separate document within the main page
    //This lets the floating panel use its own layout and styling
    const frame = document.createElement("iframe");

    //Give the iframe an accesssible title
    frame.title = "Today's Tasks";

    //Make iframe fill the panel
    //Remove borders so it appears integrated into the floating window
    frame.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 16px;
    `;

    //Place the iframe inside the floating panel
    panel.appendChild(frame);

    //Insert the floating panel into the main document body
    document.body.appendChild(panel);

    //Tracks the created panel, allowing other function to refresh or close it
    todayTasksFallback = panel;

    //Get the document inside the iframe
    const doc = frame.contentDocument;

    //If iframe document can't be accessed, stop
    if (!doc) return;

    //Add the floating window's CSS, header, and task checklist
    createFloatingTasksLayout(doc);

    //Search inside the iframe document for the floating header element
    const header = $(".floating-header", doc);

    //If header is missing, stop
    if (!header) return;

    //Tracks whether user is currently dragging panel
    let dragging = false;

    //Stores the pointer's starting screen coordinates
    let startX = 0;
    let startY = 0;

    //Stores the panel's position before dragging begins
    let originalLeft = 0;
    let originalTop = 0;

    //Show the move cursor when hovering over the header
    header.style.cursor = "move";

    //Listen for when the user's button is pressed
    //This tracks the dragging motion
    header.addEventListener("pointerdown", (event) => {
      
      //If pointer was pressed on the close button, don't start dragging
      if (event.target.closest("button")) {
        return;
      }

      //Mark dragging as active
      dragging = true;

      //Read the panel's current on screen position and dimension
      const rect = panel.getBoundingClientRect();

      //Pull the original coordinates from where the panel started
      originalLeft = rect.left;
      originalTop = rect.top;

      //Pull the original coordinates for the mouse pointer
      startX = event.screenX;
      startY = event.screenY;

      //Keeps subsequent pointer events directed to this header while dragging
      header.setPointerCapture(event.pointerId);
    });

    //Listens for when the pointer moves 
    header.addEventListener("pointermove", (event) => {
      
      //Do nothing unless dragging has already started
      if (!dragging) return;

      //Subtract the starting pointer position from current position
      //Then add that movement to panel's original horizonal position
      const left = originalLeft + event.screenX - startX;

      //Subtract the starting pointer position from current position
      //Then add that movement to panel's original vertical position
      const top = originalTop + event.screenY - startY;

      //Apply the switch positioning rules
      //When dragging, switch horizontal/vertical positioning
      panel.style.right = "auto";
      panel.style.bottom = "auto";

      //Prevents dragging the panel's top-left corner beyond the left edge
      panel.style.left = `${Math.max(0, left)}px`;

      //Prevent the top edge from moving above the browser viewport
      panel.style.top = `${Math.max(0, top)}px`;
    });

    //Listen for the pointer is released
    //This way, it deactivates the dragging motion
    header.addEventListener("pointerup", () => {
      dragging = false;
    });

    //Listen for when browser cancels pointer event
    //This will also deactivate the dragging
    header.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  //Function for toggling (open/close) today's task window
  async function toggleTodayTasksWindow() {
    
    //Check whether a separate PiP window exists and is still open
    if (todayTasksWindow && !todayTasksWindow.closed) {

      //Close the window
      todayTasksWindow.close();

      //Clear its reference
      todayTasksWindow = null;
      return;
    }

    //If fallback panel exists, clicking button closes it again
    if (todayTasksFallback) {

      //Remove it from the page
      todayTasksFallback.remove();

      //Clear the saved reference
      todayTasksFallback = null;
      return;
    }

    //Check for API avalibility and whether the page is running
    //in secure browser context
    if ("documentPictureInPicture" in window && window.isSecureContext) {
      
      //Attempt the open the PiP window
      try {

        //Asking PiP window with the specified dimensions
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 340,
          height: 500
        });

        //Save the new window
        todayTasksWindow = pipWindow;

        //Create the header, stlye, and task list in the PiP window's separate document
        createFloatingTasksLayout(pipWindow.document);

        //Listening for when PiP document is being dismissed
        //Activate pagehide if above condition met
        pipWindow.addEventListener("pagehide", () => {

          //Clear the saved reference only if it still points to this exact window
          if (todayTasksWindow === pipWindow) {
            todayTasksWindow = null;
          }
        },

        //Remove listener after it runs once
        { once: true });

        return;
      } catch (error) {

        //Catch error if PiP window can't load
        console.warn("Picture-in-Picture unavailable:", error);
      }
    }

    //Create a floating iframe panel if PiP isn't avaliable or can't open
    openFallbackTasksPanel();
  }


  //Function for rendering today's tasks panel
  function renderTodayPanel() {

    //Check whether a separate PiP window is avaliable
    if (todayTasksWindow && !todayTasksWindow.closed) {

      //Open and rebuild the task row inside the PiP window's document if so
      renderTodayTasksContent(todayTasksWindow.document);
    }

    //Check whether the iframe fallback has been created
    if (todayTasksFallback) {

      //Find the iFrame inside the panel
      const frame = $("iframe", todayTasksFallback);

      //Ensure the iframe and its document can be accessed
      if (frame?.contentDocument) {

        //Rebuild the floating task rows using latest task information if so
        renderTodayTasksContent(frame.contentDocument);
      }
    }
  }

  //Listen for pressing down onto the today's task button
  //This will open up the today's task panel
  $("#daily-tasks-button")?.addEventListener("click", toggleTodayTasksWindow);

//LOCKIN SYSTEM-------------------------------------------------------------
//LOCKIN TIME SELECTION-----------------------------------------------------

  //Find the main Lock-in setup modal
  const lockinModal = $("#lockin-modal");

  //Find the section containing preset durations
  const timeOptions = $("#lockin-time-options");

  //Find the section where users can enter a custom duration in minutes
  const customSection = $("#custom-time-section");

  //Find the confirmation section where the user confirms they are ready to focus
  const roomClearSection = $("#room-clear-section");

  //Find the element describing the current step of the setup process
  const lockinDescription = $("#lockin-description");

  //Stores the user's selected focus duration
  //Null means no duration has been selected
  let selectedLockinMinutes = null;

  //Stores the interval ID for the countdown.
  let lockinTimer = null;

  //Stores the exact timestamp when the focus session should finish
  let lockinEndTime = null;

  //Stores the separate popup Window object.

  //This allows the website to update the timer and close or modify the popup's contents
  let lockinWindow = null;

  //Function that refreshs and cleans all inputs in lockin modal
  function resetLockinModal() {

    //Forget the previously selected duration
    selectedLockinMinutes = null;

    //Display the preset time choices
    show(timeOptions);

    //Hide the custom duration input
    hide(customSection);

    //Hide the final confirmation step
    hide(roomClearSection);

    //Restore the original description
    if (lockinDescription) {
      lockinDescription.textContent = "How long are we locking in?";
    }

    //Find the custom duration input
    const customInput = $("#custom-time-input");

    //Remove any previously typed value
    if (customInput) {
      customInput.value = "";
    }
  }

  //Listen for clicks on the lock in button
  //If clicked, open up the lock in time selection page
  $("#lockin-button")?.addEventListener("click", () => {

    //Start with a fresh setup screen
    resetLockinModal();

    //Display the lock in modal
    openModal(lockinModal);
  });

  //Click for clicks closing the lock in model
  //If so, close the lock in time selection page
  $("#close-lockin-modal")?.addEventListener("click", () => {

    //Hide the setup modal
    closeModal(lockinModal);

    //Clear the selected duration and set back to the default 
    resetLockinModal();
  });

  //Listen for if user clicked on custom time button
  //If so, open up the popup for inputting a custon time
  $("#custom-time-button")?.addEventListener("click", () => {

    //Hide the preset duration buttons
    hide(timeOptions);

    //Display the custom time controls
    show(customSection);

    //Change the instructions to ask for a custom time
    if (lockinDescription) {
      lockinDescription.textContent = "Choose your focus duration.";
    }

    //Move keyboard focus to the input so the user can type immediately
    $("#custom-time-input")?.focus();
  });

//LOCKIN ROOM CLEAR-----------------------------------------------------

   //Function that checks whether the selected duration is a valid number
  function showRoomConfirmation() {

    //Checks whether the selected value is a whole number
    //Also checks if the numbers are within appropriate range

    if (!Number.isInteger(selectedLockinMinutes) || selectedLockinMinutes < 1 || selectedLockinMinutes > 720) {

      //Inform the user of the allowed range
      alert("Choose between 1 and 720 minutes.");

      return;
    }

    //Hide the preset time choices
    hide(timeOptions);

    //Hide the custom duration input
    hide(customSection);

    //Show the final confirmation section
    show(roomClearSection);

    //Display the chosen focus duration
    if (lockinDescription) {

      //Set description to the selected lock in minutes
      lockinDescription.textContent =`${selectedLockinMinutes}-minute focus session`;
    }

    //Move keyboard focus to the button that starts the session.
    $("#confirm-room-clear")?.focus();
  }

  //Select every preset duration button
  $$(".lockin-time").forEach((button) => {

    //Each one listens for if they are clicked
    //If clicked, that is the selected time
    button.addEventListener("click", () => {

      //Read the data minutes attribute
      selectedLockinMinutes = Number(
        button.dataset.minutes
      );

      //Validate the duration and display the final confirmation step
      showRoomConfirmation();
    });
  });

  //Listen for if user clicked to start session in custom time input
  //If so, set the selected time to whatever was in the input
  $("#start-custom-time")?.addEventListener(
    "click",
    () => {

      //Find the custom duration input and convert its value to a number
      selectedLockinMinutes = Number($("#custom-time-input")?.value);

      //Check that the duration is valid before advancing to confirmation
      showRoomConfirmation();
    }
  );
//LOCKIN FOCUS MODAL TIMER-----------------------------------------------------

  //Function for showing the timer and how much time is left
  //Seconds it used to track the timer as it goes down
  function formatRemaining(seconds) {

    //Get ths minutes by diving the seconds by 60
    const minutes = Math.floor(seconds / 60);

    //Find the remaining seconds using the % operand
    const remainingSeconds = seconds % 60;

    //Convert both numbers to strings
    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(remainingSeconds).padStart(2, "0")}`
    );
  }
  //Function for when the timer reaches 0
  function finishLockin() {

    //Cancel the repeating countdown interval
    clearInterval(lockinTimer);

    //Clear the saved timer reference
    lockinTimer = null;

    //Clear the session's scheduled end time
    lockinEndTime = null;

    //Tell user that the lock in session has ended
    notify("Lock in session complete! Great work.");

    //Only modify the popup if it exists and the user hasn't already closed it
    if (lockinWindow && !lockinWindow.closed) {

      //Access the popup's document
      //This allows us to modify the contents of the separate window
      const doc = lockinWindow.document;

      //Search for the audio element inside the focus popup
      const focusAudio = doc.querySelector("audio");

      //Stop audio if the element exists
      if (focusAudio) {

        //Pause the current music track
        focusAudio.pause();

        //Remove the selected audio source
        focusAudio.removeAttribute("src");

        //Reset the audio element
        focusAudio.load();
      }
//LOCKIN COMPLETION-----------------------------------------------------
      
      //Uses HTML to display 
      doc.body.innerHTML = `
        <main style="
          min-height:100vh;
          display:grid;
          place-items:center;
          text-align:center;
          background:#e7e8e8;
          color:#1d303b;
          font-family:Arial,sans-serif;
        ">
          <div>
            <h1>Session Complete!</h1>

            <p>You earned 25 coins.</p>

            <button id="close-focus-window">
              Close
            </button>
          </div>
        </main>
      `;

      //Find the close button in the popup
      doc.getElementById("close-focus-window")
        ?.addEventListener("click", () => {

          //Close the separate focus window
          lockinWindow.close();
        });
    }
  }

  //Function for calculating how much time remains until the selected end timestamp.
  function updateLockinTimer() {

    //Stop if no active session end time exists
    if (!lockinEndTime) {
      return;
    }
    
    //Calulate remaining seconds by getting the current time stamp
    //and dividing it by the lock in end time 
    const seconds = Math.max(0, Math.ceil((lockinEndTime - Date.now()) / 1000));

    //Convert seconds into MM:SS format
    const time = formatRemaining(seconds);

    //Check whether the popup is still open
    if (lockinWindow && !lockinWindow.closed) {

      //Find the element displaying the timer
      const display = lockinWindow.document.getElementById("focus-countdown");

      //Update the visible countdown
      if (display) {
        display.textContent = time;
      }

      //Update the popup's browser title as the timer goes down
      lockinWindow.document.title = `${time} — Lock-in`;
    }

    //If no time remains, complete the session
    if (seconds <= 0) {
      finishLockin();
    }
  }

//LOCKIN FOCUS MODAL-----------------------------------------------------
 
  //Function for starting up the lock in session
  //Includes timer, music
  function startLockinSession() {

    //Validating the lock in time duration
    //The duration must be a whole number greater than or equal to one minute
    if (!Number.isInteger(selectedLockinMinutes) || selectedLockinMinutes < 1) {
      return;
    }

    //An existing interval means a session is already running
    if (lockinTimer) {

      //Send an alert message saying that session is already running
      alert("A Lock-in session is already running.");

      return;
    }
    //Store the chosen duration before resetting the modal
    const minutes = selectedLockinMinutes;

    //Hide the setup modal
    closeModal(lockinModal);

    //Restore the setup modal defaults
    resetLockinModal();

    //Getting the end time by getting the current timestamp
    //and adding it with the requested duration
    lockinEndTime = Date.now() + minutes * 60000;

    //Create a seperate window broswer for the lockin session
    lockinWindow = window.open("", "crow-lockin", "width=520,height=620");

    //If locked-in window is succesfully open
    if (lockinWindow && !lockinWindow.closed) {

      //Access the popup's document
      const doc = lockinWindow.document;

      //Prepares the popup document for content written with doc.write()
      doc.open();
   
      //Inserts the markupfor the focus session window
      doc.write(`
        <!DOCTYPE html>

        <html lang="en">

        <head>
          <meta charset="UTF-8">

          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
          >

          <title>Lock-in Session</title>

          <style>

            /*
             * Include padding and borders
             * in element dimensions.
             */
            * {
              box-sizing: border-box;
            }

            /*
             * MAIN POPUP BODY
             *
             * display: grid and
             * place-items: center
             * center the focus card.
             *
             * The linear-gradient creates
             * a soft background transition.
             */
            body {
              margin: 0;
              min-height: 100vh;

              display: grid;
              place-items: center;

              padding: 30px;

              background: linear-gradient(
                145deg,
                #d0f1e3,
                #e7e8e8
              );

              color: #1d303b;

              font-family: Arial, sans-serif;
            }

            /*
             * MAIN FOCUS CARD
             *
             * Contains the timer
             * and music player.
             */
            .focus-card {
              width: 100%;
              padding: 45px 25px;

              background: white;
              border-radius: 24px;

              text-align: center;

              box-shadow:
                0 20px 60px rgba(0,0,0,.1);
            }

            /*
             * MAIN HEADING
             */
            h1 {
              font-size: 25px;
            }

            /*
             * COUNTDOWN DISPLAY
             *
             * Uses large, bold text
             * so the timer is easy to read.
             */
            #focus-countdown {
              margin: 35px 0;

              color: #198f86;

              font-size: 65px;
              font-weight: 800;
            }

            /*
             * GENERAL PARAGRAPH STYLING
             */
            p {
              color: #72848b;
              line-height: 1.7;
            }

            /*
             * STUDY MUSIC PLAYER CONTAINER
             *
             * Separates music controls
             * from the main countdown.
             */
            .lockin-music-player {
              margin: 25px 0 10px;
              padding: 20px;

              background: #f0faf6;
              border: 1px solid #cde8dd;

              border-radius: 16px;

              text-align: left;
            }

            /*
             * MUSIC PLAYER HEADING
             */
            .lockin-music-player h2 {
              margin: 0 0 15px;

              font-size: 17px;
              color: #198f86;
            }

            /*
             * MUSIC SELECTION DROPDOWN
             *
             * Lets users choose a track
             * or turn music off.
             */
            #lockin-music-select {
              width: 100%;
              padding: 11px;

              border: 1px solid #cbded8;
              border-radius: 9px;

              background: white;
              color: #1d303b;

              font-size: 14px;
            }

            /*
             * MUSIC BUTTON AND VOLUME LAYOUT
             *
             * flex-wrap allows controls
             * to wrap on narrow windows.
             */
            .lockin-music-controls {
              display: flex;
              align-items: center;

              flex-wrap: wrap;

              gap: 12px;
              margin-top: 16px;
            }

            /*
             * PLAY / PAUSE BUTTON
             */
            #lockin-music-toggle {
              padding: 10px 18px;

              border: none;
              border-radius: 9px;

              background: #198f86;
              color: white;

              font-weight: 700;
              cursor: pointer;
            }

            /*
             * VOLUME SLIDER
             *
             * flex: 1 allows the slider
             * to use available space.
             */
            #lockin-music-volume {
              flex: 1;
              min-width: 90px;

              accent-color: #198f86;
            }

            /*
             * MUSIC STATUS MESSAGE
             *
             * Displays playback information
             * or an error message.
             */
            #lockin-music-status {
              margin: 12px 0 0;

              font-size: 12px;
              color: #72848b;
            }

          </style>
        </head>

        <body>

          <div class="focus-card">

            <h1>💪 Lock-in Session</h1>

            <p>
              Stay focused. You've got this.
            </p>

            <!--
              The countdown begins at the
              user's selected duration.

              JavaScript updates this element
              as the timer progresses.
            -->
            <div id="focus-countdown">
              ${formatRemaining(minutes * 60)}
            </div>

            <!-- Optional study music controls -->
            <div class="lockin-music-player">

              <h2> Study Music </h2>

              <!--
                Each option has a value used
                to identify its audio file.
              -->
              <select id="lockin-music-select">

                <option value="">
                  No Music
                </option>

                <option value="lofi">
                  ☕ Lofi Beats
                </option>

                <option value="softjazz">
                  🎵 Soft Jazz
                </option>

                <option value="ambient">
                  ⛰️ Mountain Ambience
                </option>

              </select>

              <div class="lockin-music-controls">

                <!-- Playback control -->
                <button
                  id="lockin-music-toggle"
                  type="button"
                >
                  ▶ Play
                </button>

                <label for="lockin-music-volume">
                  Volume
                </label>

                <!--
                  0 means muted.
                  100 means maximum volume.
                  35 is the starting setting.
                -->
                <input
                  id="lockin-music-volume"
                  type="range"
                  min="0"
                  max="100"
                  value="35"
                >

              </div>

              <!-- Playback messages appear here -->
              <p id="lockin-music-status">
                Choose a track to begin
              </p>

            </div>

            <p>
              Keep distracting devices away
              until your session is complete.
            </p>

          </div>

        </body>
        </html>
      `);

      //Completes the current document-writing operation
      //The popup's HTML elements can now be selected and configured
      doc.close();

//LOCKIN AUDIO SYSTEM-----------------------------------------------------
      //Find the music selection dropdown
      const musicSelect = doc.getElementById("lockin-music-select");

      //Find the Play/Pause button
      const musicToggle = doc.getElementById("lockin-music-toggle");

      //Find the volume slider
      const musicVolume = doc.getElementById("lockin-music-volume");

      //Find the music status text
      const musicStatus = doc.getElementById("lockin-music-status");

      //Create an audio element inside the popup document
      const focusAudio = doc.createElement("audio");

      //Repeat the selected music track when it reaches the end
      focusAudio.loop = true;

      //Seting the initial volume to 35%
      focusAudio.volume = 0.35;

      //Do not automatically preload music before the user chooses a track
      focusAudio.preload = "none";

      //Add the audio element to the popup
      doc.body.appendChild(focusAudio);

      //List of all the avaliable music tracks
      const musicTracks = {

        //Lofi music
        lofi: new URL("music/lofistudy.mp3", document.baseURI).href,

        //Soft jazz music
        softjazz: new URL("music/lofijazz.mp3", document.baseURI).href,

        //Mountain ambience
        ambient: new URL("music/mountainstudy.mp3", document.baseURI).href
      };

      //Function for updating state of the button
      function updateMusicButton() {

        //Toggle what the button should look like when audio is paued
        //If paused, play button. Otherwise, pause button
        musicToggle.textContent = focusAudio.paused
          ? "▶ Play"
          : "⏸ Pause";
      }

      //Listens for when the user chooses a different music track from dropdown menu
      musicSelect.addEventListener("change", async () => {

          //Read the currently selected dropdown option
          const selected = musicSelect.value;

          //Stop the previous track
          focusAudio.pause();

          //If no music is selected concurrently 
          if (!selected) {

            //Remove the previously selected audio source
            focusAudio.removeAttribute("src");

            //Reset the audio element
            focusAudio.load();

            //Inform the user that the music has been turned off
            musicStatus.textContent = "Music turned off.";

            //Restore the play button label.
            updateMusicButton();

            return;
          }

          //Use the selected dropdown value to find the corresponding MP3 URL.
          focusAudio.src = musicTracks[selected];

          try {

            //Start playing the selected music
            await focusAudio.play();

            //Show successful playback status
            musicStatus.textContent = "Now playing 🎶";

          //Catching errors with the playing the song
          } catch (error) {

            //Message for if playback fails, informing user that rack couldn't be played
            musicStatus.textContent = "Could not play this track. Check MP3 file.";

            //Log error in browser console
            console.warn("Music playback failed:", error);
          }

          //Update the play and pause label according to the audio state
          updateMusicButton();
        }
      );

      //Listening for whether music selection has been clicked
      //Basically when user clicks music button
      musicToggle.addEventListener("click", async () => {

          //If the dropdown is still set to "No Music", playback cannot start
          if (!musicSelect.value) {

            //Display a message asking music to be set
            musicStatus.textContent = "Please select a track first.";

            return;
          }

          //If the audio is currently paused, attempt to resume playback
          if (focusAudio.paused) {

            try {

              //Resume the selected audio
              await focusAudio.play();

              //Update status after playback begins
              musicStatus.textContent = "Now playing 🎶";

            //Catch an error with trying to play the music
            } catch (error) {

              //Display a message if playback fails
              musicStatus.textContent ="Unable to play music :(";

              //Log the error for debugging
              console.warn(error);
            }
          }

          else {

            //Pause the current music track
            focusAudio.pause();

            //Send a message informing the user that music has been paused
            musicStatus.textContent = "Music paused.";
          }

          //Reflect the updated playback state in the button label
          updateMusicButton();
        }
      );

      //Listen for how the user adjusts the volume level
      musicVolume.addEventListener("input", () => {

          //Set a volume to the audio by
          //reading a value between 0 and 100.
          //then dividing by 100 to convert it to the 0–1 range used by HTML audio.
          focusAudio.volume = Number(musicVolume.value) / 100;
        }
      );

      //Listen for errors from the audio element
      focusAudio.addEventListener("error",() => {

          //Error messgage if music file unable to be retrieved
          musicStatus.textContent ="Music file not found or supported";

          //Refresh the button label according to playback state
          updateMusicButton();
        }
      );

      //Listen for when the play button is is hit
      //When audio starts playing, update the button to show pause
      focusAudio.addEventListener("play", updateMusicButton);

      //Listen for when the pause button is hit
      //When audio pauses, update the button to show play
      focusAudio.addEventListener("pause", updateMusicButton);
    } else {

      //Inform the user that a popup is needed in order to see how much time is left
      notify("Focus started. Allow popups to see the timer.");
    }

    //Calculate and display the first countdown value immediately
    updateLockinTimer();

    //Set the lockin timer, using the updateLockinTimer to
    //consistently update the timer
    //This will start the countdown
    lockinTimer = setInterval(updateLockinTimer, 1000);
  }

  //Listen for if user clicks room is clear button
  //This will bring the user to the lockin session
  $("#confirm-room-clear")?.addEventListener("click", startLockinSession);

//WEEKLY PROGRESS REPORT-----------------------------------------------------

  //Function for finding the start of the week (Monday)
  function getWeekStart(date = new Date()) {

    //Copy the date so the original Date object is not changed
    const result = new Date(date);

    //Reset the time to midnight
    result.setHours(0, 0, 0, 0);

    //Get the weekday
    const day = result.getDay();

    //Calculate how many days have passed since Monday
    const daysSinceMonday = (day + 6) % 7;

    //Move backward to the Monday of this week
    result.setDate(result.getDate() - daysSinceMonday);

    //Return the date object representing the start of the week.
    return result;
  }

  //Find the beginning of the following Monday
  //This is the exclusive ending boundary of the report
  function getWeekEnd(weekStart) {

    //Copy the starting Monday
    const end = new Date(weekStart);

    //Move forward by seven calendar days
    end.setDate(end.getDate() + 7);

    //Set the time to midnight at the start of that Monday
    return end;
  }

  //Function for checking whether a task was completed during this reporting week
  function wasCompletedThisWeek(task, start, end) {

    //Ignore incomplete tasks and tasks without a completion timestamp
    if (!task.completed || !task.completedAt) {
      return false;
    }

    //Convert the stored timestamp to a number
    const completedAt = Number(task.completedAt);

    //Make sure the timestamp is valid and within the week's boundaries
    return Number.isFinite(completedAt) &&
      completedAt >= start.getTime() &&
      completedAt < end.getTime();
  }

  //Find tasks that were created, due, or completed this week
  function getWeeklyTasks(start, end) {

    //Convert the date boundaries to YYYY-MM-DD strings
    const startKey = dateKey(start);
    const endKey = dateKey(end);

    //Examine every task in the saved tasks array
    return tasks.filter((task) => {

      //Read the task's creation timestamp
      const createdAt = Number(task.createdAt);

      //Check whether the task was created during the week
      const createdThisWeek = Number.isFinite(createdAt) && createdAt > 0 && createdAt >= start.getTime() && createdAt < end.getTime();

      //Check whether the due date belongs to the week
      //YYYY-MM-DD strings can be compared chronologically
      const dueThisWeek = Boolean(task.dueDate) && task.dueDate >= startKey && task.dueDate < endKey;

      //Check whether the task was completed this week
      const completedThisWeek = wasCompletedThisWeek(task, start, end);

      //Include a task if any of the three conditions is true
      return createdThisWeek || dueThisWeek || completedThisWeek;
    });
  }

  //Function for formating the reporting week as a readable date range
  function formatWeeklyRange(start, endExclusive) {

    //Copy the start of next Monday
    const lastDay = new Date(endExclusive);

    //Go back one day to get Sunday
    lastDay.setDate(lastDay.getDate() - 1);

    //Format the Monday using a short month name and day
    const startText = start.toLocaleDateString(undefined,
      {
        month: "short",
        day: "numeric"
      }
    );

    //Format Sunday and include the year
    const endText = lastDay.toLocaleDateString(undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );

    //Combine the dates into one heading
    return `${startText} - ${endText}`;
  }

//WEEKLY OVERALL PROGRESS-----------------------------------------------------

  //Function for calculating overall weekly statistics and update the donut chart
  function renderWeeklyOverall(weeklyTasks, start, end) {

    //Count tasks that are currently completed
    const completed = weeklyTasks.filter((task) => 
      task.completed
    ).length;

    //Count tasks specifically completed during this week
    const completedThisWeek = weeklyTasks.filter((task) => 
      wasCompletedThisWeek(task, start, end)
    ).length;

    //Count all tracked tasks and the incomplete ones
    const total = weeklyTasks.length;
    const notStarted = total - completed;

    //Calculate the completion percentage
    //Use 0 when there are no tasks to avoid division by zero
    const percentage = total
      ? Math.round((completed / total) * 100)
      : 0;

    //Find the summary, percentage, and donut chart elements
    const summary = $("#weekly-report-summary");
    const percent = $("#weekly-report-percent");
    const donut = $("#weekly-report-donut");

    //Show how many tasks were completed this week
    //Also show how many tracked tasks are currently complete
    if (summary) {
      summary.textContent =
        `${completedThisWeek} task` +
        `${completedThisWeek === 1 ? "" : "s"} completed this week. ` +
        `${completed} of ${total} tracked tasks are currently complete.`;
    }

    //Update the numerical percentage
    if (percent) {
      percent.textContent = `${percentage}%`;
    }

    //Update the CSS variable used by the donut chart
    if (donut) {

      //Set the CSS variable to the calculated percentage
      donut.style.setProperty("--weekly-percent", percentage);

      //Describe the chart's value to screen readers
      donut.setAttribute("aria-label", `${percentage}% of weekly tasks completed`);
    }

    //Find the completed and incomplete task counters
    const completedLabel = $("#weekly-report-completed");
    const incompleteLabel = $("#weekly-report-not-started");

    //Display the number of complete tasks if HTML element exists
    if (completedLabel) {
      completedLabel.textContent = completed;
    }

    //Display the number of incomplete tasks if HTML element exists
    if (incompleteLabel) {
      incompleteLabel.textContent = notStarted;
    }

    //Return the statistics for the highlights system
    return {
      completed,
      completedThisWeek,
      total,
      percentage,
      notStarted
    };
  }

//WEEKLY PROGRESS BY CATEGORY-----------------------------------------------------

  //Function for grouping weekly tasks by subject and create progress bars
  function renderWeeklyCategories(weeklyTasks) {

    //Find the container for subject progress bars
    const container = $("#weekly-report-categories");

    //Stop if the container is missing from the page
    if (!container) return;

    //Remove the old progress bars before creating new ones
    container.replaceChildren();

    //Map stores each subject and its completion statistics
    const subjects = new Map();

    //Count the tasks belonging to each subject
    weeklyTasks.forEach((task) => {

      //Read the category
      //"Uncategorized" if missing
      const subject =String(task.category || "").trim() || "Uncategorized";

      //Create counters for a subject not yet in the map
      if (!subjects.has(subject)) {
        subjects.set(subject, {
          completed: 0,
          total: 0
        });
      }

      //Retrieve this subject's stored counters
      const data = subjects.get(subject);

      //Increase the total number of tasks
      data.total++;

      //Increase completed count only when the task is done
      if (task.completed) {
        data.completed++;
      }
    });

    //Display an empty message if there are no subjects
    if (!subjects.size) {

      //Create a paragraph element for the empty message
      const empty = document.createElement("p");

      //Styling the empty message
      empty.className = "weekly-report-empty";

      //If there's nothing, then display the message below
      empty.textContent = "No tasks were created, due, or completed this week.";

      container.appendChild(empty);
      return;
    }

    //Convert the map into an array so it can be sorted
    [...subjects.entries()]

      //Show subjects with more tasks first
      //Sort alphabetically when task counts are equal
      .sort((a, b) =>
        b[1].total - a[1].total ||
        a[0].localeCompare(b[0])
      )

      //Create a progress row for each subject
      .forEach(([subject, data]) => {

        //Calculate the subject's completion percentage
        const percentage = Math.round((data.completed / data.total) * 100);

        //Create the outer progress row
        const row = document.createElement("div");

        //Styling the progress row
        row.className = "weekly-category-row";

        //Create the subject name label
        const name = document.createElement("span");

        //Styling the subject name
        name.className = "weekly-category-name";

        //Show the subject name or "Uncategorized" if the category is missing.
        name.textContent = subject;

        //Create the background of the progress bar
        const track = document.createElement("div");

        //Styling the background of the progress bar
        track.className = "weekly-category-track";

        //Tell assistive technology this is a progress bar
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", subject);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", percentage);

        //Create the colored part of the progress bar
        const fill = document.createElement("div");

        //Styling the filled progress bar
        fill.className = "weekly-category-fill";

        //Match the filled width to the calculated percentage
        fill.style.width = `${percentage}%`;

        //Place the fill inside its background track
        track.appendChild(fill);

        //Create a count such as "3/5" for this subject
        const count = document.createElement("strong");

        //Styling the count
        count.className = "weekly-category-count";

        //Show how many tasks are complete out of the total for this subject
        count.textContent = `${data.completed}/${data.total}`;

        //Put the name, bar, and count in one row
        row.append(name, track, count);

        //Display the finished row in the report
        container.appendChild(row);
      });
  }

//WEEKLY TASK TABLE-----------------------------------------------------

  //Function for generating the table listing tasks relevant to this week
  function renderWeeklyTaskTable(weeklyTasks, start, end) {

    //Find the table body containing the task rows
    const tbody = $("#weekly-report-task-rows");

    //Stop if the table body is missing 
    if (!tbody) return;

    //Clear rows from the previous report
    tbody.replaceChildren();

    //Show a message if no tasks belong to the week
    if (!weeklyTasks.length) {

      //Create a new table row and cell for the message
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      //Make the message span all three table columns.
      cell.colSpan = 3;
      cell.className = "weekly-report-empty";
      cell.textContent = "No tasks created, due, or completed this week.";

      //Add the message to the table and stop
      row.appendChild(cell);

      //Add the row to the table body
      tbody.appendChild(row);
      return;
    }

    //Copy the task array so sorting does not modify the original
    const sorted = [...weeklyTasks].sort((a, b) => {

      //Put tasks without due dates after dated tasks
      const aDue = a.dueDate || "9999-12-31";
      const bDue = b.dueDate || "9999-12-31";

      //Sort by due date, then alphabetically by task name
      return aDue.localeCompare(bDue) || String(a.name || "").localeCompare(String(b.name || ""));
    });

    //Create a table row for each weekly task
    sorted.forEach((task) => {

      //Create a new table row for the task
      const row = document.createElement("tr");

      //Create three columns: name, status, and notes
      const nameCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const notesCell = document.createElement("td");

      //Display the task name safely using textConten
      const name = document.createElement("div");
      
      //Styling the task name 
      name.className = "weekly-task-name";

      //Show the task name or "Untitled task" if the name is missing
      name.textContent = task.name || "Untitled task";

      //Add the task name to the name column
      nameCell.appendChild(name);

      //Create a status label with a matching CSS class
      const status = document.createElement("span");

      //Add a class to the status label based on whether the task is complete or incomplete
      status.className = "weekly-status-badge " + (task.completed ? "completed" : "not-started");

      //Show whether the task is complete or incomplete
      status.textContent = task.completed
        ? "Completed"
        : "Incomplete";

      //Add the status label to the status column.
      statusCell.appendChild(status);

      //Collect optional task details in an array
      const notes = [];

      //Add its category if one is saved
      if (task.category) {
        notes.push(task.category);
      }

      //Add its formatted due date when available
      if (task.dueDate) {
        notes.push(`Due ${formatDate(task.dueDate)}`);
      }

      //Mention whether the task was finished this week
      if (wasCompletedThisWeek(task, start, end)) {
        notes.push("Finished this week.");
      }

      //Join notes with bullet separators
      //Use a dash if no notes are available
      notesCell.textContent = notes.join(" • ") || "—";

      //Insert all three columns into the table
      row.append(nameCell, statusCell, notesCell);

      //Add the finished row to the table body
      tbody.appendChild(row);
    });
  }

//WEEKLY HIGHLIGHTS AND CHALLENGES-----------------------------------------------------

  //Function for analyzing activity to generate positive highlights and challenge.
  function renderWeeklyHighlights(stats, weeklyTasks, start, end) {

    //Find the two lists used to display generated insights
    const highlights = $("#weekly-report-highlights");
    const challenges = $("#weekly-report-challenges");

    //Stop if either list is missing from the HTML
    if (!highlights || !challenges) return;

    //Remove previous messages before recalculating them
    highlights.replaceChildren();
    challenges.replaceChildren();

    //Store positive and negative insights separately
    const wins = [];
    const issues = [];

    //Get the current date and limit analysis to elapsed time
    const now = new Date();
    const cutoff = Math.min(now.getTime(), end.getTime());
    const today = dateKey(now);

    //Select tasks completed during the reporting week
    const completedThisWeek = weeklyTasks.filter((task) =>
      wasCompletedThisWeek(task, start, end)
    );

    //Count completions by day and by subject
    const completionsByDay = new Map();
    const completionsBySubject = new Map();

    //Loop through each completed task and tally completions by day and subject
    completedThisWeek.forEach((task) => {

      //Convert the completion timestamp into a calendar date
      const completedDate = new Date(Number(task.completedAt));
      const day = dateKey(completedDate);

      //Increase the number of completions for that day
      completionsByDay.set(day, (completionsByDay.get(day) || 0) + 1);

      //Use the saved category as the subject name
      const subject = String(task.category || "").trim() || "Uncategorized";

      //Increase the number of completions for that subject
      completionsBySubject.set(subject, (completionsBySubject.get(subject) || 0) + 1);
    });

    //Highlight: Highly productive day

    //Find the day with the most task completions
    const busiestDay = [...completionsByDay.entries()].sort((a, b) => b[1] - a[1])[0];

    //Highlight a day with at least three completed tasks
    if (busiestDay && busiestDay[1] >= 3) {

      //Convert the saved date into a readable weekday
      const dayName = new Date(`${busiestDay[0]}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" });

      //Add a message celebrating the busy day
      wins.push(
        `Productive ${dayName}: you completed ` +
        `${busiestDay[1]} tasks in one day.`
      );
    }

    //Highlight: High completion rate

    //If at least three tracked tasks and a completion percentage of 80% or higher,
    if (stats.total >= 3 && stats.percentage >= 80) {

      //Add a message celebrating the high completion rate
      wins.push(
        `You completed ${stats.percentage}% of ` +
        `the tasks tracked for this week.`
      );
    }

    //Highlight: All tasks for the week completed

    //If there are zero incomplete tasks for the week,
    if (stats.total > 0 && stats.notStarted === 0) {

      //Add a message celebrating all tasks being completed for the week
      wins.push(
        `All tasks tracked for this week were completed. ` +
        `Good job!`
      );
    }

    //Highlight: Consistent activity across multiple days

    //If there are three or more different days with activity
    if (completionsByDay.size >= 3) {

      //Generate a message stating how many different days had completions
      wins.push(
        `You completed tasks on ` +
        `${completionsByDay.size} different days this week.\n` +
        `"You're rather consistent!`
      );
    }

    //Highlight: Strongest subject

    //Find the subject with the most completed tasks during the week
    const strongestSubject = [...completionsBySubject.entries()].sort((a, b) => b[1] - a[1])[0];

    //Add a highlight when at least one task was completed in that subject
    if (strongestSubject && strongestSubject[1] >= 1) {

      //Generate a message stating the strong subject
      wins.push(
        `${strongestSubject[0]} was a strong subject: ` +
        `${strongestSubject[1]} tasks completed.`
      );
    }

    //Highlight: Multiple subjects completed

    //If tasks are completed in three or more subjects,
    if (completionsBySubject.size >= 3) {

      //Generate a highlight message for completing tasks in multiple subjects.
      wins.push(
        `You completed work in ` +
        `${completionsBySubject.size} different subjects.`
      );
    }

    //Highlight: Early completions

    //Find tasks completed before their due dates
    const earlyTasks = completedThisWeek.filter((task) => {

      //A task without a due date cannot be considered early
      if (!task.dueDate) return false;

      //Convert completion timestamp to a local calendar date
      const completedDay = dateKey(new Date(Number(task.completedAt)));

      //Comparing the completed day with the tasks's due date
      //This will detect whether or not task was completed earlier
      return completedDay < task.dueDate;
    });

    //If there are any early tasks,
    if (earlyTasks.length >= 1) {

      //Generate a message stating how many tasks were completed before their due dates
      wins.push(
        `${earlyTasks.length} task` +
        `${earlyTasks.length === 1 ? " was" : "s were"} ` +
        "completed before the due date."
      );
    }

    //Highlight: High task completion volume

    //If there are five or more recorded completions,
    if (completedThisWeek.length >= 5) {

      //Generate a message stating how many tasks were completed during the week
      wins.push(
        `You finished ${completedThisWeek.length}` +
        "tasks during this week."
      );
    }

    //Challenge: Overdue tasks

    //Find unfinished tasks in the report whose due dates have already passed
    const overdue = weeklyTasks.filter((task) => {

      //Return true for tasks that are incomplete and have a due date before today
      return (
        !task.completed &&
        task.dueDate &&
        task.dueDate < today
      );
    });

    //If overdue tasks were found,
    if (overdue.length) {

      //Generate a message stating how many tasks are overdue
      issues.push(
        `${overdue.length} unfinished task` +
        `${overdue.length === 1 ? " is" : "s are"} ` +
        "past the due date."
      );
    }

    //Challenge: Low completion percentage

    //If at least three tracked tasks and a completion rate below 40%,
    if (stats.total >= 3 && stats.percentage < 40) {

      //Generate a message stating the low completion percentage
      issues.push(
        `Only ${stats.percentage}% of this week's ` +
        `tracked tasks are complete.`
      );
    }

    //Challenge: Consecutive days without completions

    //Copy the report's Monday date
    const startDay = new Date(start);

    //Set the time to local midnight
    startDay.setHours(0, 0, 0, 0);

    //Convert the earlier cutoff timestamp into a date object
    const endOfObservedPeriod = new Date(cutoff);

    //Set it to local midnight
    endOfObservedPeriod.setHours(0, 0, 0, 0);

    //Longest gap found so far
    let longestGap = 0;

    //Current consecutive gap
    let currentGap = 0;

    //Start examining days from Monday
    const cursor = new Date(startDay);

    //Repeat until the cursor passes the last observed day
    while (cursor <= endOfObservedPeriod) {

      //Convert this calendar day to a YYYY-MM-DD format
      const key = dateKey(cursor);

      //Check whether any completions were recorded on this day
      if (completionsByDay.has(key)) {

        //A productive day breaks the inactivity streak
        currentGap = 0;

      } else {

        //Otherwise, track the consecutive days without completions
        //Add one day to the current streak
        currentGap++;

        //Track the longest streak observed so far
        longestGap = Math.max(longestGap, currentGap);
      }

      //Advance by one calendar day
      cursor.setDate(cursor.getDate() + 1);
    }

    //If there were three consecutive days without task completions,
    if (longestGap >= 3 && stats.total > 0) {

      //Generate a message stating how many days were inactive
      issues.push(
        `There was a stretch of ${longestGap} ` +
        "days without a recorded task completion."
      );
    }

    //Challenge: Work clustered onto one day

    //Detect whether 75% or more of the week's completions happened on a single day
    if (busiestDay && completedThisWeek.length >= 4 && busiestDay[1] / completedThisWeek.length >= 0.75) {

      //Generate a message stating how many completions happened on that day
      issues.push(
        `${busiestDay[1]} of your ` +
        `${completedThisWeek.length} completions ` +
        "happened on One day. Work was concentrated."
      );
    }

    //Challenge: Subject with most unfinished tasks

    //Track unfinished task counts by subject
    const unfinishedBySubject = new Map();

    //Find incomplete tasks in this week's report
    weeklyTasks
      .filter((task) => !task.completed)

      //Group them by category
      .forEach((task) => {

        //Get the task's subject/category
        const subject = String(task.category || "").trim() || "Uncategorized";

        //Increase the subject's unfinished count
        unfinishedBySubject.set(subject, (unfinishedBySubject.get(subject) || 0) + 1);
      });

    //Find the subject with the most unfinished tasks
    const busiestUnfinishedSubject = [...unfinishedBySubject.entries()].sort((a, b) => b[1] - a[1])[0];

    //If there is at least three unfinished tasks in a subject
    if (busiestUnfinishedSubject && busiestUnfinishedSubject[1] >= 3) {

      //Generate a message stating how many unfinished tasks are in that subject
      issues.push(
        `${busiestUnfinishedSubject[0]} has ` +
        `${busiestUnfinishedSubject[1]} ` +
        "unfinished tasks in this week's report."
      );
    }

    //Challenge: Repeated due dates changes

    //Find tasks whose due dates have been changed at least twice   
    const postponedTasks = weeklyTasks.filter((task) =>
        (Number(task.dueDateEditCount) || 0) >= 2
      );

    //If posponed tasks were found, 
    if (postponedTasks.length) {

      //Report the number of tasks that had their due dates changed multiple times
      issues.push(
        `${postponedTasks.length} task` +
        `${postponedTasks.length === 1 ? " has" : "s have"} ` +
        "had its due date changed at least twice."
      );
    }

    //If no special achievements were found, still provide a summary
    if (!wins.length) {

      wins.push(

        //If tasks were completed during the week, report how many
        completedThisWeek.length

          ? `${completedThisWeek.length} task` +
            `${completedThisWeek.length === 1 ? "" : "s"}` +
            " completed this week."

          //Otherwise, report no completions
          : "No completed tasks recorded this week."
      );
    }

    //If no challenge conditions were found, provide a neutral fallback
    if (!issues.length) {

      //Send that tasks exist, but there's no challenge to define
      //Otherwise, its insufficient activity
      issues.push(stats.total
        ? "No major challenges detected from recorded tasks."
        : "Not enough task activity to identify challenges."
      );
    }

    //Function for rendering and adding insights to the report
    function appendInsights(list, messages) {

      //Select up to five messages to display
      messages.slice(0, 5).forEach((message) => {

        //Create an HTML list item
        const item = document.createElement("li");

        //Display the generated message 
        item.textContent = message;

        //Add it to the supplied list
        list.appendChild(item);
      });
    }

    //Display positive highlights
    appendInsights(highlights, wins);

    //Display potential challenges
    appendInsights(challenges, issues);
  }

//NEXT WEEK GOALS-----------------------------------------------------

  //Function for rendering the next week's goals
  function renderWeeklyGoals(endOfCurrentWeek) {

    //Find the goals list in HTML
    const list = $("#weekly-report-goals");

    //Stop if the list is missing
    if (!list) return;

    //Remove old goal entries
    list.replaceChildren();

    //Set the current week's end as the following week's start (Monday)
    const nextWeekStart = dateKey(endOfCurrentWeek);

    //Copy the start of next week
    const nextWeekEndDate = new Date(endOfCurrentWeek);

    //Move seven calendar days forward
    //This gives the Monday after next week
    nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 7);

    //Convert it to YYYY-MM-DD
    const nextWeekEnd = dateKey(nextWeekEndDate);

    //Filter, sort, and limit the tasks
    const goals = tasks

      //Include only unfinished tasks whose deadlines fall next week
      .filter((task) => {

        //Return true if the task is incomplete and due next week
        return (
          !task.completed &&
          task.dueDate &&
          task.dueDate >= nextWeekStart &&
          task.dueDate < nextWeekEnd
        );
      })

      //Sort deadlines from earliest to latest
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

      //Keep only the first five tasks
      .slice(0, 5);

    //If there are no goals avaliable,
    if (!goals.length) {

      //Create a list item for the default suggestion
      const li = document.createElement("li");

      //Make the default goal suggestion
      li.textContent = "Plan one meaningful goal for next week.";

      //Add it to the goals list
      list.appendChild(li);
      return;
    }

    //Match each goal with a list item in the HTML
    goals.forEach((task) => {

      //Create a list item for each goal
      const li = document.createElement("li");

      //Display the task's name
      li.textContent = task.name;

      //Add it to the goals list
      list.appendChild(li);
    });
  }

//WEEKLY PROGRESS RENDERED REPORT----------------------------------------------------- 
   //Function that controls the entire weekly progress report
  function renderWeeklyReport() {

    //Find the weekly panel in the dashboard
    const panel = $("#weekly-report-panel");

    //Stop if the panel is missing
    if (!panel) return;

    //Find Monday of the current week
    const start = getWeekStart();

    //Find next Monday, the exclusive ending boundary
    const end = getWeekEnd(start);

    //Find the element that will display the date range
    const range = $("#weekly-report-range");

    //If range exists,
    if (range) {

      //Display the formatted date range in the report header
      range.textContent = formatWeeklyRange(start, end);
    }

    //Get tasks created, due, or completed during the reporting period
    const weeklyTasks = getWeeklyTasks(start, end);

    //Update the summary and donut chart
    //Save the returned statistics so highlights can use them later
    const stats = renderWeeklyOverall(weeklyTasks, start, end);

    //Generate progress bars for each subject
    renderWeeklyCategories(weeklyTasks);

    //Generate the table showing the week's relevant tasks
    renderWeeklyTaskTable(weeklyTasks, start, end);

    //Analyze task activity and display positive and negative insights
    renderWeeklyHighlights(stats, weeklyTasks, start, end);

    //Use the current week's ending boundary as the start of the following week
    renderWeeklyGoals(end);
  }


//SIDEBAR NAVIGATION-----------------------------------------------------

  //Define every page that can be opened from the sidebar
  //Each object stores a unique ID, a label, and an icon
  const pageDefinitions = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂"
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: "☑"
    },
    {
      id: "dates",
      label: "Important Dates",
      icon: "◈"
    },
    {
      id: "classes",
      label: "Classes",
      icon: "▤"
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: "▦"
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: "▣"
    },
    {
      id: "weekly-report",
      label: "Weekly Progress",
      icon: "◉"
    }
  ];

  //Find the container holding the dashboard's content
  const dashboardContent = $(".dashboard-content");

  //Find the container containing sidebar navigation links
  const sidebarNav = $(".dashboard-nav");

  //Store references to the page elements created by JavaScript
  const dashboardPages = {};

  //Remember which dashboard page is currently selected
  let currentDashboardPage = "dashboard";

  //Function for creating the dashboard pages and sidebar links
  function initializeNavigation() {

    //Stop if the main dashboard container cannot be found
    if (!dashboardContent) {
    console.warn("Could not find .dashboard-content. Navigation was not initialized.");
    return;
    }

    //Find existing HTML sections before moving them
    //Moving an element preserves its event listeners
    const sections = {
      greeting: $(".crow-section"),
      progress: $(".progress-section"),
      tasks: $(".task-section"),
      dates: $(".important-dates-section"),
      classes: $(".classes-section"),
      calendar: $(".calendar-section"),
      weeklyReport: $("#weekly-report-panel")
    };

//TASKS PAGE HEADER-----------------------------------------------------

    //Find the existing task section and its input controls
    const taskSection = sections.tasks;
    const taskInput = $("#task-input");
    const addTaskButton = $("#add-task-button");

    //Only create the header if the task section exists
    if (taskSection) {

      //Create the header that appears at the top of the Tasks page
      const taskHeader = document.createElement("div");

      //Styling the task header
      taskHeader.className = "tasks-page-header";

      //Add the tasks heading and task counter placeholder
      taskHeader.innerHTML = `
        <div class="tasks-page-heading">
          <div>
            <h2>Tasks</h2>

            <p>
              Stay organized and keep track
              of your work.
            </p>
          </div>

          <span id="tasks-page-count"></span>
        </div>
      `;

      //Create a container for the task input and add button
      const taskEntry = document.createElement("div");

      taskEntry.className = "tasks-page-entry";

      //Move the existing task input into the new header
      if (taskInput) {taskEntry.appendChild(taskInput);}

      //Move the existing add task button
      if (addTaskButton) {
        taskEntry.appendChild(addTaskButton);
      }

      //Add the input controls to the header
      taskHeader.appendChild(taskEntry);

      //Insert the new header before the existing task content
      taskSection.prepend(taskHeader);

      //Find the original task counter
      const oldHeading = $("#task-count");

      //Hide the old counter to avoid showing it twice
      if (oldHeading) {
        oldHeading.style.display = "none";
      }
    }

//CREATE DASHBOARD PAGES-----------------------------------------------------

    //Create one HTML section for each page definition
    pageDefinitions.forEach((definition) => {

      //Create a new section element
      const page = document.createElement("section");

      //Give each page a unique ID
      page.id = `crow-page-${definition.id}`;

      //Assign the common page styling class
      page.className = "dashboard-page";

      //Store the page ID in a data attribute
      page.dataset.page = definition.id;

      //Save a reference to this page by its ID
      dashboardPages[definition.id] = page;

      //Add the page container to the dashboard
      dashboardContent.appendChild(page);
    });

//DASHBOARD GREETING AND PROGRESS-----------------------------------------------------

    //Move the greeting and progress sections into the main dashboard page
    [
      sections.greeting,
      sections.progress
    ].forEach((section) => {

      //Ignore missing elements
      if (section) {
        dashboardPages.dashboard.appendChild(section);
      }
    });

//DASHBOARD UPCOMING TASKS-----------------------------------------------------

    //Create a section for the dashboard's upcoming tasks
    const upcomingSection = document.createElement("section");

    upcomingSection.id = "upcoming-tasks-section";

    upcomingSection.className = "upcoming-tasks-section";

    //Create a heading, counter, and empty task list container
    upcomingSection.innerHTML = `
      <div class="upcoming-tasks-header">
        <div>
          <h2>Upcoming Tasks</h2>

          <p>
            Your next deadlines at a glance.
          </p>
        </div>

        <span id="upcoming-tasks-count"></span>
      </div>

      <div id="upcoming-tasks-list"></div>
    `;

    //Place upcoming tasks on the main dashboard page
    dashboardPages.dashboard.appendChild(upcomingSection);

//MOVE EXISTING SECTIONS-----------------------------------------------------

    //Match each page ID to an existing HTML section
    const pageSections = {
      tasks: sections.tasks,
      dates: sections.dates,
      classes: sections.classes,
      calendar: sections.calendar,
      "weekly-report": sections.weeklyReport
    };

    //Convert an object into key and value pairs
    Object.entries(pageSections).forEach(
      ([id, section]) => {

        //Move each existing section into its page container
        if (section) {
          dashboardPages[id].appendChild(section);
        }
      }
    );

    //Allow the weekly report panel to be displayed
    //Its parent page still controls whether it is visible
    if (sections.weeklyReport) {
      sections.weeklyReport.hidden = false;
    }

//INVENTORY PAGE-----------------------------------------------------

    //Create the inventory page's HTML
    //It contains a heading, collection counter, and card grid
    dashboardPages.inventory.innerHTML = `
      <div class="inventory-page-header">
        <div>
          <h2>🎒 Inventory</h2>

          <p>
            Items purchased from the store
            will appear here.
          </p>
        </div>

        <span id="collectibles-inventory-count">
          0 / 6 collected
        </span>
      </div>

      <div
        id="collectibles-inventory-grid"
        class="collectibles-grid"
      ></div>
    `;

    //Fill the new inventory grid with the user's collectibles
    renderCollectiblesInventory();

//SIDEBAR-----------------------------------------------------

    //Only generate navigation links if the sidebar exists
    if (sidebarNav) {

      //Remove the old links before rebuilding the sidebar
      sidebarNav.replaceChildren();

      //Create one link for each dashboard page
      pageDefinitions.forEach((definition) => {

        //Create a clickable anchor element
        const link = document.createElement("a");

        //Use the page ID as the URL hash
        link.href = `#${definition.id}`;

        //Store the destination page ID on the link
        link.dataset.pageLink = definition.id;

        //Display the page icon and name
        link.innerHTML = `
          <span
            class="nav-icon"
            aria-hidden="true"
          >
            ${definition.icon}
          </span>

          <span>
            ${definition.label}
          </span>
        `;

        //Listen for clicks on this sidebar link
        //If so, navigate to the requested page without reloading the browser
        link.addEventListener("click", (event) => {

            //Prevent the browser's default anchor behavior
            event.preventDefault();

            //If this page is different from the current URL hash
            if (window.location.hash !== `#${definition.id}`) {

              //Change the hash
              //The hashchange listener will open the requested page
              window.location.hash = definition.id;

            } else {

              //Otherwise, if the hash is already correct, just open the page directly
              showDashboardPage(definition.id);
            }
          }
        );

        //Insert the finished link into the sidebar
        sidebarNav.appendChild(link);
      });
    }

    //Open the page identified by the URL hash
    //If no hash exists, open the Dashboard
    showDashboardPage(
      window.location.hash.slice(1) ||
      "dashboard"
    );
  }

  //Function that switches between dashboard pages
  function showDashboardPage(pageId) {

    //If the requested page doesn't exist, use dashboard
    if (!dashboardPages[pageId]) {
      pageId = "dashboard";
    }

    //Remember the currently selected page
    currentDashboardPage = pageId;

    //Show only the page whose ID matches pageId
    Object.entries(dashboardPages).forEach(([id, page]) => {

      //Add active class to the selected page
      //Remove it from every other page
      page.classList.toggle("active", id === pageId);
    });

    //Update the active appearance of sidebar links
    $$("[data-page-link]").forEach((link) => {

      //Check whether this link points to the active page
      const active = link.dataset.pageLink === pageId;

      //Apply the active class only to the matching link
      link.classList.toggle("active", active);

      if (active) {

        //Tell screen readers which link represents the current page
        link.setAttribute("aria-current", "page");

      } else {

        //Otherwise, remove the accessibility marker from inactive links
        link.removeAttribute("aria-current");
      }
    });

    //Refresh the calendar when its page is opened
    if (pageId === "calendar") {
      renderCalendar();
    }

    //Refresh saved classes when opening the classes page
    if (pageId === "classes") {
      renderClassesList();
    }

    //Recalculate the weekly report when opening its page
    if (pageId === "weekly-report") {
      renderWeeklyReport();
    }

    //Scroll back to the top of the page
    window.scrollTo({top: 0, behavior: "smooth"});
  }

//URL HASH NAVIGATION-----------------------------------------------------

  //Run whenever the URL fragment changes
  //This also supports browser Back and Forward navigation
  window.addEventListener("hashchange", () => {

    //Remove the "#" from the URL and open the corresponding page
    showDashboardPage(window.location.hash.slice(1) || "dashboard");
  });

//NAVIGATION AND CLASSES STYLING-----------------------------------------------------

  //Create a style element to hold additional CSS rules
  const pageStyle = document.createElement("style");

  //Use a template literal to store multiple lines of CSS
  pageStyle.textContent = `

    /* Hide inactive dashboard pages. */
    .dashboard-content > .dashboard-page {
      display: none !important;
      width: 100%;
      min-width: 0;
      grid-column: 1 / -1;
    }

    /* Show the currently selected dashboard page. */
    .dashboard-content > .dashboard-page.active {
      display: block !important;
    }

    /* Stack the main dashboard sections vertically. */
    #crow-page-dashboard.active {
      display: flex !important;
      flex-direction: column;
      gap: 20px;
    }

    /* Allow these page sections to fill their containers. */
    .dashboard-page > .task-section,
    .dashboard-page > .important-dates-section,
    .dashboard-page > .classes-section,
    .dashboard-page > .calendar-section {
      width: 100%;
      max-width: none;
      grid-column: 1 / -1;
    }

    /* Create seven equal-width columns for the calendar. */
    #crow-page-calendar #calendar-grid {
      display: grid;
      grid-template-columns:
        repeat(7, minmax(0, 1fr));
      gap: 7px;
    }

    /* Set the minimum size of calendar day cells. */
    #crow-page-calendar .calendar-day {
      min-width: 0;
      min-height: 120px;
    }

    /* Add space above the saved classes list. */
    #saved-classes-container {
      margin-top: 24px;
    }

    /* Align the Classes heading and class count. */
    .saved-classes-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    /* Stack saved class rows with spacing. */
    #saved-classes-list {
      display: grid;
      gap: 10px;
    }

    /* Style each saved class row. */
    .saved-class-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 1px solid #efc9e8;
      border-radius: 12px;
      background: #fff4fd;
      color: #913d85;
    }

    /* Stack the class name and schedule details. */
    .saved-class-info {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    /* Allow long class names to wrap. */
    .saved-class-info strong {
      overflow-wrap: anywhere;
    }

    /* Make the secondary schedule information less prominent. */
    .saved-class-info small {
      opacity: .75;
    }

    /* Style the class Delete button. */
    .saved-class-delete {
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      background: #ffe0f6;
      color: #913d85;
      cursor: pointer;
    }

    /* Change class card colors in dark mode. */
    body.dark-mode .saved-class-item {
      background: #302435;
      border-color: #70466c;
      color: #ffe6fb;
    }

    /* Change the Delete button colors in dark mode. */
    body.dark-mode .saved-class-delete {
      background: #60245e;
      color: #ffb9f8;
    }

    /* Style the empty Inventory message. */
    .inventory-empty {
      padding: 60px 20px;
      text-align: center;
      border: 1px dashed #d9e5e1;
      border-radius: 18px;
    }

    /* Make the empty Inventory icon larger. */
    .inventory-empty-icon {
      font-size: 48px;
    }

    /* Reduce calendar cell dimensions on smaller screens. */
    @media (max-width: 700px) {
      #crow-page-calendar .calendar-day {
        min-height: 70px;
        padding: 4px;
      }
    }
  `;

  //Insert the style element into the document's head
  //The browser then applies these CSS rules
  document.head.appendChild(pageStyle);

  
//MODAL CONTROLS-----------------------------------------------------

  //Find all elements with the class "modal"
  $$(".modal").forEach((modal) => {

    //Listen for a click anywhere inside the modal container
    modal.addEventListener("click", (event) => {

        //If the outer modal clicked, the user clicked the backdrop
        if (event.target === modal) {

          //Close the modal when its backdrop is clicked
          closeModal(modal);
        }
      }
    );
  });

  //Listen for keyboard input anywhere in the document
  document.addEventListener("keydown", (event) => {

      //If the user presses escapes
      if (event.key === "Escape") {

        //Find every currently visible modal
        $$(".modal.show").forEach(

          //Close each matching modal
          closeModal
        );
      }
    }
  );

//UPCOMING TASKS RENDERING-----------------------------------------------------

  //Function for displaying the earliest five unfinished tasks
  function renderUpcomingTasks() {

    //Find the upcoming tasks list and its counter
    const list = $("#upcoming-tasks-list");
    const count = $("#upcoming-tasks-count");

    //Stop if the list hasn't been created
    if (!list) return;

    //Remove old task rows before rebuilding them
    list.replaceChildren();

    //Get today's date in YYYY-MM-DD format
    const today = todayKey();

    //Select unfinished tasks that have due dates
    const upcoming = tasks.filter((task) =>
        !task.completed && task.dueDate
      )

      //Sort from the earliest deadline to the latest
      .sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
      )

      //Only display the first five tasks
      .slice(0, 5);

    //Update the number of tasks displayed
    if (count) {
      count.textContent = `${upcoming.length} shown`;
    }

    //If there are no upcoming tasks,
    if (!upcoming.length) {

      //Create a paragraph element to display the empty message
      const empty = document.createElement("p");

      //Styling for empty class
      empty.className = "upcoming-tasks-empty";

      //Display a message saying there's no upcoming tasks
      empty.textContent = "No upcoming tasks. You're all caught up! 🎉";

      //Add the empty message to the list container
      list.appendChild(empty);
      return;
    }

    //Create one preview row for every upcoming task
    upcoming.forEach((task) => {

      //Create the outer row
      const row = document.createElement("div");

      //Styling for the outer row
      row.className = "upcoming-task-item";

      //Check whether the task's deadline has passed
      const overdue = task.dueDate < today;

      //Check whether the task is due today
      const dueToday = task.dueDate === today;

      //Apply an overdue CSS class when necessary
      if (overdue) {
        row.classList.add("overdue");
      }

      //Create a container for the task name and date
      const details = document.createElement("div");


      //Styling for the task details container
      details.className = "upcoming-task-info";

      //Create a bold element for the task name
      const name = document.createElement("strong");

      //Display the task's saved name safely
      name.textContent = task.name;

      //Create a smaller element for deadline information
      const due = document.createElement("small");

      //Display a different label depending on the deadline
      //Overdue if the text content overdure, otherwise, due today, if not due today, then yet to be due
      due.textContent = overdue
        ? `Overdue · ${formatDate(task.dueDate)}`
        : dueToday
          ? "Due today"
          : `Due ${formatDate(task.dueDate)}`;

      //Put the task name and deadline together
      details.append(name, due);

      //Create a checkbox for completing the task
      const checkbox = document.createElement("input");

      //Set the checkbox's type to "checkbox"
      checkbox.type = "checkbox";

      //Styling for the checkbox
      checkbox.className = "upcoming-task-checkbox";

      //Give the checkbox a descriptive screen reader label
      checkbox.setAttribute(
        "aria-label",
        `Complete ${task.name}`
      );

      //Listen for checkbox changes
      checkbox.addEventListener("change", () => {

        //Use the normal task completion function
        //This preserves the existing reward and saving logic
        setTaskCompleted(task, checkbox.checked);
      });

      //Place the checkbox and details inside the row.
      row.append(checkbox, details);

      //Display the completed upcoming task row.
      list.appendChild(row);
    });
  }

//RENDER EVERYTHING-----------------------------------------------------

  //Function for refreshing the main interface
  function renderAll() {

    //Check for overdue tasks and apply unpaid coin penalties
    applyOverduePenalties();

    //Store the names and function references of all renderers
    //The functions are written without parentheses here
    //because they will be called inside the loop below
    const renderers = [
      ["Tasks", renderTasks],
      ["Upcoming Tasks", renderUpcomingTasks],
      ["Important Dates", renderImportantDates],
      ["Classes", renderClassesList],
      ["Dashboard Progress", renderProgress],
      ["Calendar", renderCalendar],
      ["Weekly Progress", renderWeeklyReport],
      ["Greeting", updateGreeting],
      ["Coins", updateTokens],
      ["Today's Tasks", renderTodayPanel]
    ];

    //Run each rendering function separately
    renderers.forEach(([name, render]) => {

      try {

        //Call the current rendering function
        render();

      } catch (error) {

        //Log an error if this section fails
        //The other rendering functions can still continue
        console.error(
          `${name} failed to render:`,
          error
        );
      }
    });
  }

//AUTOMATIC REFRESH-----------------------------------------------------

  //Refresh webpage every 30,000 milliseconds (30 seconds)
  //This keeps deadlines and progress information current
  setInterval(renderAll, 30000);

  //Listen for changes to the browser tab's visibility
  document.addEventListener("visibilitychange", () => {

      //If document isn't hidden then webpage is visible
      if (!document.hidden) {

        //Refresh webpage when the user returns to the tab
        renderAll();
      }
    }
  );

  //Listen for the browser window receiving focus
  //Refresh the application when it becomes active
  window.addEventListener("focus", renderAll);

//SYNCHRONIZE DATA ACROSS BROWSER TABS-----------------------------------------------------

  //The storage event fires in other same-origin tabs
  //when one tab changes a localStorage entry
  window.addEventListener("storage", (event) => {

      //If the saved tasks changed in another tab,
      if (event.key === "crowTasks") {

        //Read the updated tasks array from localStorage
        tasks = storage.get("crowTasks", []);

        //Make sure the loaded data is an array
        if (!Array.isArray(tasks)) {
          tasks = [];
        }

        //Update the website to display the latest tasks
        renderAll();
      }

      //If the saved coin balance changed,
      if (event.key === "crowTokens") {

        //Load the latest balance and convert it into a number
        tokens = Number(
          storage.get("crowTokens", 0)
        ) || 0;

        //Update the visible coin counters
        updateTokens();
      }

      //If important dates changed in another tab,
      if (event.key === "crowImportantDates") {

        //Reload the latest important dates
        importantDates = storage.get("crowImportantDates", []);

        //Use an empty array if the saved data is invalid
        if (!Array.isArray(importantDates)) {
          importantDates = [];
        }

        //Refresh the dates list and calendar
        renderAll();
      }

      //If saved classes changed in another tab,
      if (event.key === "crowClasses") {

        //Reload the latest classes array
        classes = storage.get("crowClasses", []);

        //Make sure the loaded data is an array
        if (!Array.isArray(classes)) {
          classes = [];
        }

        //Refresh the Classes page and calendar
        renderAll();
      }

      //If the theme changed in another tab,
      if (event.key === "crowTheme") {

        //Read and apply the latest light or dark theme
        applyTheme(storage.get("crowTheme", "light"));
      }
    }
  );

//INITIALIZE CROWSPACE-----------------------------------------------------

  //Show the correct weekday or one-time date inputs
  updateClassOptions();

  //Create the container where saved classes will appear
  createClassesList();

  //Build the dashboard pages and sidebar links
  initializeNavigation();

  //Perform the first full render of the website
  renderAll();

  //Check whether the user has previously opened webpage
  const hasVisitedBefore = Boolean(storage.get("crowHasVisitedBefore", false));

  //If the user has not visited before,
  if (!hasVisitedBefore) {

    //Show a welcome message for five seconds
    //This has priority
    notify("Welcome to Crow's Task Tracker! Let's get productive!", 5000, true);

    //Remember that this user has visited
    //This prevents repeating this particular welcome message
    storage.set("crowHasVisitedBefore", true);
  }

//DASHBOARD GLOBAL SEARCH-----------------------------------------------------

  //Find the dashboard search form
  const dashboardSearchForm = $("#dashboard-search-form");

  //Find the input where users type their search
  const dashboardSearchInput = $("#dashboard-search-input");

  //Find the container for autocomplete suggestions
  const dashboardSearchResults = $("#dashboard-search-results");

//SEARCHING-----------------------------------------------------
  //Function for converting searchable values into consistent text
  function normalizeSearchText(value) {

    //Return a lowercase, trimmed string for comparison
    return String(value ?? "").toLowerCase().trim();
  }

  //Function that hides the autocomplete dropdown
  function closeDashboardSearch() {

    //Stop if the results container does not exist
    if (!dashboardSearchResults) return;

    //Hide the suggestions container
    dashboardSearchResults.hidden = true;

    //Tell screen readers that the suggestions are closed
    dashboardSearchInput?.setAttribute("aria-expanded", "false");
  }

  //Function that searches tasks, important dates, and classes
  function getDashboardSearchResults(query) {

    //Normalize the user's search query
    const term = normalizeSearchText(query);

    //Return no results if the query is empty
    if (!term) return [];

    //Store all matching results in this array
    const matches = [];

    //Helper function for checking whether an entry matches
    function addMatch(type, item, title, fields) {

      //Normalize every searchable field
      const searchable = fields.map(normalizeSearchText).join(" ");

      //Skip the entry if the search term is not found
      if (!searchable.includes(term)) return;

      //Normalize the displayed title for ranking
      const normalizedTitle = normalizeSearchText(title);

      //Calculate how closely the title matches
      const rank = normalizedTitle.startsWith(term)
        ? 0
        : normalizedTitle.includes(term)
          ? 1
          : 2;

      //Save the matching entry and its rank
      matches.push({
        type,
        item,
        title,
        rank
      });
    }

    //Examine every saved task
    tasks.forEach((task) => {

      //Add the task if its name, category
      //date, or completion status matches
      addMatch("task", task, task.name || "Unnamed task",
        [
          task.name,
          task.category,
          task.dueDate,

          //Allow searching for "completed" or "incomplete"
          task.completed ? "completed" : "incomplete",

          //Also allow "done" and "pending"
          task.completed ? "done" : "pending"
        ]
      );
    });

    //Examine every saved important date
    importantDates.forEach((date) => {

      //Search its name, category, date, and type
      addMatch("date", date, date.name || "Unnamed date",
        [
          date.name,
          date.category,
          date.date,
          date.type,

          //Include readable category keywords
          date.type === "personal"
            ? "personal"
            : "school work"
        ]
      );
    });

    //Examine every saved class
    classes.forEach((classItem) => {

      //Read its schedule type
      const repeat = classItem.repeat || classItem.type || "weekly";

      //Convert a weekly class's weekday number into its name
      //One-time classes do not need a recurring weekday
      const weekday = repeat === "weekly"
        ? weekdayNames[Number(classItem.weekday)] || ""
        : "";

      //Search the class name and schedule information
      addMatch("class", classItem, classItem.name || "Unnamed class",
        [
          classItem.name,
          repeat,
          weekday,
          classItem.date
        ]
      );
    });

    //Sort by relevance rank first
    //If ranks are equal, sort alphabetically by title
    return matches.sort((a, b) =>
      a.rank - b.rank ||
      a.title.localeCompare(b.title)

    //Only return the first 12 matching results
    ).slice(0, 12);
  }

  //Function for opening the dashboard page belonging to a result
  function openSearchResultPage(page) {

    //Hide autocomplete suggestions before navigating
    closeDashboardSearch();

    //Find the sidebar link that matches the desired URL hash
    const navLink = $(`.dashboard-nav a[href="${page}"]`);

    //If navigation link exists,
    if (navLink) {

      //Click the existing sidebar link to open the page
      navLink.click();

    } else {

      //Otherwise, if the navigation link is missing,
      //change the URL hash directly
      window.location.hash = page;
    }
  }

  //Function that creates one autocomplete result card
  function createDashboardSearchCard(result) {

    //Create the outer result container
    const card = document.createElement("div");

    //Add a class identifying the result's type
    card.className = `dashboard-search-result search-type-${result.type}`;

    //Create a container for the icon and details
    const main = document.createElement("div");

    //Styling the cointainer for the icon and text information
    main.className = "dashboard-search-result-main";

    //Create an icon representing the result type
    const icon = document.createElement("span");

    //Styling for the result type icon
    icon.className = "dashboard-search-result-icon";

    //Use a different icon for tasks, dates, and classes
    icon.textContent =
      result.type === "task" ? "☑" :
      result.type === "date" ? "📆" : "📖";

    //Create the text information container
    const info = document.createElement("div");

    //Styling the text information container
    info.className = "dashboard-search-result-info";

    //Create the result title
    const title = document.createElement("strong");

    //Display the title using textContent
    //This prevents user-entered text from being treated as HTML
    title.textContent = result.title;

    //Create smaller text for additional information
    const details = document.createElement("small");

    //If the result is a task,
    if (result.type == "task") {

      //Get the original task object
      const task = result.item;

      //Display the task category, due date, and status
      details.textContent = [
        task.category,
        
        task.dueDate
          ? `Due ${formatDate(task.dueDate)}`
          : "No due date",

        task.completed ? "Completed" : "Incomplete"

      //Remove empty fields and separate details with bullets
      ].filter(Boolean).join(" • ");

      //Create a checkbox for completing the task
      const checkbox = document.createElement("input");

      //Set the checkbox's type to "checkbox"
      checkbox.type = "checkbox";

      //Styling the checkbox
      checkbox.className = "dashboard-search-checkbox";

      //Match the checkbox to the saved completion status
      checkbox.checked = Boolean(task.completed);

      //Give the checkbox an accessible description
      checkbox.setAttribute("aria-label", `Mark ${result.title} as completed`);

      //Stop clicks on the checkbox from bubbling to parent elements
      checkbox.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      //Listen for the checkbox changing its checked state
      checkbox.addEventListener("change", (event) => {

        //Prevent the change event from bubbling upward
        event.stopPropagation();

        //Use the existing task-completion system
        //This preserves coins, crow praise, and progress updates
        setTaskCompleted(task, checkbox.checked);

        //Refresh the current search suggestions
        renderDashboardSearchResults();
      });

      //Add the checkbox to the result card
      main.appendChild(checkbox);

      //Style the result differently if the task is completed
      if (task.completed) {
        card.classList.add("search-task-completed");
      }

    } else if (result.type === "date") {

      //Or its an important date
      //Get the original important date object
      const date = result.item;

      //Display its calendar date, category, and type
      details.textContent = [
        date.date
          ? formatDate(date.date)
          : "No date",

        date.category,

        date.type === "personal"
          ? "Personal"
          : "School / Work"

      ].filter(Boolean).join(" • ");

      //Display the calendar icon.
      main.appendChild(icon);

    } else {

      //Otherwise, its a class
      //Get the original class object
      const classItem = result.item;

      //Read its saved recurring or one-time schedule type
      const repeat = classItem.repeat || classItem.type || "weekly";

      //Create a readable schedule description
      const schedule = repeat === "weekly"
        ? `Every ${weekdayNames[Number(classItem.weekday)] || "week"}`
        : formatDate(classItem.date);

      //Display the schedule and class type
      details.textContent = [schedule,repeat === "weekly"
        ? "Repeating class"
        : "One-time class"

      ].join(" • ");

      //Display the class icon
      main.appendChild(icon);
    }

    //Add the result title and details to the information container
    info.append(title, details);

    //Add the information to the main result area
    main.appendChild(info);

    //Add the main content to the outer card
    card.appendChild(main);

    //Create a button for opening the relevant dashboard page
    const openButton = document.createElement("button");

    //Prevent the button from submitting a surrounding form
    openButton.type = "button";

    //Apply the CSS class and displayed label
    openButton.className = "dashboard-search-open";

    //Set the button's text to "View"
    openButton.textContent = "View";

    //Determine which page should open for this result type
    const page = result.type === "task" ? "#tasks" : result.type === "date" ? "#dates" : "#classes";

    //Listen for clicks on the View button
    openButton.addEventListener("click", () => {

      //Replace the query with the selected result's title
      dashboardSearchInput.value = result.title;

      //Close search and navigate to the matching page
      openSearchResultPage(page);
    });

    //Insert the View button into the card
    card.appendChild(openButton);

    //Return the completed element to the search renderer
    return card;
  }

//RENDER SEARCHING-----------------------------------------------------

  //Function that creates the visible autocomplete suggestions
  function renderDashboardSearchResults() {

    //Stop if the required search elements are missing
    if (!dashboardSearchInput || !dashboardSearchResults) {
      return;
    }

    //Read the user's search text
    const query = dashboardSearchInput.value.trim();

    //Clear previous suggestions
    dashboardSearchResults.replaceChildren();

    //Hide suggestions if the search field is empty
    if (!query) {
      closeDashboardSearch();
      return;
    }

    //Find matching tasks, important dates, and classes
    const results = getDashboardSearchResults(query);

    //Make the suggestions dropdown visible
    dashboardSearchResults.hidden = false;

    //Tell assistive technology that suggestions are expanded
    dashboardSearchInput.setAttribute("aria-expanded", "true");

    //Create the matching-results heading
    const heading = document.createElement("div");

    //Styling for the heading
    heading.className = "dashboard-search-heading";

    //Display the number of results
    heading.textContent = `${results.length} matching result${results.length === 1 ? "" : "s"}`;

    //Add the heading to the results container
    dashboardSearchResults.appendChild(heading);

    //If there are no matching results,
    if (results.length === 0) {

      //Create a paragraph displaying the empty-results message
      const empty = document.createElement("p");

      //Styling for the empty-results message
      empty.className = "dashboard-search-empty";

      //Include the user's query in the message
      empty.textContent = `No results found for "${query}".`;

      //Add the empty message to the results container
      dashboardSearchResults.appendChild(empty);
      return;
    }

    //Create and display a card for every matching result
    results.forEach((result) => {
      dashboardSearchResults.appendChild(createDashboardSearchCard(result));
    });
  }

  //Update autocomplete suggestions whenever the user types
  dashboardSearchInput?.addEventListener("input", renderDashboardSearchResults);

  //Listen for the user focusing on the search input
  dashboardSearchInput?.addEventListener("focus", () => {

    //If text is already entered, show the suggestions again
    if (dashboardSearchInput.value.trim()) {
      renderDashboardSearchResults();
    }
  });

  //Listen for the user submitting the search form
  //This is when enter is hit or button is clicked
  dashboardSearchForm?.addEventListener("submit", (event) => {

    //Prevent the form from reloading the webpage
    event.preventDefault();

    //Find the results for the current search query
    const results = getDashboardSearchResults(dashboardSearchInput?.value || "");

    //If there is exactly one matching result,
    if (results.length === 1) {

      //Get the only result
      const result = results[0];

      //Replace the input text with its full title
      dashboardSearchInput.value = result.title;

      //Navigate to the correct dashboard page
      openSearchResultPage(result.type === "task" ? "#tasks" : result.type === "date" ? "#dates" : "#classes");

    } else {

      //Otherwise, if there are zero or multiple matches,
      //show the autocomplete results instead
      renderDashboardSearchResults();
    }
  });

//CLOSING SEARCH-----------------------------------------------------

  //Listen for keyboard input while search is focused
  dashboardSearchInput?.addEventListener("keydown", (event) => {

    //If Escape is pressed,
    if (event.key === "Escape") {

      //Hide the autocomplete dropdown
      closeDashboardSearch();

      //Remove focus from the search input
      dashboardSearchInput.blur();
    }
  });

  //Listen for pointer presses anywhere in the document
  document.addEventListener("pointerdown", (event) => {

    //If clicked outside the search form and results container,
    if (!event.target.closest(".dashboard-search")) {
      
      //Hide the autocomplete suggestions
      closeDashboardSearch();
    }
  });
});
