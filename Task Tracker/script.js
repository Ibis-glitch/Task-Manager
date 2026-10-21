
"use strict";

/* =========================================
   CROW'S TASK TRACKER
   DASHBOARD JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
    LIGHT / DARK MODE
    ========================================= */

    const themeToggle =
    document.getElementById("theme-toggle");

    const themeIcon =
    document.getElementById("theme-icon");

    const themeLabel =
    document.getElementById("theme-label");

    const THEME_STORAGE_KEY = "crowTheme";

    function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    if (themeIcon) {
        themeIcon.textContent =
        isDark ? "☀️" : "🌙";
    }

    if (themeLabel) {
        themeLabel.textContent =
        isDark ? "Light Mode" : "Dark Mode";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
        "aria-label",
        isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
        );

        themeToggle.setAttribute(
        "aria-pressed",
        String(isDark)
        );
    }
    }

    // Load saved theme, defaulting to light.
    let savedTheme = "light";

    try {
    savedTheme =
        localStorage.getItem(THEME_STORAGE_KEY)
        || "light";
    } catch (error) {
    console.warn(
        "Could not load theme preference.",
        error
    );
    }

    applyTheme(savedTheme);

    // Toggle between themes.
    themeToggle?.addEventListener(
    "click",
    () => {
        const nextTheme =
        document.body.classList.contains(
            "dark-mode"
        )
            ? "light"
            : "dark";

        applyTheme(nextTheme);

        try {
        localStorage.setItem(
            THEME_STORAGE_KEY,
            nextTheme
        );
        } catch (error) {
        console.warn(
            "Could not save theme preference.",
            error
        );
        }
    }
    );

  /* =======================================
     HELPERS
  ======================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null
          ? fallback
          : JSON.parse(value);
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    }
  };

  const createId = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayKey = () =>
    dateKey(new Date());

  const parseDate = (value) => {
    if (!value) return null;

    const [year, month, day] =
      value.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(
      year,
      month - 1,
      day
    );
  };

  const formatDate = (value) => {
    const date = parseDate(value);

    return date
      ? date.toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
            year: "numeric"
          }
        )
      : "No due date";
  };

  const show = (element) => {
    if (!element) return;

    element.classList.remove("hidden");
  };

  const hide = (element) => {
    if (!element) return;

    element.classList.add("hidden");
  };

  const openModal = (element) => {
    if (!element) return;

    element.classList.add("show");
    element.setAttribute(
      "aria-hidden",
      "false"
    );
  };

  const closeModal = (element) => {
    if (!element) return;

    element.classList.remove("show");
    element.setAttribute(
      "aria-hidden",
      "true"
    );
  };

  const notify = (message) => {
    const speech = $("#crow-popup-speech");

    if (!speech) {
      alert(message);
      return;
    }

    speech.textContent = message;
    speech.classList.add("show");

    clearTimeout(notify.timeout);

    notify.timeout = setTimeout(() => {
      speech.classList.remove("show");
    }, 3500);
  };

  /* =======================================
     SAVED DATA
  ======================================= */

  let tasks = storage.get(
    "crowTasks",
    []
  );

  let importantDates = storage.get(
    "crowImportantDates",
    []
  );

  let classes = storage.get(
    "crowClasses",
    []
  );

  let tokens = storage.get(
    "crowTokens",
    0
  );

  if (!Array.isArray(tasks)) tasks = [];
  if (!Array.isArray(importantDates)) {
    importantDates = [];
  }

  if (!Array.isArray(classes)) {
    classes = [];
  }

  if (!Number.isFinite(Number(tokens))) {
    tokens = 0;
  }

  tokens = Number(tokens);

  const saveTasks = () =>
    storage.set("crowTasks", tasks);

  const saveImportantDates = () =>
    storage.set(
      "crowImportantDates",
      importantDates
    );

  const saveClasses = () =>
    storage.set("crowClasses", classes);

  const saveTokens = () =>
    storage.set("crowTokens", tokens);

  /* =======================================
     TOKENS
  ======================================= */

  const updateTokens = () => {
    const count = $("#token-count");
    const storeCount =
      $("#store-token-count");

    if (count) {
      count.textContent = tokens;
    }

    if (storeCount) {
      storeCount.textContent = tokens;
    }
  };

  const addTokens = (amount) => {
    tokens += amount;

    saveTokens();
    updateTokens();

    notify(`🪙 +${amount} tokens!`);
  };

  $("#store-button")?.addEventListener(
    "click",
    () => {
      updateTokens();
      openModal($("#store-modal"));
    }
  );

  $("#close-store-modal")?.addEventListener(
    "click",
    () => closeModal($("#store-modal"))
  );

  /* =======================================
     DATE AND GREETING
  ======================================= */

  const updateGreeting = () => {
    const now = new Date();
    const hour = now.getHours();

    let greeting = "Good Evening";

    if (hour < 12) {
      greeting = "Good Morning";
    } else if (hour < 17) {
      greeting = "Good Afternoon";
    }

    const name = $("#crow-name");
    const message = $("#crow-message");
    const date = $("#date");

    if (name) {
      name.textContent =
        `${greeting}!`;
    }

    if (message) {
      const incomplete = tasks.filter(
        (task) => !task.completed
      ).length;

      message.textContent =
        `You have ${incomplete} task${
          incomplete === 1 ? "" : "s"
        } to work on.`;
    }

    if (date) {
      date.textContent =
        now.toLocaleDateString(
          undefined,
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          }
        );
    }
  };

  /* =======================================
     TASKS
  ======================================= */

  let editingTaskId = null;

  const taskModal = $("#task-modal");
  const taskName = $("#modal-task-name");
  const taskCategory = $("#task-category");
  const taskDueDate = $("#task-due-date");

  const getPriority = (dueDate) => {
    if (!dueDate) return "low";

    const due = parseDate(dueDate);
    const today = parseDate(todayKey());

    const days = Math.ceil(
      (due - today) / 86400000
    );

    if (days <= 2) return "high";
    if (days <= 7) return "medium";

    return "low";
  };

  const isOverdue = (task) =>
    Boolean(
      task.dueDate &&
      task.dueDate < todayKey() &&
      !task.completed
    );

  const resetTaskModal = () => {
    editingTaskId = null;

    if (taskName) taskName.value = "";
    if (taskCategory) {
      taskCategory.value = "";
    }

    if (taskDueDate) {
      taskDueDate.value = "";
    }

    const button =
      $("#confirm-task-button");

    if (button) {
      button.textContent = "Add Task";
    }
  };

  const openTaskEditor = (task = null) => {
    resetTaskModal();

    if (task) {
      editingTaskId = task.id;

      taskName.value = task.name;
      taskCategory.value =
        task.category || "";

      taskDueDate.value =
        task.dueDate || "";

      $("#confirm-task-button").textContent =
        "Save Changes";
    } else {
      taskName.value =
        $("#task-input")?.value.trim() || "";
    }

    openModal(taskModal);
    taskName?.focus();
  };

  $("#add-task-button")?.addEventListener(
    "click",
    () => openTaskEditor()
  );

  $("#task-input")?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        openTaskEditor();
      }
    }
  );

  $("#close-task-modal")?.addEventListener(
    "click",
    () => closeModal(taskModal)
  );

  $("#confirm-task-button")?.addEventListener(
    "click",
    () => {
      const name = taskName?.value.trim();

      if (!name) {
        alert("Please enter a task name.");
        return;
      }

      const data = {
        name,
        category:
          taskCategory?.value.trim() || "",
        dueDate:
          taskDueDate?.value || ""
      };

      if (editingTaskId) {
        const task = tasks.find(
          (item) =>
            item.id === editingTaskId
        );

        if (task) {
          Object.assign(task, data);
        }

        notify("Task updated!");
      } else {
        tasks.push({
          id: createId(),
          ...data,
          completed: false,
          createdAt: Date.now()
        });

        notify("Task added!");
      }

      saveTasks();
      closeModal(taskModal);
      resetTaskModal();

      if ($("#task-input")) {
        $("#task-input").value = "";
      }

      renderAll();
    }
  );

  const renderTasks = () => {
    const list = $("#task-list");
    const count = $("#task-count");
    const empty =
      $("#empty-task-message");

    if (!list) return;

    list.innerHTML = "";

    if (count) {
      count.textContent =
        `${tasks.length} task${
          tasks.length === 1 ? "" : "s"
        }`;
    }

    empty?.classList.toggle(
      "show",
      tasks.length === 0
    );

    const sorted = [...tasks].sort(
      (a, b) =>
        Number(a.completed) -
          Number(b.completed) ||
        String(a.dueDate || "9999").localeCompare(
          String(b.dueDate || "9999")
        )
    );

    sorted.forEach((task) => {
      const priority = getPriority(
        task.dueDate
      );

      const item =
        document.createElement("li");

      item.className =
        `task priority-${priority}`;

      if (task.completed) {
        item.classList.add("completed");
      }

      if (isOverdue(task)) {
        item.classList.add("overdue");
      }

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
            ${
              task.category
                ? `<span class="task-category">
                    ${escapeHTML(task.category)}
                   </span>`
                : ""
            }

            ${
              task.dueDate
                ? `<span class="task-due">
                    ${escapeHTML(
                      formatDate(task.dueDate)
                    )}
                   </span>`
                : ""
            }

            <span class="priority ${priority}">
              ${priority}
            </span>
          </div>
        </div>

        <button
          class="edit-button"
          type="button"
          aria-label="Edit task"
        >
          ✎
        </button>

        <button
          class="delete-button"
          type="button"
          aria-label="Delete task"
        >
          ✕
        </button>
      `;

      item.querySelector(
        ".task-checkbox"
      ).addEventListener(
        "change",
        (event) => {
          const wasCompleted =
            Boolean(task.completed);

          task.completed =
            event.target.checked;

          if (
            !wasCompleted &&
            task.completed
          ) {
           if (!task.coinAwarded) {
            task.coinAwarded = true;
            addTokens(1);
            }
          }

          saveTasks();
          renderAll();
        }
      );

      item.querySelector(
        ".edit-button"
      ).addEventListener(
        "click",
        () => openTaskEditor(task)
      );

      item.querySelector(
        ".delete-button"
      ).addEventListener(
        "click",
        () => {
          if (!confirm(
            "Delete this task?"
          )) {
            return;
          }

          tasks = tasks.filter(
            (item) =>
              item.id !== task.id
          );

          saveTasks();
          renderAll();
        }
      );

      list.appendChild(item);
    });
  };

  /* =======================================
     WEEKLY PROGRESS
  ======================================= */

  const renderProgress = () => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    const percentage = total
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

    const label =
      $("#progress-percent");

    const fill =
      $("#progress-fill");

    if (label) {
      label.textContent =
        `${percentage}%`;
    }

    if (fill) {
      fill.style.width =
        `${percentage}%`;
    }
  };

  /* =======================================
     IMPORTANT DATES
  ======================================= */

  let editingDateId = null;

  const dateModal =
    $("#important-date-modal");

  const resetDateModal = () => {
    editingDateId = null;

    $("#modal-important-date-name").value =
      "";

    $("#important-date-category").value =
      "";

    $("#important-date-date").value =
      "";

    const radio = $(
      'input[name="important-date-type"][value="school-work"]'
    );

    if (radio) radio.checked = true;

    $("#confirm-important-date-button")
      .textContent = "Add Important Date";
  };

  const openDateEditor = (item = null) => {
    resetDateModal();

    if (item) {
      editingDateId = item.id;

      $("#modal-important-date-name").value =
        item.name;

      $("#important-date-category").value =
        item.category || "";

      $("#important-date-date").value =
        item.date || "";

      const radio = $(
        `input[name="important-date-type"][value="${item.type}"]`
      );

      if (radio) {
        radio.checked = true;
      }

      $("#confirm-important-date-button")
        .textContent = "Save Changes";
    } else {
      $("#modal-important-date-name").value =
        $("#important-date-input")?.value.trim()
        || "";
    }

    openModal(dateModal);
  };

  $("#add-important-date-button")
    ?.addEventListener(
      "click",
      () => openDateEditor()
    );

  $("#important-date-input")
    ?.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          openDateEditor();
        }
      }
    );

  $("#close-important-date-modal")
    ?.addEventListener(
      "click",
      () => closeModal(dateModal)
    );

  $("#confirm-important-date-button")
    ?.addEventListener(
      "click",
      () => {
        const name = $(
          "#modal-important-date-name"
        ).value.trim();

        const date = $(
          "#important-date-date"
        ).value;

        if (!name || !date) {
          alert(
            "Enter a name and date."
          );
          return;
        }

        const data = {
          name,
          date,
          category: $(
            "#important-date-category"
          ).value.trim(),

          type: $(
            'input[name="important-date-type"]:checked'
          )?.value || "school-work"
        };

        if (editingDateId) {
          const item =
            importantDates.find(
              (entry) =>
                entry.id === editingDateId
            );

          if (item) {
            Object.assign(
              item,
              data
            );
          }
        } else {
          importantDates.push({
            id: createId(),
            ...data
          });
        }

        saveImportantDates();
        closeModal(dateModal);
        resetDateModal();

        $("#important-date-input").value =
          "";

        renderAll();
        notify("Important date saved!");
      }
    );

  const renderImportantDates = () => {
    const list =
      $("#important-date-list");

    const count =
      $("#important-date-count");

    const empty =
      $("#empty-important-date-message");

    if (!list) return;

    list.innerHTML = "";

    if (count) {
      count.textContent =
        `${importantDates.length} date${
          importantDates.length === 1
            ? ""
            : "s"
        }`;
    }

    empty?.classList.toggle(
      "show",
      importantDates.length === 0
    );

    [...importantDates]
      .sort((a, b) =>
        String(a.date).localeCompare(
          String(b.date)
        )
      )
      .forEach((item) => {
        const element =
          document.createElement("li");

        element.className =
          `important-date-item ${
            item.type || "school-work"
          }`;

        element.innerHTML = `
          <span class="important-date-icon">
            ${
              item.type === "personal"
                ? "🎉"
                : "📅"
            }
          </span>

          <div class="important-date-info">
            <span class="important-date-name">
              ${escapeHTML(item.name)}
            </span>

            <div class="important-date-details">
              <span>
                ${escapeHTML(
                  formatDate(item.date)
                )}
              </span>

              ${
                item.category
                  ? `<span>
                      ${escapeHTML(
                        item.category
                      )}
                     </span>`
                  : ""
              }

              <span class="important-date-type-badge">
                ${
                  item.type === "personal"
                    ? "Personal"
                    : "School / Work"
                }
              </span>
            </div>
          </div>

          <div class="important-date-actions">
            <button
              class="important-date-edit"
              type="button"
              aria-label="Edit important date"
            >
              ✎
            </button>

            <button
              class="important-date-delete"
              type="button"
              aria-label="Delete important date"
            >
              ✕
            </button>
          </div>
        `;

        element.querySelector(
          ".important-date-edit"
        ).addEventListener(
          "click",
          () => openDateEditor(item)
        );

        element.querySelector(
          ".important-date-delete"
        ).addEventListener(
          "click",
          () => {
            if (!confirm(
              "Delete this important date?"
            )) {
              return;
            }

            importantDates =
              importantDates.filter(
                (entry) =>
                  entry.id !== item.id
              );

            saveImportantDates();
            renderAll();
          }
        );

        list.appendChild(element);
      });
  };

  /* =======================================
     CLASSES — PINK CALENDAR REMINDERS
  ======================================= */

  const classModal =
    $("#class-modal");

  const className =
    $("#modal-class-name");

  const weeklyOptions =
    $("#weekly-class-options");

  const onceOptions =
    $("#one-time-class-options");

  const updateClassOptions = () => {
    const type = $(
      'input[name="class-repeat"]:checked'
    )?.value;

    if (type === "once") {
      hide(weeklyOptions);
      show(onceOptions);
    } else {
      show(weeklyOptions);
      hide(onceOptions);
    }
  };

  $$('input[name="class-repeat"]')
    .forEach((radio) => {
      radio.addEventListener(
        "change",
        updateClassOptions
      );
    });

  $("#add-class-button")
    ?.addEventListener(
      "click",
      () => {
        className.value =
          $("#class-input")?.value.trim()
          || "";

        const weekly = $(
          'input[name="class-repeat"][value="weekly"]'
        );

        if (weekly) {
          weekly.checked = true;
        }

        updateClassOptions();
        openModal(classModal);
      }
    );

  $("#class-input")
    ?.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          $("#add-class-button")?.click();
        }
      }
    );

  $("#close-class-modal")
    ?.addEventListener(
      "click",
      () => closeModal(classModal)
    );

  $("#confirm-class-button")
    ?.addEventListener(
      "click",
      () => {
        const name =
          className.value.trim();

        const repeat = $(
          'input[name="class-repeat"]:checked'
        )?.value || "weekly";

        if (!name) {
          alert(
            "Please enter a class name."
          );
          return;
        }

        const entry = {
          id: createId(),
          name,
          repeat
        };

        if (repeat === "weekly") {
          entry.weekday = Number(
            $("#class-weekday").value
          );
        } else {
          entry.date =
            $("#class-date").value;

          if (!entry.date) {
            alert(
              "Choose a date for this class."
            );
            return;
          }
        }

        classes.push(entry);

        saveClasses();
        closeModal(classModal);

        className.value = "";
        $("#class-input").value = "";
        $("#class-date").value = "";

        renderCalendar();
        notify("Class added to calendar!");
      }
    );

  /* =======================================
     CALENDAR
  ======================================= */

  const now = new Date();

  let displayedYear =
    now.getFullYear();

  let displayedMonth =
    now.getMonth();

  const getClassesForDate = (date) =>
    classes.filter((item) => {
      const repeat =
        item.repeat || item.type;

      if (repeat === "weekly") {
        return Number(
          item.weekday
        ) === date.getDay();
      }

      return item.date ===
        dateKey(date);
    });

  const renderCalendar = () => {
    const grid =
      $("#calendar-grid");

    const heading =
      $("#calendar-month");

    if (!grid || !heading) {
      return;
    }

    const first = new Date(
      displayedYear,
      displayedMonth,
      1
    );

    const daysInMonth =
      new Date(
        displayedYear,
        displayedMonth + 1,
        0
      ).getDate();

    const startDay =
      first.getDay();

    heading.textContent =
      first.toLocaleDateString(
        undefined,
        {
          month: "long",
          year: "numeric"
        }
      );

    grid.innerHTML = "";

    for (
      let index = 0;
      index < startDay;
      index++
    ) {
      const blank =
        document.createElement("div");

      blank.className =
        "calendar-day empty";

      grid.appendChild(blank);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const date = new Date(
        displayedYear,
        displayedMonth,
        day
      );

      const key =
        dateKey(date);

      const cell =
        document.createElement("div");

      cell.className =
        "calendar-day";

      if (key === todayKey()) {
        cell.classList.add("today");
      }

      const number =
        document.createElement("div");

      number.className =
        "calendar-date-number";

      number.textContent = day;

      cell.appendChild(number);

      // Tasks

      tasks
        .filter(
          (task) =>
            task.dueDate === key
        )
        .forEach((task) => {
          const element =
            document.createElement("span");

          element.className =
            `calendar-task ${
              getPriority(task.dueDate)
            }`;

          if (task.completed) {
            element.classList.add(
              "completed"
            );
          }

          element.textContent =
            task.name;

          element.title =
            task.name;

          cell.appendChild(element);
        });

      // Important dates

      importantDates
        .filter(
          (item) =>
            item.date === key
        )
        .forEach((item) => {
          const element =
            document.createElement("span");

          element.className =
            `calendar-important-date ${
              item.type || "school-work"
            }`;

          element.textContent =
            item.name;

          element.title =
            item.name;

          cell.appendChild(element);
        });

      // Pink classes

      getClassesForDate(date)
        .forEach((item) => {
          const element =
            document.createElement("span");

          const repeat =
            item.repeat || item.type;

          element.className =
            `calendar-class ${
              repeat === "weekly"
                ? "weekly"
                : "one-time"
            }`;

          element.textContent =
            item.name;

          element.title =
            item.name;

          cell.appendChild(element);
        });

      grid.appendChild(cell);
    }
  };

  $("#previous-month")
    ?.addEventListener(
      "click",
      () => {
        displayedMonth--;

        if (displayedMonth < 0) {
          displayedMonth = 11;
          displayedYear--;
        }

        renderCalendar();
      }
    );

  $("#next-month")
    ?.addEventListener(
      "click",
      () => {
        displayedMonth++;

        if (displayedMonth > 11) {
          displayedMonth = 0;
          displayedYear++;
        }

        renderCalendar();
      }
    );

  /* =======================================
     LOCK-IN SESSION
     NO BLUETOOTH REQUIRED
  ======================================= */

  const lockinModal =
    $("#lockin-modal");

  const timeOptions =
    $("#lockin-time-options");

  const customSection =
    $("#custom-time-section");

  const roomClearSection =
    $("#room-clear-section");

  const lockinDescription =
    $("#lockin-description");

  let selectedLockinMinutes = null;

  let lockinTimer = null;
  let lockinEndTime = null;
  let lockinWindow = null;

  const resetLockinModal = () => {
    selectedLockinMinutes = null;

    show(timeOptions);
    hide(customSection);
    hide(roomClearSection);

    if (lockinDescription) {
      lockinDescription.textContent =
        "How long are we locking in?";
    }

    const customInput =
      $("#custom-time-input");

    if (customInput) {
      customInput.value = "";
    }
  };

  $("#lockin-button")
    ?.addEventListener(
      "click",
      () => {
        resetLockinModal();
        openModal(lockinModal);
      }
    );

  $("#close-lockin-modal")
    ?.addEventListener(
      "click",
      () => {
        closeModal(lockinModal);
        resetLockinModal();
      }
    );

  $("#custom-time-button")
    ?.addEventListener(
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

  const showRoomConfirmation = () => {
    if (
      !Number.isInteger(
        selectedLockinMinutes
      ) ||
      selectedLockinMinutes < 1 ||
      selectedLockinMinutes > 720
    ) {
      alert(
        "Choose between 1 and 720 minutes."
      );
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
  };

  $$(".lockin-time")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          selectedLockinMinutes =
            Number(
              button.dataset.minutes
            );

          showRoomConfirmation();
        }
      );
    });

  $("#start-custom-time")
    ?.addEventListener(
      "click",
      () => {
        selectedLockinMinutes =
          Number(
            $("#custom-time-input").value
          );

        showRoomConfirmation();
      }
    );

  const formatRemaining = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${
      String(minutes).padStart(2, "0")
    }:${
      String(remainingSeconds).padStart(2, "0")
    }`;
  };

  const finishLockin = () => {
    clearInterval(lockinTimer);
    lockinTimer = null;

    lockinEndTime = null;

    addTokens(25);
    notify(
      "Lock-in complete! Great work."
    );

    if (
      lockinWindow &&
      !lockinWindow.closed
    ) {
      lockinWindow.document.body.innerHTML = `
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
            <p>You earned 25 tokens.</p>
            <button
              onclick="window.close()"
              style="
                padding:14px 22px;
                border:0;
                border-radius:12px;
                background:#198f86;
                color:white;
                cursor:pointer;
              "
            >
              Close
            </button>
          </div>
        </main>
      `;
    }
  };

  const updateLockinTimer = () => {
    if (!lockinEndTime) return;

    const seconds = Math.max(
      0,
      Math.ceil(
        (
          lockinEndTime -
          Date.now()
        ) / 1000
      )
    );

    const time =
      formatRemaining(seconds);

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
  };

  const startLockinSession = () => {
    if (
      !Number.isInteger(
        selectedLockinMinutes
      ) ||
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

    const minutes =
      selectedLockinMinutes;

    closeModal(lockinModal);
    resetLockinModal();

    lockinEndTime =
      Date.now() +
      minutes * 60000;

    lockinWindow = window.open(
      "",
      "crow-lockin",
      "width=520,height=620"
    );

    if (
      lockinWindow &&
      !lockinWindow.closed
    ) {
      lockinWindow.document.open();

      lockinWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >
          <title>Lock-in Session</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;

              display: flex;
              align-items: center;
              justify-content: center;

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
                0 20px 60px
                rgba(20, 60, 50, 0.1);
            }

            h1 {
              font-size: 25px;
            }

            #focus-countdown {
              margin: 35px 0;

              color: #198f86;

              font-size: 65px;
              font-weight: 800;
              letter-spacing: -2px;
            }

            p {
              color: #72848b;
              line-height: 1.7;
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
              ${formatRemaining(
                minutes * 60
              )}
            </div>

            <p>
              Keep distracting devices away
              until your session is complete.
            </p>
          </div>
        </body>
        </html>
      `);

      lockinWindow.document.close();
    } else {
      notify(
        "Focus session started. Allow popups to view the timer."
      );
    }

    updateLockinTimer();

    lockinTimer = setInterval(
      updateLockinTimer,
      1000
    );
  };

  $("#confirm-room-clear")
    ?.addEventListener(
      "click",
      startLockinSession
    );

  
    /* =========================================
    FLOATING TODAY'S TASKS
    ========================================= */

    const todayPanel = document.createElement("aside");

    todayPanel.id = "today-floating-panel";

    todayPanel.innerHTML = `
    <div class="today-panel-header">
        <strong>📋 Today's Tasks</strong>

        <div class="today-panel-actions">
        <button
            id="today-pip-button"
            type="button"
            title="Float outside this tab"
        >
            ↗
        </button>

        <button
            id="today-minimize-button"
            type="button"
            title="Minimize"
        >
            −
        </button>

        <button
            id="today-close-button"
            type="button"
            title="Close"
        >
            ✕
        </button>
        </div>
    </div>

    <div id="today-panel-body"></div>
    `;

    document.body.appendChild(todayPanel);

    let todayPanelOpen = false;
    let todayPanelMinimized = false;
    let todayPipWindow = null;

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
        a.dueDate.localeCompare(b.dueDate)
        );
    }

    function renderTodayPanel() {
    const body = todayPanel.querySelector(
        "#today-panel-body"
    );

    const relevant = getTodayTasks();

    if (!relevant.length) {
        body.innerHTML = `
        <p class="today-panel-empty">
            No tasks due today or overdue. 🎉
        </p>
        `;
    } else {
        body.innerHTML = relevant.map((task) => {
        const overdue =
            task.dueDate < todayKey();

        return `
            <label class="today-panel-task ${
            overdue ? "is-overdue" : ""
            }">
            <input
                type="checkbox"
                data-task-id="${escapeHTML(task.id)}"
                ${task.completed ? "checked" : ""}
            >

            <span>
                <strong>
                ${escapeHTML(task.name)}
                </strong>

                <small>
                ${
                    overdue
                    ? "⚠️ Overdue: "
                    : "Due today: "
                }
                ${escapeHTML(
                    formatDate(task.dueDate)
                )}
                </small>
            </span>
            </label>
        `;
        }).join("");
    }

    body.querySelectorAll(
        'input[data-task-id]'
    ).forEach((checkbox) => {
        checkbox.addEventListener(
        "change",
        () => {
            const task = tasks.find(
            (item) =>
                String(item.id) ===
                checkbox.dataset.taskId
            );

            if (!task) return;

            task.completed = checkbox.checked;

            if (
            task.completed &&
            !task.coinAwarded
            ) {
            task.coinAwarded = true;
            addTokens(1);
            }

            saveTasks();
            renderAll();
        }
        );
    });

    // Update the separate floating window too.
    if (
        todayPipWindow &&
        !todayPipWindow.closed
    ) {
        const pipBody =
        todayPipWindow.document.getElementById(
            "pip-tasks"
        );

        if (pipBody) {
        pipBody.innerHTML =
            relevant.length
            ? relevant.map((task) => `
                <div class="pip-task">
                    <strong>
                    ${escapeHTML(task.name)}
                    </strong>
                    <small>
                    ${escapeHTML(
                        formatDate(task.dueDate)
                    )}
                    ${
                        task.completed
                        ? " · Complete"
                        : task.dueDate < todayKey()
                            ? " · Overdue"
                            : " · Due today"
                    }
                    </small>
                </div>
                `).join("")
            : "<p>All clear! 🎉</p>";
        }
    }
    }

    function setTodayPanelOpen(open) {
    todayPanelOpen = open;

    todayPanel.classList.toggle(
        "open",
        open
    );

    if (open) {
        renderTodayPanel();
    }
    }

    $("#daily-tasks-button")?.addEventListener(
    "click",
    () => {
        setTodayPanelOpen(!todayPanelOpen);
    }
    );

    $("#today-close-button").addEventListener(
    "click",
    () => setTodayPanelOpen(false)
    );

    $("#today-minimize-button").addEventListener(
    "click",
    () => {
        todayPanelMinimized =
        !todayPanelMinimized;

        todayPanel.classList.toggle(
        "minimized",
        todayPanelMinimized
        );

        $("#today-minimize-button").textContent =
        todayPanelMinimized ? "+" : "−";
    }
    );

    /* =========================================
    PICTURE-IN-PICTURE WINDOW
    ========================================= */

    $("#today-pip-button").addEventListener(
    "click",
    async () => {
        if (!("documentPictureInPicture" in window)) {
        alert(
            "Your browser doesn't support " +
            "floating document windows. " +
            "You can still use the sidebar panel."
        );
        return;
        }

        try {
        if (
            todayPipWindow &&
            !todayPipWindow.closed
        ) {
            todayPipWindow.focus();
            return;
        }

        todayPipWindow =
            await window.documentPictureInPicture
            .requestWindow({
                width: 350,
                height: 450
            });

        const doc = todayPipWindow.document;

        doc.title = "Today's Tasks";

        const style =
            doc.createElement("style");

        style.textContent = `
            body {
            margin: 0;
            padding: 18px;
            background: #f6f7f7;
            color: #1d303b;
            font-family: Arial, sans-serif;
            }

            h2 {
            margin: 0 0 16px;
            font-size: 19px;
            }

            .pip-task {
            padding: 13px;
            margin-bottom: 9px;
            background: white;
            border-radius: 12px;
            }

            strong, small {
            display: block;
            }

            small {
            margin-top: 6px;
            color: #78878e;
            }
        `;

        doc.head.appendChild(style);

        doc.body.innerHTML = `
            <h2>📋 Today's Tasks</h2>
            <div id="pip-tasks"></div>
        `;

        renderTodayPanel();

        } catch (error) {
        console.warn(
            "Picture-in-Picture unavailable:",
            error
        );
        }
    }
    );


  /* =======================================
     MODAL BACKDROP AND ESCAPE
  ======================================= */

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
    AUTOMATIC OVERDUE PENALTIES
    -1 COIN PER OVERDUE TASK PER DAY
    ========================================= */

    const MS_PER_DAY = 86400000;

    function dayNumber(value) {
    const [year, month, day] =
        value.split("-").map(Number);

    return Math.floor(
        Date.UTC(year, month - 1, day) /
        MS_PER_DAY
    );
    }

    function applyOverduePenalties() {
    const today = todayKey();
    const todayNumber = dayNumber(today);

    let totalPenalty = 0;
    let changed = false;

    tasks.forEach((task) => {
        // Completed tasks stop receiving penalties.
        if (task.completed || !task.dueDate) {
        return;
        }

        // A task isn't overdue on its due date.
        if (task.dueDate >= today) {
        return;
        }

        const dueNumber =
        dayNumber(task.dueDate);

        // Never penalize before the task existed.
        const createdDate = task.createdAt
        ? dateKey(new Date(task.createdAt))
        : task.dueDate;

        const createdNumber =
        dayNumber(createdDate);

        const lastPenaltyNumber =
        task.lastPenaltyDate
            ? dayNumber(task.lastPenaltyDate)
            : Math.max(
                dueNumber,
                createdNumber
            );

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
        `Overdue penalty: -${totalPenalty} coin${
            totalPenalty === 1 ? "" : "s"
        }`
        );
    }
    }


  /* =======================================
     RENDER ALL
  ======================================= */

    const renderAll = () => {
    applyOverduePenalties();

    renderTasks();
    renderImportantDates();
    renderProgress();
    renderCalendar();
    updateGreeting();
    updateTokens();
    renderTodayPanel();
    };

    // Refresh every 30 seconds.
    setInterval(() => {
    renderAll();
    }, 30000);

    // Refresh immediately when returning to the tab.
    document.addEventListener(
    "visibilitychange",
    () => {
        if (!document.hidden) {
        renderAll();
        }
    }
    );

    // Refresh when the window receives focus.
    window.addEventListener(
    "focus",
    () => {
        renderAll();
    }
    );

    // Refresh when another app tab changes storage.
    window.addEventListener(
    "storage",
    (event) => {
        if (event.key === "crowTasks") {
        tasks = storage.get("crowTasks", []);
        renderAll();
        }

        if (event.key === "crowTokens") {
        tokens = Number(
            storage.get("crowTokens", 0)
        );
        updateTokens();
        }
    }
    );


  /* =======================================
     INITIALIZE
  ======================================= */

  updateClassOptions();
  renderAll();

  notify(
    "Welcome to Crow's Task Tracker!"
  );

});
