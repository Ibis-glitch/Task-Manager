
"use strict";

/* =========================================
   CROW'S TASK TRACKER
   COMPLETE UPDATED SCRIPT.JS
   WITH ANIMATED CROW
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================
     HELPERS
  ========================================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn("Storage unavailable:", error);
      }
    }
  };

  const createId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()}`;

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayKey = () => dateKey(new Date());

  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
      return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return dateKey(date) === value ? date : null;
  };

  const formatDate = (value) => {
    const date = parseDate(value);

    return date
      ? date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "No date";
  };

  const show = (element) =>
    element?.classList.remove("hidden");

  const hide = (element) =>
    element?.classList.add("hidden");

  const openModal = (element) => {
    if (!element) return;
    element.classList.add("show");
    element.setAttribute("aria-hidden", "false");
  };

  const closeModal = (element) => {
    if (!element) return;
    element.classList.remove("show");
    element.setAttribute("aria-hidden", "true");
  };

  /* =========================================
     ANIMATED CROW
     BREATHING + PUPIL TRACKING + BOUNCE
  ========================================= */

  const crowCharacter = $("#crow-character");
  const crowPupil = $(".crow-pupil", crowCharacter || document);

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let crowAnimationFrame = null;
  let crowBounceInterval = null;

  function initializeAnimatedCrow() {
    if (!crowCharacter) {
      console.warn(
        "Animated crow not found. Check #crow-character in index.html."
      );
      return;
    }

    if (!crowPupil) {
      console.warn(
        "Crow pupil not found. Check .crow-pupil in index.html."
      );
      return;
    }

    /*
      All crow sprite images were cropped using
      the same original canvas boundaries.

      Original sprite canvas: 2048 × 2048
      Shared crop: x=400, y=380
      Cropped size: 1500 × 1400

      Approximate eye center in original image:
      x=1472, y=560

      These coordinates preserve the eye location
      even when the crow scales on mobile.
    */

    const SPRITE_WIDTH = 1500;
    const SPRITE_HEIGHT = 1400;

    const EYE_CENTER_X = 1472 - 400;
    const EYE_CENTER_Y = 560 - 380;

    const MAX_PUPIL_TRAVEL = 4;

    let pointerX = null;
    let pointerY = null;

    let currentX = 0;
    let currentY = 0;

    let targetX = 0;
    let targetY = 0;

    function handlePointerMove(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
    }

    function handlePointerLeave() {
      pointerX = null;
      pointerY = null;
    }

    document.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    document.addEventListener(
      "pointerout",
      (event) => {
        if (!event.relatedTarget) {
          handlePointerLeave();
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "blur",
      handlePointerLeave
    );

    function animateCrowPupil() {
      if (reducedMotionQuery.matches) {
        crowPupil.style.setProperty("--pupil-x", "0px");
        crowPupil.style.setProperty("--pupil-y", "0px");
        crowAnimationFrame = null;
        return;
      }

      const rect = crowCharacter.getBoundingClientRect();

      const eyeX =
        rect.left +
        (EYE_CENTER_X / SPRITE_WIDTH) * rect.width;

      const eyeY =
        rect.top +
        (EYE_CENTER_Y / SPRITE_HEIGHT) * rect.height;

      if (pointerX === null || pointerY === null) {
        targetX = 0;
        targetY = 0;
      } else {
        const dx = pointerX - eyeX;
        const dy = pointerY - eyeY;

        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
          const intensity = Math.min(
            1,
            distance / 150
          );

          targetX =
            (dx / distance) *
            MAX_PUPIL_TRAVEL *
            intensity;

          targetY =
            (dy / distance) *
            MAX_PUPIL_TRAVEL *
            intensity;
        } else {
          targetX = 0;
          targetY = 0;
        }
      }

      /*
        Smooth interpolation prevents the pupil
        from snapping instantly to the cursor.
      */

      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      /*
        CSS transform values are measured in
        rendered pixels, so scale movement to
        match the crow's current size.
      */

      const scale = rect.width / 250;

      crowPupil.style.setProperty(
        "--pupil-x",
        `${(currentX * scale).toFixed(2)}px`
      );

      crowPupil.style.setProperty(
        "--pupil-y",
        `${(currentY * scale).toFixed(2)}px`
      );

      crowAnimationFrame =
        requestAnimationFrame(animateCrowPupil);
    }

    function startPupilAnimation() {
      if (
        reducedMotionQuery.matches ||
        crowAnimationFrame !== null
      ) {
        return;
      }

      crowAnimationFrame =
        requestAnimationFrame(animateCrowPupil);
    }

    function stopPupilAnimation() {
      if (crowAnimationFrame !== null) {
        cancelAnimationFrame(crowAnimationFrame);
        crowAnimationFrame = null;
      }

      currentX = 0;
      currentY = 0;

      crowPupil.style.setProperty("--pupil-x", "0px");
      crowPupil.style.setProperty("--pupil-y", "0px");
    }

    function crowRandomAnimation() {
      if (
        reducedMotionQuery.matches ||
        document.hidden
      ) {
        return;
      }

      if (Math.random() >= 0.5) {
        return;
      }

      crowCharacter.classList.remove("crow-bounce");

      // Restart the CSS bounce animation.
      void crowCharacter.offsetWidth;

      crowCharacter.classList.add("crow-bounce");
    }

    crowCharacter.addEventListener(
      "animationend",
      (event) => {
        if (
          event.target === crowCharacter &&
          event.animationName === "crowIllustratedBounce"
        ) {
          crowCharacter.classList.remove("crow-bounce");
        }
      }
    );

    function updateCrowMotionPreference() {
      if (reducedMotionQuery.matches) {
        stopPupilAnimation();
        crowCharacter.classList.remove("crow-bounce");
      } else {
        startPupilAnimation();
      }
    }

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener(
        "change",
        updateCrowMotionPreference
      );
    } else {
      reducedMotionQuery.addListener(
        updateCrowMotionPreference
      );
    }

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          stopPupilAnimation();
        } else {
          startPupilAnimation();
        }
      }
    );

    crowBounceInterval = setInterval(
      crowRandomAnimation,
      5000
    );

    startPupilAnimation();
  }

  initializeAnimatedCrow();
    
  /* =========================================
    CROW SPEECH SYSTEM
  ========================================= */

  let notificationTimeout = null;
  let crowSpeechPriorityUntil = 0;

  /*
    Routine encouragement has low priority.

    Task praise, welcome-back messages, and
    important notifications can temporarily
    block routine messages.
  */

  function notify(
    message,
    duration = 3500,
    priority = false
  ) {
    const speech = $("#crow-popup-speech");

    if (!speech) {
      console.info(message);
      return;
    }

    // Don't interrupt important speech
    // with routine encouragement.
    if (
      !priority &&
      Date.now() < crowSpeechPriorityUntil
    ) {
      return;
    }

    if (priority) {
      crowSpeechPriorityUntil =
        Date.now() + duration;
    }

    speech.textContent = message;
    speech.classList.add("show");

    clearTimeout(notificationTimeout);

    notificationTimeout = setTimeout(() => {
      speech.classList.remove("show");
    }, duration);
  }

  /* =========================================
    CROW PERSONALITY SYSTEM
  ========================================= */

  const CROW_IDLE_TIME = 10 * 60 * 1000;
  const CROW_WELCOME_BACK_TIME = 4 * 60 * 60 * 1000;

  const CROW_ENCOURAGEMENT_MIN = 4 * 60 * 1000;
  const CROW_ENCOURAGEMENT_MAX = 7 * 60 * 1000;

  const CROW_LAST_VISIT_KEY = "crowLastVisit";

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

  /* =========================================
    TASK COMPLETION VIDEO
  ========================================= */

  let crowCompletionVideo = null;
  let crowCompletionTimeout = null;

  function initializeCrowCompletionVideo() {
    if (!crowCharacter) return;

    const video = document.createElement("video");

    video.className = "crow-completion-video";
    video.src = "birdAnimation.webm";

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.setAttribute("aria-hidden", "true");

    crowCharacter.appendChild(video);

    crowCompletionVideo = video;

    video.addEventListener("ended", () => {
      stopCrowCompletionAnimation();
    });

    video.addEventListener("error", () => {
      console.warn(
        "Could not load birdAnimation.webm."
      );

      stopCrowCompletionAnimation();
    });
  }

  function stopCrowCompletionAnimation() {
    clearTimeout(crowCompletionTimeout);

    crowCompletionTimeout = null;

    if (!crowCompletionVideo || !crowCharacter) {
      return;
    }

    crowCompletionVideo.pause();

    crowCharacter.classList.remove(
      "crow-celebrating"
    );
  }

  function playCrowCompletionAnimation() {
    if (!crowCharacter || !crowCompletionVideo) {
      return;
    }

    /*
      Restart the animation if another task
      is completed while it is already playing.
    */

    clearTimeout(crowCompletionTimeout);

    crowCharacter.classList.remove(
      "crow-bounce"
    );

    crowCharacter.classList.add(
      "crow-celebrating"
    );

    crowCompletionVideo.pause();
    crowCompletionVideo.currentTime = 0;

    const playback = crowCompletionVideo.play();

    if (playback?.catch) {
      playback.catch((error) => {
        console.warn(
          "Crow animation playback failed:",
          error
        );

        stopCrowCompletionAnimation();
      });
    }

    // Fallback in case the ended event doesn't fire.
    crowCompletionTimeout = setTimeout(() => {
      stopCrowCompletionAnimation();
    }, 2500);
  }

  /* =========================================
    TASK COMPLETION PRAISE
  ========================================= */

  function praiseCompletedTask() {
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

    const randomIndex = Math.floor(
      Math.random() * crowPraiseMessages.length
    );

    const phrase = crowPraiseMessages[randomIndex];

    // Play the bird animation if available.
    if (typeof playCrowCompletionAnimation === "function") {
      try {
        playCrowCompletionAnimation();
      } catch (error) {
        console.error(
          "Crow completion animation failed:",
          error
        );
      }
    }

    // Display praise without breaking task completion.
    if (typeof notify === "function") {
      notify(phrase, 4500, true);
    } else {
      const speech = document.querySelector(
        "#crow-popup-speech"
      );

      if (speech) {
        speech.textContent = phrase;
        speech.classList.add("show");
      }
    }
  }


  /* =========================================
    ACTIVITY TRACKING
  ========================================= */

  let lastCrowActivity = Date.now();
  let crowHasAskedWhereUserWent = false;
  let crowEncouragementTimer = null;

  function recordCrowActivity() {
    const wasIdle =
      Date.now() - lastCrowActivity >=
      CROW_IDLE_TIME;

    lastCrowActivity = Date.now();

    if (wasIdle) {
      crowHasAskedWhereUserWent = false;
    }
  }

  function isCrowUserInactive() {
    return (
      Date.now() - lastCrowActivity >=
      CROW_IDLE_TIME
    );
  }

  /*
    Track genuine user interaction.

    Passive pointer movement counts as activity,
    but we throttle the updates to avoid doing
    unnecessary work every frame.
  */

  let lastActivityUpdate = 0;

  function handleCrowActivity() {
    const now = Date.now();

    if (now - lastActivityUpdate < 1000) {
      return;
    }

    lastActivityUpdate = now;

    recordCrowActivity();
  }

  [
    "pointermove",
    "pointerdown",
    "keydown",
    "wheel",
    "touchstart"
  ].forEach((eventName) => {
    document.addEventListener(
      eventName,
      handleCrowActivity,
      { passive: true }
    );
  });

  /* =========================================
    INACTIVITY CHECK
  ========================================= */

  function checkCrowInactivity() {
    if (document.hidden) return;

    if (
      isCrowUserInactive() &&
      !crowHasAskedWhereUserWent
    ) {
      crowHasAskedWhereUserWent = true;

      const phrase = randomCrowPhrase(
        "idle",
        crowIdleMessages
      );

      notify(phrase, 5000, true);
    }
  }

  // Check once per minute.
  setInterval(
    checkCrowInactivity,
    60 * 1000
  );

  /* =========================================
    PERIODIC ENCOURAGEMENT
  ========================================= */

  function scheduleCrowEncouragement() {
    clearTimeout(crowEncouragementTimer);

    const delay =
      CROW_ENCOURAGEMENT_MIN +
      Math.random() *
      (
        CROW_ENCOURAGEMENT_MAX -
        CROW_ENCOURAGEMENT_MIN
      );

    crowEncouragementTimer = setTimeout(() => {
      if (
        !document.hidden &&
        !isCrowUserInactive()
      ) {
        const phrase = randomCrowPhrase(
          "encouragement",
          crowEncouragementMessages
        );

        notify(phrase, 4000, false);
      }

      scheduleCrowEncouragement();
    }, delay);
  }

  /* =========================================
    WELCOME BACK
  ========================================= */

  function checkCrowWelcomeBack() {
    const now = Date.now();

    const previousVisit = Number(
      storage.get(CROW_LAST_VISIT_KEY, 0)
    );

    /*
      Welcome back only if a previous visit
      exists and the elapsed time is at least
      four hours.
    */

    if (
      previousVisit > 0 &&
      now - previousVisit >=
        CROW_WELCOME_BACK_TIME
    ) {
      const phrase = randomCrowPhrase(
        "return",
        crowReturnMessages
      );

      // Slight delay lets the page finish loading.
      setTimeout(() => {
        notify(phrase, 5500, true);
      }, 800);
    }

    storage.set(CROW_LAST_VISIT_KEY, now);
  }

  /*
    Save the last visit periodically and when
    the user leaves or hides the page.
  */

  setInterval(() => {
    if (!document.hidden) {
      storage.set(
        CROW_LAST_VISIT_KEY,
        Date.now()
      );
    }
  }, 60 * 1000);

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        storage.set(
          CROW_LAST_VISIT_KEY,
          Date.now()
        );
      } else {
        recordCrowActivity();
      }
    }
  );

  window.addEventListener(
    "pagehide",
    () => {
      storage.set(
        CROW_LAST_VISIT_KEY,
        Date.now()
      );
    }
  );

  /* =========================================
    START CROW PERSONALITY
  ========================================= */

  initializeCrowCompletionVideo();
  checkCrowWelcomeBack();
  scheduleCrowEncouragement();



  /* =========================================
     SAVED DATA
  ========================================= */

  let tasks = storage.get("crowTasks", []);
  let importantDates = storage.get("crowImportantDates", []);
  let classes = storage.get("crowClasses", []);
  let tokens = Number(storage.get("crowTokens", 0));

  if (!Array.isArray(tasks)) tasks = [];
  if (!Array.isArray(importantDates)) importantDates = [];
  if (!Array.isArray(classes)) classes = [];
  if (!Number.isFinite(tokens)) tokens = 0;

  const saveTasks = () => storage.set("crowTasks", tasks);

  const saveImportantDates = () =>
    storage.set("crowImportantDates", importantDates);

  const saveClasses = () =>
    storage.set("crowClasses", classes);

  const saveTokens = () =>
    storage.set("crowTokens", tokens);

  /* =========================================
     LIGHT / DARK MODE
  ========================================= */

  const themeToggle = $("#theme-toggle");
  const themeIcon = $("#theme-icon");
  const themeLabel = $("#theme-label");

  function applyTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-mode", dark);

    if (themeIcon) {
      themeIcon.textContent = dark ? "☀️" : "🌙";
    }

    if (themeLabel) {
      themeLabel.textContent = dark
        ? "Light Mode"
        : "Dark Mode";
    }

    themeToggle?.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeToggle?.setAttribute("aria-pressed", String(dark));
  }

  applyTheme(storage.get("crowTheme", "light"));

  themeToggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
      ? "light"
      : "dark";

    applyTheme(nextTheme);
    storage.set("crowTheme", nextTheme);
  });

  /* =========================================
     COINS / STORE
  ========================================= */

  function updateTokens() {
    const count = $("#token-count");
    const storeCount = $("#store-token-count");

    if (count) count.textContent = tokens;
    if (storeCount) storeCount.textContent = tokens;
  }
  
  updateTokens();

  function addTokens(amount, announce = true) {
    tokens += amount;
    saveTokens();
    updateTokens();

    if (announce) {
      notify(
        `🪙 +${amount} coin${amount === 1 ? "" : "s"}!`
      );
    }
  }

  $("#store-button")?.addEventListener("click", () => {
    updateTokens();
    renderCollectiblesStore();
    openModal($("#store-modal"));
  });

  $("#close-store-modal")?.addEventListener("click", () => {
    closeModal($("#store-modal"));
  });

  //Crow collectibles store + inventory
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

  //Restore previously purchased items.
  let ownedCollectibles = storage.get(
    "crowOwnedCollectibles",
    []
  );

  if (!Array.isArray(ownedCollectibles)) {
    ownedCollectibles = [];
  }

  ownedCollectibles = [
    ...new Set(
      ownedCollectibles.filter((id) => 
        COLLECTIBLES.some((item) => item.id === id)
      )
    )
  ];

  function saveCollectibles() {
    storage.set(
      "crowOwnedCollectibles",
      ownedCollectibles
    );
  }

  //Create a collectible card without unsafe HTML
  function createCollectibleCard(item, owned, inStore) {
    const card = document.createElement("article");
    card.className = `collectible-card rarity-${item.rarity.toLowerCase()}`;
    
    //to be replaced by art later
    const emoji = document.createElement("div");
    emoji.className = "collectible-emoji";
    emoji.textContent = item.emoji;

    const rarity = document.createElement("span");
    rarity.className = "collectible-rarity";
    rarity.textContent = item.rarity;

    const name = document.createElement("h3");
    name.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    card.append(emoji, rarity, name, description);

    if (inStore) {
      const price = document.createElement("div");
      price.className = "collectible-price";
      price.textContent = `🪙 ${item.price} coins`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "collectible-buy";

      if (owned) {
        button.textContent = "✓ Owned";
        button.disabled = true;
        button.classList.add("is-owned");
      } else if (tokens < item.price) {
        button.textContent = "Not enough coins";
        button.disabled = true;
      } else {
        button.textContent = "Buy Collectible";
        button.addEventListener("click", () => {
          buyCollectible(item.id);
        });
      }

      card.append(price, button);
    } else {
      const ownedLabel = document.createElement("div");
      ownedLabel.className = "collectible-owned-label";
      ownedLabel.textContent = "✓ Collected";
      card.appendChild(ownedLabel);
    }

    return card;
  }

  //Spend coins and permanently unlock an item
  function buyCollectible(itemId) {
    const item = COLLECTIBLES.find(
      (entry) => entry.id === itemId
    );

    if (!item) return;
    
    if (ownedCollectibles.includes(item.id)) {
      notify("You alreaady own this collectible!");
      return;
    }

    if (tokens < item.price) {
      notify("Not enough coins! Complete more tasks.");
      return;
    }

    tokens -= item.price;
    ownedCollectibles.push(item.id);

    saveTokens();
    saveCollectibles();
    updateTokens();

    renderCollectiblesStore();
    renderCollectiblesInventory();

    //notification that you recieved the item
    //this is to affirm that the item has been purchase
    notify(`You collected ${item.name}!`, 4500, true);
  }

  //Build the store contents
  function renderCollectiblesStore() {
    const container = $("#collectibles-store-grid");
    if (!container) return;

    container.replaceChildren();

    COLLECTIBLES.forEach((item) => {
      container.appendChild(
        createCollectibleCard(
          item,
          ownedCollectibles.includes(item.id),
          true
        )
      );
    });
  }

  //Display only purchased collectibles
  function renderCollectiblesInventory() {
    const grid = $("#collectibles-inventory-grid");
    const count = $("#collectibles-inventory-count");

    if (!grid) return;

    const owned = COLLECTIBLES.filter(
      (item) => ownedCollectibles.includes(item.id)
    );

    if (count) {
      count.textContent = 
        `${owned.length} / ${COLLECTIBLES.length} collected`;
    }

    grid.replaceChildren();

    if (owned.length === 0) {
      const empty = document.createElement("div");
      empty.className = "inventory-empty";

      const icon = document.createElement("div");
      icon.className = "inventory-empty-icon";
      icon.textContent = "🎁";

      const heading = document.createElement("h3");
      heading.textContent = "Your inventory is empty";

      const message = document.createElement("p");
      message.textContent = 
        "Earn coins by completeting tasks, then buy collectibles from the shop."

      empty.append(icon, heading,message);
      grid.appendChild(empty);
      return;
    }

    owned.forEach((item) => {
      grid.appendChild(
        createCollectibleCard(item, true, false)
      );
    });
  }

  //initiliaze the store and inventory
  renderCollectiblesStore();
  renderCollectiblesInventory();

  /* =========================================
     GREETING / PROGRESS
  ========================================= */

  function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();

    const greeting = hour < 12
      ? "Good Morning"
      : hour < 17
        ? "Good Afternoon"
        : "Good Evening";

    const name = $("#crow-name");
    const message = $("#crow-message");
    const date = $("#date");

    if (name) name.textContent = `${greeting}!`;

    if (message) {
      const incomplete = tasks.filter(
        (task) => !task.completed
      ).length;

      message.textContent =
        `You have ${incomplete} task${incomplete === 1 ? "" : "s"} to work on.`;
    }

    if (date) {
      date.textContent = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
  }

  function renderProgress() {
    const start = getWeekStart();
    const end = getWeekEnd(start);
    const weeklyTasks = getWeeklyTasks(start, end);

    const completed = weeklyTasks.filter(
      (task) => task.completed
    ).length;

    const percentage = weeklyTasks.length
      ? Math.round((completed / weeklyTasks.length) * 100)
      : 0;

    const label = $("#progress-percent");
    const fill = $("#progress-fill");

    if (label) label.textContent = `${percentage}%`;
    if (fill) fill.style.width = `${percentage}%`;
  }

  /* =========================================
     TASKS
  ========================================= */

  //anti-cheating system for farming coins
  const FARM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  const QUICK_TASK_MS = 60 * 1000; // 60 seconds
  const TASK_BAN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const MAX_DATE_EDITS = 3;

  //keep restriction history even after refresh
  let taskSecurity = storage.get("crowTaskSecurity", {
    bannedUntil: 0,
    quickCompletions: []
  });

  if (
    !taskSecurity ||
    typeof taskSecurity != "object" ||
    !Array.isArray(taskSecurity.quickCompletions)
  ) {
    taskSecurity = {
      bannedUntil: 0,
      quickCompletions: []
    };
  }

  function saveTaskSecurity() {
    storage.set("crowTaskSecurity", taskSecurity);
  }

  function isTaskCreationBanned() {
    return Date.now() < Number(taskSecurity.bannedUntil || 0);
  }

  function getTaskBanMessage() {
    const remaining = Math.max(
      0, 
      Number(taskSecurity.bannedUntil || 0) - Date.now()
    );

    const hours = Math.ceil(remaining / 3600000);

    return `Farming coins are we?
    New task creation will be locked for ${hours} more hour(s).
    You can still complete and edit existing tasks.
    You should attempt to be productive :)`;
  }

  //Record only first, first-time completions
  function checkCoinFarming(task) {
    const now = Date.now();
    const createdAt = Number(task.createdAt);

    //Ignore older tasks without a valid creation timestamp.
    if (
      !Number.isFinite(createdAt) ||
      createdAt <= 0 ||
      createdAt > now
    ) {
      return;
    }

    //Remove completions older than five minutes.
    taskSecurity.quickCompletions =
      taskSecurity.quickCompletions.filter(
        (time) =>
          Number.isFinite(time) &&
          time <= now &&
          now - time <= FARM_WINDOW_MS
      );

    if (now - createdAt <= QUICK_TASK_MS) {
      taskSecurity.quickCompletions.push(now);
    } else {
      //Break consecutive quick-completion streak
      taskSecurity.quickCompletions = [];
    }

    if (taskSecurity.quickCompletions.length >= 3) {
      taskSecurity.bannedUntil = Math.max(
        Number(taskSecurity.bannedUntil || 0),
        now + TASK_BAN_MS
      );

      taskSecurity.quickCompletions = [];
      saveTaskSecurity();

      alert(
        "Three rapid task completions detected.\n" +
        "Task creation locked for 24 hours." 
      );

      return;
    }

    saveTaskSecurity();
  }

  let editingTaskId = null;

  const taskModal = $("#task-modal");
  const taskName = $("#modal-task-name");
  const taskCategory = $("#task-category");
  const taskDueDate = $("#task-due-date");

  function getPriority(dueDate) {
    if (!dueDate) return "low";

    const due = parseDate(dueDate);
    const today = parseDate(todayKey());

    if (!due) return "low";

    const days = Math.round((due - today) / 86400000);

    if (days <= 2) return "high";
    if (days <= 7) return "medium";
    return "low";
  }

  function isOverdue(task) {
    return Boolean(
      task.dueDate &&
      task.dueDate < todayKey() &&
      !task.completed
    );
  }

  function resetTaskModal() {
    if (taskDueDate) {
      taskDueDate.disabled = false;
      taskDueDate.title = "";
    }
    
    editingTaskId = null;

    if (taskName) taskName.value = "";
    if (taskCategory) taskCategory.value = "";
    if (taskDueDate) taskDueDate.value = "";

    const button = $("#confirm-task-button");
    if (button) button.textContent = "Add Task";
  }

  function openTaskEditor(task = null) {
    //Blocking new tasks, but allow task edits
    if (!task && isTaskCreationBanned()) {
      alert(getTaskBanMessage());
      return;
    }
    
    resetTaskModal();

    if (task) {
      editingTaskId = task.id;

      if (taskName) taskName.value = task.name;
      if (taskCategory) {
        taskCategory.value = task.category || "";
      }
      if (taskDueDate) {
        taskDueDate.value = task.dueDate || "";

        const editCount = Number(task.dueDateEditCount) || 0;

        taskDueDate.disabled = editCount >= MAX_DATE_EDITS;

        taskDueDate.title = taskDueDate.disabled
          ? "Due date permanently locked after 3 changes"
          : `${MAX_DATE_EDITS - editCount} date changes remaining`;
      }

      const button = $("#confirm-task-button");
      if (button) button.textContent = "Save Changes";
    } else if (taskName) {
      taskName.value =
        $("#task-input")?.value.trim() || "";
    }

    openModal(taskModal);
    taskName?.focus();
  }

  function setTaskCompleted(task, completed) {
    // Ignore duplicate completion events.
    if (Boolean(task.completed) === Boolean(completed)) {
      return;
    }

    task.completed = completed;

    if (completed) {
      task.completedAt = Date.now()
        
      //Award one coin only the first time
      //the task is completed.
      if (!task.coinAwarded) {
        task.coinAwarded = true;

        //Don't replace praise with coin speech.
        addTokens(1, false);

        //Checking for coin farming after completion of task
        checkCoinFarming(task);
      } 

      /*
        Always play the animation and praise
        when a task changes to completed.

        This also works if a previously completed
        task was unchecked and checked again.
      */

      praiseCompletedTask();
    } else {
      //An unchecked task is no longer completed
      task.completedAt = null;
    }

    //Save completion immediately
    saveTasks();

    renderTasks();
    renderProgress();
    updateGreeting();
    renderCalendar();
    renderTodayPanel();

    try {
      renderWeeklyReport();
    } catch (error) {
      console.error("Weekly report update failed:", error);
    }
  }


  $("#add-task-button")?.addEventListener("click", () => {
    openTaskEditor();
  });

  $("#task-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      openTaskEditor();
    }
  });

  $("#close-task-modal")?.addEventListener("click", () => {
    closeModal(taskModal);
  });

  $("#confirm-task-button")?.addEventListener("click", () => {
    if (!editingTaskId && isTaskCreationBanned()) {
      alert(getTaskBanMessage());
      return;
    }
    
    const name = taskName?.value.trim();

    if (!name) {
      alert("Please enter a task name.");
      return;
    }

    const data = {
      name,
      category: taskCategory?.value.trim() || "",
      dueDate: taskDueDate?.value || ""
    };

    if (editingTaskId) {
      const task = tasks.find(
        (item) => item.id === editingTaskId
      );

      if (!task) return;

      const oldDate = task.dueDate || "";
      const newDate = data.dueDate || "";

      const dateChanged = oldDate !== newDate;
      const editCount = Number(task.dueDateEditCount) || 0;

      //rejecting fourth date change
      if (dateChanged && editCount >= MAX_DATE_EDITS) {
        alert(
          "This task's due date is permanently locked.\n" +
          "You cannot change the due date after changing it three times.\n" +
          "Please adhere to deadlines."
        );

        if (taskDueDate) {
          taskDueDate.value = oldDate;
        }

        return;
      }
      
      if (dateChanged) {
        task.dueDateEditCount = editCount + 1;
      }

      Object.assign(task, data);

      if (dateChanged && task.dueDateEditCount === MAX_DATE_EDITS) {
        alert(
          "You have already used up all three date changes.\n" +
          "Task's due date is now permanently locked. \n" +
          "And you can no longer delete this task."
        );
      }

      notify("Task updated!");

    } else {
      tasks.push({
        id: createId(),
        ...data,
        completed: false,
        coinAwarded: false,
        createdAt: Date.now()
      });

      notify("Task added!");
    }

    saveTasks();
    closeModal(taskModal);
    resetTaskModal();

    const input = $("#task-input");
    if (input) input.value = "";

    renderAll();
  });

  function renderTasks() {
    const list = $("#task-list");
    const count = $("#task-count");
    const pageCount = $("#tasks-page-count");
    const empty = $("#empty-task-message");

    if (pageCount) {
      pageCount.textContent =
        `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    }

    if (!list) return;

    list.replaceChildren();

    if (count) {
      count.textContent =
        `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    }

    empty?.classList.toggle("show", tasks.length === 0);

    const sorted = [...tasks].sort((a, b) =>
      Number(Boolean(a.completed)) -
        Number(Boolean(b.completed)) ||
      String(a.dueDate || "9999").localeCompare(
        String(b.dueDate || "9999")
      )
    );

    sorted.forEach((task) => {
      const priority = getPriority(task.dueDate);
      const item = document.createElement("li");

      item.className = `task priority-${priority}`;

      if (task.completed) item.classList.add("completed");
      if (isOverdue(task)) item.classList.add("overdue");

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

      $(".task-checkbox", item).addEventListener(
        "change",
        (event) => {
          setTaskCompleted(task, event.target.checked);
        }
      );

      $(".edit-button", item).addEventListener(
        "click",
        () => {
          openTaskEditor(task);
        }
      );

      $(".delete-button", item).addEventListener(
        "click",
        () => {

          const dateChanges = 
            Number(task.dueDateEditCount) || 0;

          //Permanent deletion lock  
          if (dateChanges >= MAX_DATE_EDITS) {
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

          tasks = tasks.filter(
            (entry) => entry.id !== task.id
          );

          saveTasks();
          renderAll();
        }
      );

      //Visually indicate pemanently locked deletion
      if (
        (Number(task.dueDateEditCount) || 0) >= MAX_DATE_EDITS
      ) {
        const deleteButton = $(".delete-button", item);

        if (deleteButton) {
          deleteButton.classList.add("deletion-locked");

          deleteButton.title = 
            "Deletion permanently locked after 3 due-date changes";
          
          deleteButton.setAttribute(
            "aria-label",
            "Task deletion permanently locked"
          );
        }
      }

      list.appendChild(item);
    });
  }

  /* =========================================
     IMPORTANT DATES
  ========================================= */

  let editingDateId = null;
  const dateModal = $("#important-date-modal");

  function resetDateModal() {
    editingDateId = null;

    const name = $("#modal-important-date-name");
    const category = $("#important-date-category");
    const date = $("#important-date-date");
    const button = $("#confirm-important-date-button");

    if (name) name.value = "";
    if (category) category.value = "";
    if (date) date.value = "";

    const defaultRadio = $(
      'input[name="important-date-type"][value="school-work"]'
    );

    if (defaultRadio) defaultRadio.checked = true;
    if (button) button.textContent = "Add Important Date";
  }

  function openDateEditor(item = null) {
    resetDateModal();

    if (item) {
      editingDateId = item.id;

      const name = $("#modal-important-date-name");
      const category = $("#important-date-category");
      const date = $("#important-date-date");

      if (name) name.value = item.name;
      if (category) category.value = item.category || "";
      if (date) date.value = item.date || "";

      const radio = $$(
        'input[name="important-date-type"]'
      ).find((input) => input.value === item.type);

      if (radio) radio.checked = true;

      const button = $("#confirm-important-date-button");

      if (button) button.textContent = "Save Changes";
    } else {
      const name = $("#modal-important-date-name");

      if (name) {
        name.value =
          $("#important-date-input")?.value.trim() || "";
      }
    }

    openModal(dateModal);
  }

  $("#add-important-date-button")?.addEventListener(
    "click",
    () => {
      openDateEditor();
    }
  );

  $("#important-date-input")?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        openDateEditor();
      }
    }
  );

  $("#close-important-date-modal")?.addEventListener(
    "click",
    () => {
      closeModal(dateModal);
    }
  );

  $("#confirm-important-date-button")?.addEventListener(
    "click",
    () => {
      const name =
        $("#modal-important-date-name")?.value.trim();

      const date =
        $("#important-date-date")?.value;

      if (!name || !date) {
        alert("Enter a name and date.");
        return;
      }

      const data = {
        name,
        date,
        category:
          $("#important-date-category")?.value.trim() || "",
        type:
          $('input[name="important-date-type"]:checked')
            ?.value || "school-work"
      };

      if (editingDateId) {
        const item = importantDates.find(
          (entry) => entry.id === editingDateId
        );

        if (item) Object.assign(item, data);
      } else {
        importantDates.push({
          id: createId(),
          ...data
        });
      }

      saveImportantDates();
      closeModal(dateModal);
      resetDateModal();

      const input = $("#important-date-input");
      if (input) input.value = "";

      renderAll();
      notify("Important date saved!");
    }
  );

  function renderImportantDates() {
    const list = $("#important-date-list");
    const count = $("#important-date-count");
    const empty = $("#empty-important-date-message");

    if (!list) return;

    list.replaceChildren();

    if (count) {
      count.textContent =
        `${importantDates.length} date${importantDates.length === 1 ? "" : "s"}`;
    }

    empty?.classList.toggle(
      "show",
      importantDates.length === 0
    );

    [...importantDates]
      .sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      )
      .forEach((item) => {
        const element = document.createElement("li");

        element.className =
          `important-date-item ${item.type || "school-work"}`;

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

        $(".important-date-edit", element).addEventListener(
          "click",
          () => openDateEditor(item)
        );

        $(".important-date-delete", element).addEventListener(
          "click",
          () => {
            importantDates = importantDates.filter(
              (entry) => entry.id !== item.id
            );

            saveImportantDates();
            renderAll();
          }
        );

        list.appendChild(element);
      });
  }

  /* =========================================
     CLASSES
  ========================================= */

  const classModal = $("#class-modal");
  const className = $("#modal-class-name");

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  function updateClassOptions() {
    const repeat =
      $('input[name="class-repeat"]:checked')?.value;

    if (repeat === "once") {
      hide($("#weekly-class-options"));
      show($("#one-time-class-options"));
    } else {
      show($("#weekly-class-options"));
      hide($("#one-time-class-options"));
    }
  }

  $$('input[name="class-repeat"]').forEach((radio) => {
    radio.addEventListener(
      "change",
      updateClassOptions
    );
  });

  $("#add-class-button")?.addEventListener("click", () => {
    if (className) {
      className.value =
        $("#class-input")?.value.trim() || "";
    }

    const weekly = $(
      'input[name="class-repeat"][value="weekly"]'
    );

    if (weekly) weekly.checked = true;

    updateClassOptions();
    openModal(classModal);
  });

  $("#class-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      $("#add-class-button")?.click();
    }
  });

  $("#close-class-modal")?.addEventListener("click", () => {
    closeModal(classModal);
  });

  $("#confirm-class-button")?.addEventListener(
    "click",
    () => {
      const name = className?.value.trim();

      const repeat =
        $('input[name="class-repeat"]:checked')?.value ||
        "weekly";

      if (!name) {
        alert("Please enter a class name.");
        return;
      }

      const entry = {
        id: createId(),
        name,
        repeat
      };

      if (repeat === "weekly") {
        entry.weekday = Number(
          $("#class-weekday")?.value || 0
        );
      } else {
        entry.date = $("#class-date")?.value || "";

        if (!entry.date) {
          alert("Choose a date for this class.");
          return;
        }
      }

      classes.push(entry);
      saveClasses();

      closeModal(classModal);

      if (className) className.value = "";

      const input = $("#class-input");
      const dateInput = $("#class-date");

      if (input) input.value = "";
      if (dateInput) dateInput.value = "";

      renderAll();
      notify("Class added!");
    }
  );

  /* =========================================
     VISIBLE CLASSES LIST
  ========================================= */

  function createClassesList() {
    const section = $(".classes-section");

    if (!section || $("#saved-classes-container")) {
      return;
    }

    const container = document.createElement("div");
    container.id = "saved-classes-container";

    container.innerHTML = `
      <div class="saved-classes-heading">
        <h3>Your Classes</h3>
        <span id="saved-classes-count">0</span>
      </div>

      <div id="saved-classes-list"></div>
    `;

    section.appendChild(container);
  }

  function renderClassesList() {
    const list = $("#saved-classes-list");
    const count = $("#saved-classes-count");

    if (!list) return;

    list.replaceChildren();

    if (count) {
      count.textContent = String(classes.length);
    }

    if (!classes.length) {
      const empty = document.createElement("p");
      empty.className = "saved-classes-empty";
      empty.textContent = "No classes added yet.";

      list.appendChild(empty);
      return;
    }

    classes.forEach((item) => {
      const repeat =
        item.repeat || item.type || "weekly";

      const schedule = repeat === "weekly"
        ? `Every ${weekdayNames[Number(item.weekday)] || "week"}`
        : formatDate(item.date);

      const row = document.createElement("div");
      row.className = "saved-class-item";

      const info = document.createElement("div");
      info.className = "saved-class-info";

      const name = document.createElement("strong");
      name.textContent =
        item.name || "Unnamed class";

      const details = document.createElement("small");
      details.textContent = schedule;

      info.append(name, details);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "saved-class-delete";
      remove.textContent = "✕";
      remove.title = "Delete class";

      remove.setAttribute(
        "aria-label",
        `Delete ${item.name || "class"}`
      );

      remove.addEventListener("click", () => {
        classes = classes.filter(
          (entry) => entry.id !== item.id
        );

        saveClasses();
        renderAll();
        notify("Class deleted.");
      });

      row.append(info, remove);
      list.appendChild(row);
    });
  }

  /* =========================================
     CALENDAR
  ========================================= */

  const initialDate = new Date();

  let displayedYear = initialDate.getFullYear();
  let displayedMonth = initialDate.getMonth();

  function getClassesForDate(date) {
    return classes.filter((item) => {
      const repeat = item.repeat || item.type;

      if (repeat === "weekly") {
        return Number(item.weekday) === date.getDay();
      }

      return item.date === dateKey(date);
    });
  }

  function renderCalendar() {
    const grid = $("#calendar-grid");
    const heading = $("#calendar-month");

    if (!grid || !heading) return;

    const first = new Date(
      displayedYear,
      displayedMonth,
      1
    );

    const daysInMonth = new Date(
      displayedYear,
      displayedMonth + 1,
      0
    ).getDate();

    heading.textContent =
      first.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      });

    grid.replaceChildren();

    for (
      let index = 0;
      index < first.getDay();
      index++
    ) {
      const blank = document.createElement("div");
      blank.className = "calendar-day empty";
      grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        displayedYear,
        displayedMonth,
        day
      );

      const key = dateKey(date);
      const cell = document.createElement("div");

      cell.className = "calendar-day";

      if (key === todayKey()) {
        cell.classList.add("today");
      }

      const number = document.createElement("div");
      number.className = "calendar-date-number";
      number.textContent = String(day);

      cell.appendChild(number);

      // Tasks
      tasks
        .filter((task) => task.dueDate === key)
        .forEach((task) => {
          const element = document.createElement("span");

          element.className =
            `calendar-task ${getPriority(task.dueDate)}`;

          if (task.completed) {
            element.classList.add("completed");
          }

          element.textContent = task.name;
          element.title = task.name;

          cell.appendChild(element);
        });

      // Important Dates
      importantDates
        .filter((item) => item.date === key)
        .forEach((item) => {
          const element = document.createElement("span");

          element.className =
            `calendar-important-date ${item.type || "school-work"}`;

          element.textContent = item.name;
          element.title = item.name;

          cell.appendChild(element);
        });

      // Classes
      getClassesForDate(date).forEach((item) => {
        const element = document.createElement("span");

        const repeat = item.repeat || item.type;

        element.className =
          `calendar-class ${repeat === "weekly"
            ? "weekly"
            : "one-time"}`;

        element.textContent = item.name;
        element.title = item.name;

        cell.appendChild(element);
      });

      grid.appendChild(cell);
    }
  }

  $("#previous-month")?.addEventListener("click", () => {
    displayedMonth--;

    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear--;
    }

    renderCalendar();
  });

  $("#next-month")?.addEventListener("click", () => {
    displayedMonth++;

    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear++;
    }

    renderCalendar();
  });

  /* =========================================
     AUTOMATIC OVERDUE PENALTIES
     -1 COIN PER TASK PER OVERDUE DAY
  ========================================= */

  const MS_PER_DAY = 86400000;

  function dayNumber(value) {
    const date = parseDate(value);

    if (!date) return null;

    return Math.floor(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ) / MS_PER_DAY
    );
  }

  function applyOverduePenalties() {
    const today = todayKey();
    const todayNumber = dayNumber(today);

    let totalPenalty = 0;
    let changed = false;

    tasks.forEach((task) => {
      if (task.completed || !task.dueDate) return;
      if (task.dueDate >= today) return;

      const dueNumber = dayNumber(task.dueDate);

      if (dueNumber === null) return;

      const createdDate = task.createdAt
        ? dateKey(new Date(task.createdAt))
        : task.dueDate;

      const createdNumber = dayNumber(createdDate);

      const lastPenaltyNumber = task.lastPenaltyDate
        ? dayNumber(task.lastPenaltyDate)
        : Math.max(
            dueNumber,
            createdNumber ?? dueNumber
          );

      if (lastPenaltyNumber === null) return;

      const daysToCharge = Math.max(
        0,
        todayNumber - lastPenaltyNumber
      );

      if (daysToCharge > 0) {
        totalPenalty += daysToCharge;
        task.lastPenaltyDate = today;
        changed = true;
      }
    });

    if (changed) {
      tokens -= totalPenalty;

      saveTasks();
      saveTokens();
      updateTokens();

      notify(
        `Overdue penalty: -${totalPenalty} coin${totalPenalty === 1 ? "" : "s"}`
      );
    }
  }

  /* =========================================
     TODAY'S TASKS
     FLOATING / PICTURE-IN-PICTURE WINDOW
  ========================================= */

  let todayTasksWindow = null;
  let todayTasksFallback = null;

  function getTodayTasks() {
    const today = todayKey();

    return tasks
      .filter((task) =>
        task.dueDate &&
        (
          task.dueDate === today ||
          (
            task.dueDate < today &&
            !task.completed
          )
        )
      )
      .sort((a, b) =>
        Number(Boolean(a.completed)) -
          Number(Boolean(b.completed)) ||
        a.dueDate.localeCompare(b.dueDate)
      );
  }

  function renderTodayTasksContent(doc) {
    const list =
      doc.getElementById("floating-tasks-list");

    if (!list) return;

    list.replaceChildren();

    const relevant = getTodayTasks();

    if (!relevant.length) {
      const empty = doc.createElement("p");
      empty.className = "floating-empty";
      empty.textContent =
        "No tasks due today or overdue. 🎉";

      list.appendChild(empty);
      return;
    }

    relevant.forEach((task) => {
      const overdue =
        task.dueDate < todayKey();

      const row = doc.createElement("label");
      row.className = "floating-task";

      if (overdue) {
        row.classList.add("overdue");
      }

      if (task.completed) {
        row.classList.add("completed");
      }

      const checkbox = doc.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(task.completed);

      const details = doc.createElement("div");
      details.className = "floating-task-details";

      const name = doc.createElement("strong");
      name.textContent = task.name;

      const due = doc.createElement("small");

      due.textContent = overdue
        ? `⚠ Overdue · ${formatDate(task.dueDate)}`
        : `Due today · ${formatDate(task.dueDate)}`;

      details.append(name, due);
      row.append(checkbox, details);

      checkbox.addEventListener("change", () => {
        const current = tasks.find(
          (item) => item.id === task.id
        );

        if (!current) return;

        setTaskCompleted(
          current,
          checkbox.checked
        );
      });

      list.appendChild(row);
    });
  }

  function createFloatingTasksLayout(doc) {
    doc.head.replaceChildren();

    const meta = doc.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, initial-scale=1";

    const style = doc.createElement("style");

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

    doc.head.append(meta, style);

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

    doc.getElementById("floating-close")
      ?.addEventListener("click", () => {
        if (
          todayTasksWindow &&
          !todayTasksWindow.closed
        ) {
          todayTasksWindow.close();
          todayTasksWindow = null;
        } else if (todayTasksFallback) {
          todayTasksFallback.remove();
          todayTasksFallback = null;
        }
      });

    renderTodayTasksContent(doc);
  }

  function openFallbackTasksPanel() {
    const panel = document.createElement("div");
    panel.id = "today-tasks-fallback";

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

    const frame = document.createElement("iframe");
    frame.title = "Today's Tasks";

    frame.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 16px;
    `;

    panel.appendChild(frame);
    document.body.appendChild(panel);

    todayTasksFallback = panel;

    const doc = frame.contentDocument;

    if (!doc) return;

    createFloatingTasksLayout(doc);

    const header = $(".floating-header", doc);

    if (!header) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originalLeft = 0;
    let originalTop = 0;

    header.style.cursor = "move";

    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      dragging = true;

      const rect = panel.getBoundingClientRect();

      originalLeft = rect.left;
      originalTop = rect.top;
      startX = event.screenX;
      startY = event.screenY;

      header.setPointerCapture(event.pointerId);
    });

    header.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      const left =
        originalLeft + event.screenX - startX;

      const top =
        originalTop + event.screenY - startY;

      panel.style.right = "auto";
      panel.style.bottom = "auto";

      panel.style.left =
        `${Math.max(0, left)}px`;

      panel.style.top =
        `${Math.max(0, top)}px`;
    });

    header.addEventListener("pointerup", () => {
      dragging = false;
    });

    header.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  async function toggleTodayTasksWindow() {
    if (
      todayTasksWindow &&
      !todayTasksWindow.closed
    ) {
      todayTasksWindow.close();
      todayTasksWindow = null;
      return;
    }

    if (todayTasksFallback) {
      todayTasksFallback.remove();
      todayTasksFallback = null;
      return;
    }

    if (
      "documentPictureInPicture" in window &&
      window.isSecureContext
    ) {
      try {
        const pipWindow =
          await window.documentPictureInPicture.requestWindow({
            width: 340,
            height: 500
          });

        todayTasksWindow = pipWindow;

        createFloatingTasksLayout(
          pipWindow.document
        );

        pipWindow.addEventListener(
          "pagehide",
          () => {
            if (todayTasksWindow === pipWindow) {
              todayTasksWindow = null;
            }
          },
          { once: true }
        );

        return;
      } catch (error) {
        console.warn(
          "Picture-in-Picture unavailable:",
          error
        );
      }
    }

    openFallbackTasksPanel();
  }

  function renderTodayPanel() {
    if (
      todayTasksWindow &&
      !todayTasksWindow.closed
    ) {
      renderTodayTasksContent(
        todayTasksWindow.document
      );
    }

    if (todayTasksFallback) {
      const frame = $(
        "iframe",
        todayTasksFallback
      );

      if (frame?.contentDocument) {
        renderTodayTasksContent(
          frame.contentDocument
        );
      }
    }
  }

  $("#daily-tasks-button")?.addEventListener(
    "click",
    toggleTodayTasksWindow
  );

  /* =========================================
     LOCK-IN SESSION
  ========================================= */

  const lockinModal = $("#lockin-modal");
  const timeOptions = $("#lockin-time-options");
  const customSection = $("#custom-time-section");
  const roomClearSection = $("#room-clear-section");
  const lockinDescription = $("#lockin-description");

  let selectedLockinMinutes = null;
  let lockinTimer = null;
  let lockinEndTime = null;
  let lockinWindow = null;

  function resetLockinModal() {
    selectedLockinMinutes = null;

    show(timeOptions);
    hide(customSection);
    hide(roomClearSection);

    if (lockinDescription) {
      lockinDescription.textContent =
        "How long are we locking in?";
    }

    const customInput = $("#custom-time-input");

    if (customInput) {
      customInput.value = "";
    }
  }

  $("#lockin-button")?.addEventListener("click", () => {
    resetLockinModal();
    openModal(lockinModal);
  });

  $("#close-lockin-modal")?.addEventListener(
    "click",
    () => {
      closeModal(lockinModal);
      resetLockinModal();
    }
  );

  $("#custom-time-button")?.addEventListener(
    "click",
    () => {
      hide(timeOptions);
      show(customSection);

      if (lockinDescription) {
        lockinDescription.textContent =
          "Choose your focus duration.";
      }

      $("#custom-time-input")?.focus();
    }
  );

  function showRoomConfirmation() {
    if (
      !Number.isInteger(selectedLockinMinutes) ||
      selectedLockinMinutes < 1 ||
      selectedLockinMinutes > 720
    ) {
      alert("Choose between 1 and 720 minutes.");
      return;
    }

    hide(timeOptions);
    hide(customSection);
    show(roomClearSection);

    if (lockinDescription) {
      lockinDescription.textContent =
        `${selectedLockinMinutes}-minute focus session`;
    }

    $("#confirm-room-clear")?.focus();
  }

  $$(".lockin-time").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLockinMinutes =
        Number(button.dataset.minutes);

      showRoomConfirmation();
    });
  });

  $("#start-custom-time")?.addEventListener(
    "click",
    () => {
      selectedLockinMinutes =
        Number($("#custom-time-input")?.value);

      showRoomConfirmation();
    }
  );

  function formatRemaining(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(remainingSeconds).padStart(2, "0")}`
    );
  }

  function finishLockin() {
    clearInterval(lockinTimer);

    lockinTimer = null;
    lockinEndTime = null;

    addTokens(25);
    notify("Lock-in complete! Great work.");

    if (
      lockinWindow &&
      !lockinWindow.closed
    ) {
      const doc = lockinWindow.document;

      //Stopping lock-in music
      const focusAudio = doc.querySelector("audio");

      if (focusAudio) {
        focusAudio.pause();
        focusAudio.removeAttribute("src");
        focusAudio.load();
      }

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

      doc.getElementById("close-focus-window")
        ?.addEventListener(
          "click",
          () => lockinWindow.close()
        );
    }
  }

  function updateLockinTimer() {
    if (!lockinEndTime) return;

    const seconds = Math.max(
      0,
      Math.ceil(
        (lockinEndTime - Date.now()) / 1000
      )
    );

    const time = formatRemaining(seconds);

    if (
      lockinWindow &&
      !lockinWindow.closed
    ) {
      const display =
        lockinWindow.document.getElementById(
          "focus-countdown"
        );

      if (display) {
        display.textContent = time;
      }

      lockinWindow.document.title =
        `${time} — Lock-in`;
    }

    if (seconds <= 0) {
      finishLockin();
    }
  }

  function startLockinSession() {
    if (
      !Number.isInteger(selectedLockinMinutes) ||
      selectedLockinMinutes < 1
    ) {
      return;
    }

    if (lockinTimer) {
      alert(
        "A Lock-in session is already running."
      );
      return;
    }

    const minutes = selectedLockinMinutes;

    closeModal(lockinModal);
    resetLockinModal();

    lockinEndTime =
      Date.now() + minutes * 60000;

    lockinWindow = window.open(
      "",
      "crow-lockin",
      "width=520,height=620"
    );

    if (
      lockinWindow &&
      !lockinWindow.closed
    ) {
      const doc = lockinWindow.document;

      doc.open();

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
            * {
              box-sizing: border-box;
            }

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

            .focus-card {
              width: 100%;
              padding: 45px 25px;
              background: white;
              border-radius: 24px;
              text-align: center;

              box-shadow:
                0 20px 60px rgba(0,0,0,.1);
            }

            h1 {
              font-size: 25px;
            }

            #focus-countdown {
              margin: 35px 0;
              color: #198f86;
              font-size: 65px;
              font-weight: 800;
            }

            p {
              color: #72848b;
              line-height: 1.7;
            }       
                        
            .lockin-music-player {
              margin: 25px 0 10px;
              padding: 20px;
              background: #f0faf6;
              border: 1px solid #cde8dd;
              border-radius: 16px;
              text-align: left;
            }

            .lockin-music-player h2 {
              margin: 0 0 15px;
              font-size: 17px;
              color: #198f86;
            }

            #lockin-music-select {
              width: 100%;
              padding: 11px;
              border: 1px solid #cbded8;
              border-radius: 9px;
              background: white;
              color: #1d303b;
              font-size: 14px;
            }

            .lockin-music-controls {
              display: flex; 
              align-items: center;
              flex-wrap: wrap;
              gap: 12px;
              margin-top: 16px;
            }

            #lockin-music-toggle {
              padding: 10px 18px;
              border: none;
              border-radius: 9px;
              background: #198f86;
              color: white;
              font-weight: 700;
              cursor: pointer;
            }

            #lockin-music-volume {
              flex: 1;
              min-width: 90px;
              accent-color: #198f86;
            }

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

            <div id="focus-countdown">
              ${formatRemaining(minutes * 60)}
            </div>

            <div class="lockin-music-player">
              <h2> Study Music </h2>
              
              <select id="lockin-music-select">
                <option value="">No Music</option>
                <option value="lofi">☕ Lofi Beats</option>
                <option value="softjazz">🎵 Soft Jazz</option>
                <option value="ambient">⛰️ Mountain Ambience</option>
              </select>
              
              <div class="lockin-music-controls">
                <button
                  id="lockin-music-toggle"
                  type="button"
                >
                  ▶ Play
                </button> 
              
                <label for="lockin-music-volume">
                  Volume
                </label>

                <input
                  id="lockin-music-volume"
                  type="range"
                  min="0"
                  max="100"
                  value="35"
                >
              </div>

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

      doc.close();

      //Lock-in music functionality
      const musicSelect = doc.getElementById(
        "lockin-music-select"
      );

      const musicToggle = doc.getElementById(
        "lockin-music-toggle"
      );

      const musicVolume = doc.getElementById(
        "lockin-music-volume"
      );

      const musicStatus = doc.getElementById(
        "lockin-music-status"
      );

      //Create an audio player inside popup.
      const focusAudio = doc.createElement("audio");

      focusAudio.loop = true;
      focusAudio.volume = 0.35;
      focusAudio.preload = "none";

      doc.body.appendChild(focusAudio);

      //Use absolute URLs so popup can find files regardless of document URL
      const musicTracks = {
        lofi: new URL(
          "music/lofistudy.mp3",
          document.baseURI
        ).href,
        softjazz: new URL(
          "music/lofijazz.mp3",
          document.baseURI
        ).href,
        ambient: new URL(
          "music/mountainstudy.mp3",
          document.baseURI
        ).href
      };

      function updateMusicButton() {
        musicToggle.textContent = focusAudio.paused
          ? "▶ Play"
          : "⏸ Pause";
      }

      musicSelect.addEventListener("change", async () => {
        const selected = musicSelect.value;

        focusAudio.pause();

        if(!selected) {
          focusAudio.removeAttribute("src");
          focusAudio.load();

          musicStatus.textContent = 
            "Music turned off.";

          updateMusicButton();
          return;
        }

        focusAudio.src = musicTracks[selected];

        try {
          await focusAudio.play();
          
          musicStatus.textContent = 
            "Now playing 🎶";
        } catch (error) {
          musicStatus.textContent=
            "Could not play this track. Check MP3 file.";
          console.warn("Music playback failed:", error);
        }

        updateMusicButton();
      });
    
      musicToggle.addEventListener("click", async() => {
        if (!musicSelect.value) {
          musicStatus.textContent = 
            "Please select a track first.";
          return;
        }

        if (focusAudio.paused) {
          try {
            await focusAudio.play();
            musicStatus.textContent = "Now playing 🎶";
          } catch (error) {
            musicStatus.textContent = 
              "Unable to play music :(";
            console.warn(error);
          }
        } else {
          focusAudio.pause();
          musicStatus.textContent = "Music paused.";
        }

        updateMusicButton();
      });
      
      musicVolume.addEventListener("input", () => {
        focusAudio.volume =
          Number(musicVolume.value) / 100;
      });
    
      focusAudio.addEventListener("error", () => {
        musicStatus.textContent = 
          "Music file not found or supported";
        updateMusicButton();
      });

      focusAudio.addEventListener("play", updateMusicButton);
      focusAudio.addEventListener("pause", updateMusicButton);
    } else {
      notify(
        "Focus started. Allow popups to see the timer."
      );
    }

    updateLockinTimer();

    lockinTimer = setInterval(
      updateLockinTimer,
      1000
    );
  }

  $("#confirm-room-clear")?.addEventListener(
    "click",
    startLockinSession
  );

  /* =========================================
     WEEKLY PROGRESS REPORT
  ========================================= */

  //Get Monday at midnight for given date
  //Reporting week should run from Monday to Sunday

  function getWeekStart(date = new Date()) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);

    const day = result.getDay();
    const daysSinceMonday = (day + 6) % 7;

    result.setDate(result.getDate() - daysSinceMonday);

    return result;
  }

  function getWeekEnd(weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }

  //Determine whether a task was completed during the selected reporting week.
  function wasCompletedThisWeek(task, start, end) {
    if (!task.completed || !task.completedAt) {
      return false;
    }

    const completedAt = Number(task.completedAt);

    return Number.isFinite(completedAt) &&
      completedAt >= start.getTime() &&
      completedAt < end.getTime();
  }

  //Include tasks created, due, or completed during the selected Monday-Sunday week.
  function getWeeklyTasks(start, end) {
    const startKey = dateKey(start);
    const endKey = dateKey(end);

    return tasks.filter((task) => {
      const createdAt = Number(task.createdAt);

      const createdThisWeek =
        Number.isFinite(createdAt) &&
        createdAt > 0 &&
        createdAt >= start.getTime() &&
        createdAt < end.getTime();

      const dueThisWeek =
        Boolean(task.dueDate) &&
        task.dueDate >= startKey &&
        task.dueDate < endKey;

      const completedThisWeek =
        wasCompletedThisWeek(task, start, end);

      return createdThisWeek ||
        dueThisWeek ||
        completedThisWeek;
    });
  }

  function formatWeeklyRange(start, endExclusive) {
    const lastDay = new Date(endExclusive);
    lastDay.setDate(lastDay.getDate() - 1);

    const startText = start.toLocaleDateString(
      undefined, 
      {
        month: "short", 
        day: "numeric"
      }
    );

    const endText = lastDay.toLocaleDateString(
      undefined, 
      {
        month: "short", 
        day: "numeric", 
        year: "numeric"
      }
    );

    return `${startText} - ${endText}`;
  }

  /* =========================================
     OVERALL PROGRESS
  ========================================= */

  function renderWeeklyOverall(weeklyTasks, start, end) {
    const completed = weeklyTasks.filter(
      (task) => task.completed
    ).length;

    const completedThisWeek = weeklyTasks.filter(
      (task) => wasCompletedThisWeek(task, start, end)
    ).length;
  
    const total = weeklyTasks.length;
    const notStarted = total - completed;

    const percentage = total
      ? Math.round((completed / total) * 100)
      : 0;

    const summary = $("#weekly-report-summary");
    const percent = $("#weekly-report-percent");
    const donut = $("#weekly-report-donut");

    if (summary) {
      summary.textContent =
        `${completedThisWeek} task` +
        `${completedThisWeek === 1 ? "" : "s"} completed this week. ` +
        `${completed} of ${total} tracked tasks are currently complete.`;
    }

    if (percent) {
      percent.textContent = `${percentage}%`;
    }
    
    if (donut) {
      donut.style.setProperty(
        "--weekly-percent",
        percentage
      );

      donut.setAttribute(
        "aria-label",
        `${percentage}% of weekly tasks completed`
      );
    }

    const completedLabel = $("#weekly-report-completed");
  

    const incompleteLabel = $("#weekly-report-not-started");

    if (completedLabel) {
      completedLabel.textContent = completed;
    }

    if (incompleteLabel) {
      incompleteLabel.textContent = notStarted;
    }

    return {
      completed,
      completedThisWeek,
      total,
      percentage,
      notStarted
    };
  }

  /* =========================================
     PROGRESS BY CATEGORY
  ========================================= */

  function renderWeeklyCategories(weeklyTasks) {
    const container = $("#weekly-report-categories");
    
    if (!container) return;

    container.replaceChildren();

    const subjects = new Map();

    weeklyTasks.forEach((task) => {
      //Task category is the selected subject
      const subject = 
        String(task.category || "").trim() ||
        "Uncategorized";

      if (!subjects.has(subject)) {
        subjects.set(subject, {
          completed: 0,
          total: 0
        });
      }

      const data = subjects.get(subject);

      data.total++;

      if (task.completed) {
        data.completed++;
      }
    });

    if (!subjects.size) {
      const empty = document.createElement("p");
      empty.className = "weekly-report-empty";
      empty.textContent = 
        "No tasks were created, due, or completed this week.";

      container.appendChild(empty);
      return;
    }

    [...subjects.entries()]
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .forEach(([subject, data]) => {
        const percentage = Math.round(
            (data.completed / data.total) * 100
          );
        
        const row = document.createElement("div");
        row.className = "weekly-category-row";

        const name = document.createElement("span");
        name.className = "weekly-category-name"
        name.textContent = subject;

        const track = document.createElement("div");
        track.className = "weekly-category-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", subject);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", '100');
        track.setAttribute("aria-valuenow", percentage);

        const fill = document.createElement("div");
        fill.className = "weekly-category-fill"
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);

        const count = document.createElement("strong");
        count.className = "weekly-category-count";
        count.textContent = `${data.completed}/${data.total}`;

        row.append(name, track, count);
        container.appendChild(row);
      });
  }

  /* =========================================
     TASKS THIS WEEK TABLE
  ========================================= */

  function renderWeeklyTaskTable(weeklyTasks, start, end) {
    const tbody = $("#weekly-report-task-rows");
    
    if (!tbody) return;

    tbody.replaceChildren();

    if (!weeklyTasks.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 3;
      cell.className = "weekly-report-empty";
      cell.textContent = "No tasks created, due, or completed this week.";
      
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    const sorted = [...weeklyTasks].sort((a, b) => {
      const aDue = a.dueDate || "9999-12-31";
      const bDue = b.dueDate || "9999-12-31";

      return aDue.localeCompare(bDue) || String(a.name || "").localeCompare(String(b.name || ""))
    });

    sorted.forEach((task) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const notesCell = document.createElement("td");

      const name = document.createElement("div");
      name.className = "weekly-task-name";
      name.textContent = task.name || "Untitled task";
      
      nameCell.appendChild(name);

      const status = document.createElement("span");
      status.className = 
        "weekly-status-badge " + (task.completed ? "completed" : "not-started");
      
      status.textContent = task.completed ? "Completed" : "Incomplete";

      statusCell.appendChild(status);

      const notes = [];

      if (task.category) {
        notes.push(task.category);
      }

      if (task.dueDate) {
        notes.push(`Due ${formatDate(task.dueDate)}`);
      }

      if (wasCompletedThisWeek(task, start, end)) {
        notes.push("Finished this week.");
      }

      notesCell.textContent = notes.join(" • ") || "—";

      row.append(nameCell, statusCell, notesCell);
      tbody.appendChild(row);
    });
  }

  /* =========================================
     HIGHLIGHTS AND CHALLENGES
  ========================================= */
  
  function renderWeeklyHighlights(stats, weeklyTasks, start, end) {
    const highlights = $("#weekly-report-highlights");
    const challenges = $("#weekly-report-challenges");
  
    if (!highlights || !challenges) return;

    highlights.replaceChildren();
    challenges.replaceChildren();

    const wins = [];
    const issues = [];

    const now = new Date();
    const cutoff = Math.min(now.getTime(), end.getTime());
    const today = dateKey(now);

    const completedThisWeek = weeklyTasks.filter((task) => 
      wasCompletedThisWeek(task, start, end)
    );

    //Count completions by local calendar
    const completionsByDay = new Map();
    const completionsBySubject = new Map();

    completedThisWeek.forEach((task) => {
      const completedDate = new Date(Number(task.completedAt));
      
      const day = dateKey(completedDate);

      completionsByDay.set(
        day, 
        (completionsByDay.get(day) || 0) + 1
      );

      const subject = String(task.category || "").trim() || "Uncategorized";
    
      completionsBySubject.set(
        subject,
        (completionsBySubject.get(subject) || 0) + 1
      );
    });

    const busiestDay = [...completionsByDay.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    if (busiestDay && busiestDay[1] >= 3) {
      const dayName = new Date(`${busiestDay[0]}T12:00:00`)
        .toLocaleDateString(undefined, {weekday: "long"});

      wins.push(
        `Productive ${dayName}: you completed ` + 
        `${busiestDay[1]} tasks in one day.`
      );
    }

    //All potential highlights to be put 
    //Highlights: High completion rate
    if (stats.total >= 3 && stats.percentage >= 80) {
      wins.push(
        `You completed ${stats.percentage}% of ` + 
        `the tasks tracked for this week.`
      );
    }

    //Highlight: Tracked tasks for completion
    if (stats.total > 0 && stats.notStarted === 0){
      wins.push (
        `All tasks tracked for this week were completed. ` + 
        `Good job!`
      );
    }

    //Highlight: Several active days
    if (completionsByDay.size >= 3) {
      wins.push(
        `You completed tasks on ` +
        `${completionsByDay.size} different days this week.\n` +
        `"You're rather consistent!`
      );
    }

    //Highlight: Strongest subject 
    const strongestSubject = [...completionsBySubject.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    if (strongestSubject && strongestSubject[1] >= 1) {
      wins.push(
        `${strongestSubject[0]} was a strong subject: ` + 
        `${strongestSubject[1]} tasks completed.`
      );
    }

    //Highlight: Working across multiple subjects
    if (completionsBySubject.size >= 3) {
      wins.push(
        `You completed work in ` + 
        `${completionsBySubject.size} different subjects.`
      );
    }

    //Highlight: Tasks finished before their due date
    const earlyTasks = completedThisWeek .filter((task) => {
      if (!task.dueDate) return false;

      const completedDay = dateKey(new Date(Number(task.completedAt)));

      return completedDay < task.dueDate;
    });

    if (earlyTasks.length >= 1) {
      wins.push(
        `${earlyTasks.length} task` + 
        `${earlyTasks.length === 1 ? " was" : "s were"} ` +
        "completed before the due date."
      );
    }

    //Highlight: Strong task volume.
    if (completedThisWeek.length >= 5) {
      wins.push(
        `You finished ${completedThisWeek.length}` + 
        "tasks during this week."
      );
    }

    //All potential challenges to be put
    //Challenge: Past-due unfinished tasks.
    const overdue = weeklyTasks.filter((task) => {
      return !task.completed && task.dueDate && task.dueDate < today;
    });

    if (overdue.length) {
      issues.push(
        `${overdue.length} unfinished task` +
        `${overdue.length === 1 ? " is" : "s are"} ` +
        "past the due date."
      );
    }

    //Challenge: Low Completion rate.
    if (stats.total >= 3 && stats.percentage < 40) {
      issues.push(
        `Only ${stats.percentage}% of this week's ` + 
        `tracked tasks are complete.`
      );
    }

    //Challenge: Long inactivity period 
    //Only counts days that have actually elapsed.
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const endOfObservedPeriod = new Date(cutoff);
    endOfObservedPeriod.setHours(0, 0, 0, 0);

    let longestGap = 0;
    let currentGap = 0

    const cursor = new Date(startDay);

    while (cursor <= endOfObservedPeriod) {
      const key = dateKey(cursor);

      if (completionsByDay.has(key)) {
        currentGap = 0;
      } else {
        currentGap++;
        longestGap = Math.max(longestGap, currentGap);
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (longestGap >= 3 && stats.total > 0) {
      issues.push(
        `There was a stretch of ${longestGap} ` +
        "days without a recorded task completion."
      );
    }

    //Challenge: tasks clustered on one day
    if (
      busiestDay 
      && completedThisWeek.length >= 4 
      && busiestDay[1] / completedThisWeek.length >= 0.75
    ) {
      issues.push(
        `${busiestDay[1]} of your ` +
        `${completedThisWeek.length} completions ` + 
        "happened on One day. Work was concentrated." 
      );
    }

    //Challenge: Unfinished subject workload.
    const unfinishedBySubject = new Map();

    weeklyTasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        const subject = String(task.category || "").trim() || "Uncategorized";
      
        unfinishedBySubject.set(
          subject,
          (unfinishedBySubject.get(subject) || 0) + 1
        );
      });
    
    const busiestUnfinishedSubject = [...unfinishedBySubject.entries()]
      .sort((a, b) => b[1] - a[1])[0];
    
    if (busiestUnfinishedSubject && busiestUnfinishedSubject[1] >= 3) {
      issues.push(
        `${busiestUnfinishedSubject[0]} has ` + 
        `${busiestUnfinishedSubject[1]} ` + 
        "unfinished tasks in this week's report."
      );
    }

    //Challenge: Repeated due-date changes
    const postponedTasks = weeklyTasks.filter((task) => 
      (Number(task.dueDateEditCount) || 0) >= 2
    );

    if (postponedTasks.length) {
      issues.push(
        `${postponedTasks.length} task` + 
        `${postponedTasks.length === 1 ? " has" : "s have"} ` +
        "had its due date changed at least twice."
      );
    }

    //Empty states
    
    if (!wins.length) {
      wins.push(
        completedThisWeek.length
        ? `${completedThisWeek.length} task` +
          `${completedThisWeek.length === 1 ? "" : "s"}` +
          " completed this week."
        : "No completed tasks recorded this week."
      );
    }

    if (!issues.length) {
      issues.push(
        stats.total
          ? "No major challenges detected from recorded tasks."
          : "Not enough task activity to identify challenges."
      );
    }

    //Render up to five relevant insights per side.
    function appendInsights(list, messages) {
      messages.slice(0, 5).forEach((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        list.appendChild(item);
      });
    }

    appendInsights(highlights, wins);
    appendInsights(challenges, issues);
  }

  /* =========================================
     NEXT WEEK'S GOALS
  ========================================= */

  function renderWeeklyGoals(endOfCurrentWeek) {
    const list = $("#weekly-report-goals");

    if (!list) return;

    list.replaceChildren();

    const nextWeekStart = 
      dateKey(endOfCurrentWeek);
    
    const nextWeekEndDate = 
      new Date(endOfCurrentWeek);

    nextWeekEndDate.setDate(
      nextWeekEndDate.getDate() + 7
    );

    const nextWeekEnd = 
      dateKey(nextWeekEndDate);
    
    const goals = tasks
      .filter((task) => {
        return (
          !task.completed &&
          task.dueDate &&
          task.dueDate >= nextWeekStart &&
          task.dueDate < nextWeekEnd
        );
      })
      .sort((a, b) => 
        a.dueDate.localeCompare(b.dueDate)
      )
      .slice(0, 5);
    
    if (!goals.length) {
      const li = document.createElement("li");
      li.textContent = 
        "Plan one meaningful goal for next week.";
      
      list.appendChild(li);
      return;
    }

    goals.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = task.name;
      list.appendChild(li);
    });
  }

  /* =========================================
    RENDER WEEKLY REPORT
  ========================================= */

  function renderWeeklyReport() {
    const panel = $("#weekly-report-panel");

    if (!panel) return;

    const start = getWeekStart();
    const end = getWeekEnd(start);

    const range = 
      $("#weekly-report-range");
    
    if (range) {
      range.textContent = 
        formatWeeklyRange(start, end);
    }  

    const weeklyTasks = 
      getWeeklyTasks(start, end);

    const stats = renderWeeklyOverall(
      weeklyTasks,
      start,
      end
    );

    renderWeeklyCategories(weeklyTasks);

    renderWeeklyTaskTable(
      weeklyTasks, 
      start,
      end
    );

    renderWeeklyHighlights(
      stats,
      weeklyTasks,
      start,
      end
    );

    renderWeeklyGoals(end);
  }

  /* =========================================
     SIDEBAR NAVIGATION
  ========================================= */

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

  const dashboardContent =
    $(".dashboard-content");

  const sidebarNav =
    $(".dashboard-nav");

  const dashboardPages = {};

  let currentDashboardPage = "dashboard";

  function initializeNavigation() {
    if (!dashboardContent) {
      console.warn(
        "Could not find .dashboard-content. Navigation was not initialized."
      );
      return;
    }

    /*
      Capture existing sections before
      moving them into separate pages.
    */

    const sections = {
      greeting: $(".crow-section"),
      progress: $(".progress-section"),
      tasks: $(".task-section"),
      dates: $(".important-dates-section"),
      classes: $(".classes-section"),
      calendar: $(".calendar-section"),
      weeklyReport: $("#weekly-report-panel")
    };

    /* =========================================
       TASKS PAGE HEADER
       MATCH IMPORTANT DATES
    ========================================= */

    const taskSection = sections.tasks;
    const taskInput = $("#task-input");
    const addTaskButton = $("#add-task-button");

    if (taskSection) {
      const taskHeader =
        document.createElement("div");

      taskHeader.className =
        "tasks-page-header";

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

      const taskEntry =
        document.createElement("div");

      taskEntry.className =
        "tasks-page-entry";

      /*
        Move existing input and button.
        Their event listeners are preserved.
      */

      if (taskInput) {
        taskEntry.appendChild(taskInput);
      }

      if (addTaskButton) {
        taskEntry.appendChild(addTaskButton);
      }

      taskHeader.appendChild(taskEntry);
      taskSection.prepend(taskHeader);

      const oldHeading = $("#task-count");

      if (oldHeading) {
        oldHeading.style.display = "none";
      }
    }

    /* =========================================
       CREATE DASHBOARD PAGES
    ========================================= */

    pageDefinitions.forEach((definition) => {
      const page =
        document.createElement("section");

      page.id =
        `crow-page-${definition.id}`;

      page.className =
        "dashboard-page";

      page.dataset.page =
        definition.id;

      dashboardPages[definition.id] = page;

      dashboardContent.appendChild(page);
    });

    /* =========================================
       DASHBOARD GREETING + PROGRESS
    ========================================= */

    [
      sections.greeting,
      sections.progress
    ].forEach((section) => {
      if (section) {
        dashboardPages.dashboard.appendChild(
          section
        );
      }
    });

    /* =========================================
       DASHBOARD — UPCOMING TASKS
    ========================================= */

    const upcomingSection =
      document.createElement("section");

    upcomingSection.id =
      "upcoming-tasks-section";

    upcomingSection.className =
      "upcoming-tasks-section";

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

    dashboardPages.dashboard.appendChild(
      upcomingSection
    );

    /* =========================================
       MOVE SECTIONS INTO THEIR PAGES
    ========================================= */

    const pageSections = {
      tasks: sections.tasks,
      dates: sections.dates,
      classes: sections.classes,
      calendar: sections.calendar,
      "weekly-report": sections.weeklyReport
    };

    Object.entries(pageSections).forEach(
      ([id, section]) => {
        if (section) {
          dashboardPages[id].appendChild(
            section
          );
        }
      }
    );

    //Allows navigation to display report
    if (sections.weeklyReport) {
      sections.weeklyReport.hidden = false;
    }

    /* =========================================
       INVENTORY PLACEHOLDER
    ========================================= */

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

    renderCollectiblesInventory();

    /* =========================================
       REBUILD SIDEBAR
    ========================================= */

    if (sidebarNav) {
      sidebarNav.replaceChildren();

      pageDefinitions.forEach((definition) => {
        const link =
          document.createElement("a");

        link.href =
          `#${definition.id}`;

        link.dataset.pageLink =
          definition.id;

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

        link.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            if (
              window.location.hash !==
              `#${definition.id}`
            ) {
              window.location.hash =
                definition.id;
            } else {
              showDashboardPage(
                definition.id
              );
            }
          }
        );

        sidebarNav.appendChild(link);
      });
    }

    showDashboardPage(
      window.location.hash.slice(1) ||
      "dashboard"
    );
  }

  function showDashboardPage(pageId) {
    if (!dashboardPages[pageId]) {
      pageId = "dashboard";
    }

    currentDashboardPage = pageId;

    Object.entries(dashboardPages).forEach(
      ([id, page]) => {
        page.classList.toggle(
          "active",
          id === pageId
        );
      }
    );

    $$("[data-page-link]").forEach((link) => {
      const active =
        link.dataset.pageLink === pageId;

      link.classList.toggle(
        "active",
        active
      );

      if (active) {
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.removeAttribute(
          "aria-current"
        );
      }
    });

    if (pageId === "calendar") {
      renderCalendar();
    }

    if (pageId === "classes") {
      renderClassesList();
    }

    if (pageId === "weekly-report") {
      renderWeeklyReport();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  window.addEventListener(
    "hashchange",
    () => {
      showDashboardPage(
        window.location.hash.slice(1) ||
        "dashboard"
      );
    }
  );

  /* =========================================
     BASIC NAVIGATION / CLASSES STYLES
  ========================================= */

  const pageStyle =
    document.createElement("style");

  pageStyle.textContent = `
    .dashboard-content > .dashboard-page {
      display: none !important;
      width: 100%;
      min-width: 0;
      grid-column: 1 / -1;
    }

    .dashboard-content > .dashboard-page.active {
      display: block !important;
    }

    #crow-page-dashboard.active {
      display: flex !important;
      flex-direction: column;
      gap: 20px;
    }

    .dashboard-page > .task-section,
    .dashboard-page > .important-dates-section,
    .dashboard-page > .classes-section,
    .dashboard-page > .calendar-section {
      width: 100%;
      max-width: none;
      grid-column: 1 / -1;
    }

    #crow-page-calendar #calendar-grid {
      display: grid;
      grid-template-columns:
        repeat(7, minmax(0, 1fr));
      gap: 7px;
    }

    #crow-page-calendar .calendar-day {
      min-width: 0;
      min-height: 120px;
    }

    #saved-classes-container {
      margin-top: 24px;
    }

    .saved-classes-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    #saved-classes-list {
      display: grid;
      gap: 10px;
    }

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

    .saved-class-info {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    .saved-class-info strong {
      overflow-wrap: anywhere;
    }

    .saved-class-info small {
      opacity: .75;
    }

    .saved-class-delete {
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      background: #ffe0f6;
      color: #913d85;
      cursor: pointer;
    }

    body.dark-mode .saved-class-item {
      background: #302435;
      border-color: #70466c;
      color: #ffe6fb;
    }

    body.dark-mode .saved-class-delete {
      background: #60245e;
      color: #ffb9f8;
    }

    .inventory-empty {
      padding: 60px 20px;
      text-align: center;
      border: 1px dashed #d9e5e1;
      border-radius: 18px;
    }

    .inventory-empty-icon {
      font-size: 48px;
    }

    @media (max-width: 700px) {
      #crow-page-calendar .calendar-day {
        min-height: 70px;
        padding: 4px;
      }
    }
  `;

  document.head.appendChild(pageStyle);

  /* =========================================
     MODAL CONTROLS
  ========================================= */

  $$(".modal").forEach((modal) => {
    modal.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) {
          closeModal(modal);
        }
      }
    );
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        $$(".modal.show").forEach(
          closeModal
        );
      }
    }
  );

  /* =========================================
     RENDER UPCOMING TASKS
  ========================================= */

  function renderUpcomingTasks() {
    const list = $("#upcoming-tasks-list");
    const count = $("#upcoming-tasks-count");

    if (!list) return;

    list.replaceChildren();

    const today = todayKey();

    /*
      Show the earliest five unfinished
      tasks, including overdue tasks.
    */

    const upcoming = tasks
      .filter(
        (task) =>
          !task.completed &&
          task.dueDate
      )
      .sort(
        (a, b) =>
          a.dueDate.localeCompare(
            b.dueDate
          )
      )
      .slice(0, 5);

    if (count) {
      count.textContent =
        `${upcoming.length} shown`;
    }

    if (!upcoming.length) {
      const empty =
        document.createElement("p");

      empty.className =
        "upcoming-tasks-empty";

      empty.textContent =
        "No upcoming tasks. You're all caught up! 🎉";

      list.appendChild(empty);
      return;
    }

    upcoming.forEach((task) => {
      const row =
        document.createElement("div");

      row.className =
        "upcoming-task-item";

      const overdue =
        task.dueDate < today;

      const dueToday =
        task.dueDate === today;

      if (overdue) {
        row.classList.add("overdue");
      }

      const details =
        document.createElement("div");

      details.className =
        "upcoming-task-info";

      const name =
        document.createElement("strong");

      name.textContent = task.name;

      const due =
        document.createElement("small");

      due.textContent = overdue
        ? `Overdue · ${formatDate(task.dueDate)}`
        : dueToday
          ? "Due today"
          : `Due ${formatDate(task.dueDate)}`;

      details.append(name, due);

      const checkbox =
        document.createElement("input");

      checkbox.type = "checkbox";

      checkbox.className =
        "upcoming-task-checkbox";

      checkbox.setAttribute(
        "aria-label",
        `Complete ${task.name}`
      );

      checkbox.addEventListener(
        "change",
        () => {
          setTaskCompleted(
            task,
            checkbox.checked
          );
        }
      );

      row.append(checkbox, details);
      list.appendChild(row);
    });
  }

  /* =========================================
     RENDER EVERYTHING
  ========================================= */

  function renderAll() {
    applyOverduePenalties();

    //A failure in one section should not prevent unrelated sections from updating.
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

    renderers.forEach(([name, render]) => {
      try {
        render();
      } catch (error) {
        console.error(`${name} failed to render:`, error);
      }
    });
  }

  /* =========================================
     AUTOMATIC REFRESH
  ========================================= */

  // Refresh every 30 seconds.
  setInterval(renderAll, 30000);

  // Refresh when returning to the tab.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        renderAll();
      }
    }
  );

  window.addEventListener(
    "focus",
    renderAll
  );

  // Synchronize saved data across tabs.
  window.addEventListener(
    "storage",
    (event) => {
      if (event.key === "crowTasks") {
        tasks = storage.get(
          "crowTasks",
          []
        );

        if (!Array.isArray(tasks)) {
          tasks = [];
        }

        renderAll();
      }

      if (event.key === "crowTokens") {
        tokens = Number(
          storage.get(
            "crowTokens",
            0
          )
        ) || 0;

        updateTokens();
      }

      if (event.key === "crowImportantDates") {
        importantDates = storage.get(
          "crowImportantDates",
          []
        );

        if (!Array.isArray(importantDates)) {
          importantDates = [];
        }

        renderAll();
      }

      if (event.key === "crowClasses") {
        classes = storage.get(
          "crowClasses",
          []
        );

        if (!Array.isArray(classes)) {
          classes = [];
        }

        renderAll();
      }

      if (event.key === "crowTheme") {
        applyTheme(
          storage.get(
            "crowTheme",
            "light"
          )
        );
      }
    }
  );

  /* =========================================
     INITIALIZE
  ========================================= */
    
  updateClassOptions();
  createClassesList();
  initializeNavigation();
  renderAll();

  /*
    The crow personality system now handles
    welcome-back messages automatically.

    First-time visitors still get a greeting.
  */

  const hasVisitedBefore = Boolean(
    storage.get("crowHasVisitedBefore", false)
  );

  if (!hasVisitedBefore) {
    notify(
      "Welcome to Crow's Task Tracker! Let's get productive!",
      5000,
      true
    );

    storage.set(
      "crowHasVisitedBefore",
      true
    );
  }

  /* =========================================
     DASHBOARD GLOBAL SEARCH
  ========================================= */

  const dashboardSearchForm = $("#dashboard-search-form");

  const dashboardSearchInput = $("#dashboard-search-input");

  const dashboardSearchResults = $("#dashboard-search-results");

  //Normalizing searchable text
  function normalizeSearchText(value) {
    return String(value ?? "").toLowerCase().trim();
  }

  function closeDashboardSearch() {
    if (!dashboardSearchResults) return;

    dashboardSearchResults.hidden = true;

    dashboardSearchInput?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  //Search saved tasks, dates, and classes
  function getDashboardSearchResults(query) {
    const term = normalizeSearchText(query);

    if (!term) return [];

    const matches = [];

    function addMatch(type, item, title, fields) {
      const searchable = fields.map(normalizeSearchText).join(" ")

      if (!searchable.includes(term)) return;

      const normalizedTitle = normalizeSearchText(title);

      const rank = normalizedTitle.startsWith(term) 
        ? 0
        : normalizedTitle.includes(term)
          ? 1
          : 2;
      
      matches.push({
        type,
        item,
        title,
        rank
      });
    }

    //Searching tasks
    tasks.forEach((task) => {
      addMatch(
        "task",
        task,
        task.name || "Unnamed task",

        [
          task.name,
          task.category,
          task.dueDate,
          task.completed ? "completed" : "incomplete",
          task.completed ? "done" : "pending"
        ]
      );
    });

    //Search important dates
    importantDates.forEach((date) => {
      addMatch (
        "date",
        date,
        date.name || "Unnamed date",
        [
          date.name, 
          date.category,
          date.date,
          date.type,
          date.type === "personal"
            ? "personal"
            : "school work"
        ]
      );
    });

    //Searching for classes
    classes.forEach((classItem) => {
      const repeat = classItem.repeat || classItem.type || "weekly";

      const weekday = repeat === "weekly"
        ? weekdayNames[Number(classItem.weekday)] || ""
        : "";

      addMatch(
        "class",
        classItem,
        classItem.name || "Unnamed class",
        [
          classItem.name, 
          repeat,
          weekday,
          classItem.date
        ]
      );
    });

    return matches.sort((a, b) => 
      a.rank - b.rank || 
      a.title.localeCompare(b.title)
    ).slice(0, 12);
  }

  //Open the correct dashboard page
  function openSearchResultPage(page) {
    closeDashboardSearch();

    const navLink = $(
      `.dashboard-nav a[href="${page}"]`
    );

    if (navLink) {
      navLink.click();
    } else {
      window.location.hash = page;
    }
  }

  //Create a clickable autocomplete card
  function createDashboardSearchCard(result) {
    const card = document.createElement("div");
    card.className = `dashboard-search-result search-type-${result.type}`;

    const main = document.createElement("div");
    main.className = "dashboard-search-result-main";

    const icon = document.createElement("span");
    icon.className = "dashboard-search-result-icon";
    icon.textContent = 
      result.type === "task" ? "☑" : 
      result.type === "date" ? "📆" : "📖";
    
    const info = document.createElement("div");
    info.className = "dashboard-search-result-info";

    const title = document.createElement("strong");
    title.textContent = result.title;

    const details = document.createElement("small");

    if (result.type == "task") {
      const task = result.item;

      details.textContent = [
        task.category,
        task.dueDate 
          ? `Due ${formatDate(task.dueDate)}`
          : "No due date",
        task.completed ? "Completed" : "Incomplete"
      ].filter(Boolean).join(" • ");

      //Complete or uncomplete directly in search
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "dashboard-search-checkbox";
      checkbox.checked = Boolean(task.completed);

      checkbox.setAttribute(
        "aria-label",
        `Mark ${result.title} as completed`
      );

      checkbox.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      checkbox.addEventListener("change", (event) => {
        event.stopPropagation();

        //Use the original completion function so that
        //coins, crow praise, and progress still work
        setTaskCompleted(task, checkbox.checked);

        //Keep autocomplete visible and current
        renderDashboardSearchResults();
      });

      main.appendChild(checkbox);

      if (task.completed ) {
        card.classList.add("search-task-completed");
      }
    } else if (result.type === "date") {
      const date = result.item;

      details.textContent = [
        date.date ? formatDate(date.date) : "No date",
        date.category,
        date.type === "personal"
          ? "Personal"
          : "School / Work"
      ].filter(Boolean).join(" • ");

      main.appendChild(icon);
    } else {
      const classItem = result.item;
      const repeat = classItem.repeat || classItem.type || "weekly";
      
      const schedule = repeat === "weekly"
        ? `Every ${weekdayNames[Number(classItem.weekday)] || "week"}`
        : formatDate(classItem.date);

      details.textContent = [
        schedule, 
        repeat === "weekly"
          ? "Repeating class"
          : "One-time class"
      ].join(" • ");

      main.appendChild(icon);
    }

    info.append(title, details);
    main.appendChild(info);
    card.appendChild(main);

    //Open related dashboard section
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "dashboard-search-open";
    openButton.textContent = "View";

    const page =
      result.type === "task" ? "#tasks" :
      result.type === "date" ? "#dates" :
      "#classes";

    openButton.addEventListener("click", () => {
      dashboardSearchInput.value = result.title;
      openSearchResultPage(page);
    });

    card.appendChild(openButton);
    
    return card;
  }


  //Render results safely without injecting HTML
  function renderDashboardSearchResults() {
    if (!dashboardSearchInput || !dashboardSearchResults) {
      return;
    } 

    const query = dashboardSearchInput.value.trim();

    dashboardSearchResults.replaceChildren();

    if (!query) {
      closeDashboardSearch();
      return;
    }

    const results = getDashboardSearchResults(query);

    dashboardSearchResults.hidden = false;

    dashboardSearchInput.setAttribute(
      "aria-expanded",
      "true"
    );

    const heading = document.createElement("div");
    heading.className = "dashboard-search-heading";
    heading.textContent = `${results.length} matching result${results.length === 1 ? "" : "s"}`;

    dashboardSearchResults.appendChild(heading);

    if (results.length === 0) {
      const empty = document.createElement("p");

      empty.className = "dashboard-search-empty";
      empty.textContent = `No results found for "${query}".`;

      dashboardSearchResults.appendChild(empty);
      return;
    }

    results.forEach((result) => {
      dashboardSearchResults.appendChild(createDashboardSearchCard(result));
    });
  }

  //Automatic suggestions as the user inputs their query
  dashboardSearchInput?.addEventListener("input", renderDashboardSearchResults);

  //Reopen suggestions when the input is focused
  dashboardSearchInput?.addEventListener("focus", () => {
    if (dashboardSearchInput.value.trim()) {
      renderDashboardSearchResults();
    }
  });

  //Prevent form from reloading the page
  dashboardSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const results = getDashboardSearchResults(dashboardSearchInput?.value || "");

    if (results.length === 1) {
      const result = results[0];

      dashboardSearchInput.value = result.title;

      openSearchResultPage(
        result.type === "task" ? "#tasks" :
        result.type === "date" ? "#dates" :
        "#classes"
      );
    } else {
      renderDashboardSearchResults();
    }
  });

  //Close results with Escape
  dashboardSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDashboardSearch();
      dashboardSearchInput.blur();
    }
  });

  //Close results when clicking elsewhere
  document.addEventListener("pointerdown", (event) => {
    if(!event.target.closest(".dashboard-search")) {
      closeDashboardSearch();
    }
  });
})
