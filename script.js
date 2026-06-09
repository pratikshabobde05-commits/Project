// script.js - updated with reminders and browser notifications
let tasksArray = [];
let routineArray = [];
let currentEditId = null;
let calendarTasks = {};
let remindersArray = [];
let currentDate = new Date();
let selectedDate = new Date();
let progressChart = null;
let currentChartMode = 'weekly';
let notificationInterval = null;

// auth
const validUser = "pratiksha";
const validPass = "12345";

// DOM elements
const loginContainer = document.getElementById("loginContainer");
const appContainer = document.getElementById("appContainer");
const loginBtn = document.getElementById("loginBtn");
const logoutBtnSide = document.getElementById("logoutBtnSide");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const navBtns = document.querySelectorAll(".nav-btn");
const dashboardTab = document.getElementById("dashboardTab");
const tasksTab = document.getElementById("tasksTab");
const routineTab = document.getElementById("routineTab");
const calendarTab = document.getElementById("calendarTab");
const remindersTab = document.getElementById("remindersTab");

const taskListContainer = document.getElementById("taskListContainer");
const addNewTaskBtn = document.getElementById("addNewTaskBtn");
const searchTask = document.getElementById("searchTask");
const filterStatus = document.getElementById("filterStatus");
const totalTasksSpan = document.getElementById("totalTasksCount");
const completedTasksSpan = document.getElementById("completedTasksCount");
const pendingTasksSpan = document.getElementById("pendingTasksCount");

const taskModal = document.getElementById("taskModal");
const modalTitle = document.getElementById("modalTitle");
const taskTitleInput = document.getElementById("taskTitleInput");
const taskPriority = document.getElementById("taskPriority");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const closeModalSpan = document.querySelector(".close-modal");

const routineListDiv = document.getElementById("routineList");
const addRoutineBtn = document.getElementById("addRoutineBtn");
const newRoutineActivity = document.getElementById("newRoutineActivity");
const newRoutineTime = document.getElementById("newRoutineTime");
const resetDefaultRoutine = document.getElementById("resetDefaultRoutine");

const liveDateTimeSpan = document.getElementById("liveDateTime");

// calendar elements
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const currentMonthYear = document.getElementById("currentMonthYear");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateText = document.getElementById("selectedDateText");
const dateTasksList = document.getElementById("dateTasksList");
const calendarTaskInput = document.getElementById("calendarTaskInput");
const calendarTaskPriority = document.getElementById("calendarTaskPriority");
const addTaskForDateBtn = document.getElementById("addTaskForDateBtn");

// chart elements
const weeklyChartBtn = document.getElementById("weeklyChartBtn");
const monthlyChartBtn = document.getElementById("monthlyChartBtn");
const chartStats = document.getElementById("chartStats");

// reminder elements
const reminderTaskSelect = document.getElementById("reminderTaskSelect");
const reminderDateTime = document.getElementById("reminderDateTime");
const addReminderBtn = document.getElementById("addReminderBtn");
const remindersList = document.getElementById("remindersList");
const pastRemindersList = document.getElementById("pastRemindersList");
const requestNotificationBtn = document.getElementById("requestNotificationBtn");
const toastContainer = document.getElementById("toastContainer");

// ---------- helper functions ----------
function showToast(message) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body: body, icon: "🔔" });
        showToast(`🔔 ${title}: ${body}`);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body: body });
                showToast(`🔔 ${title}`);
            }
        });
    } else {
        showToast(`⏰ Reminder: ${title} - ${body}`);
    }
}

function checkReminders() {
    let now = new Date();
    let updatedReminders = [];
    let triggeredReminders = [];
    
    for(let reminder of remindersArray) {
        let reminderTime = new Date(reminder.datetime);
        if(reminderTime <= now && !reminder.triggered) {
            reminder.triggered = true;
            reminder.triggeredAt = now.toISOString();
            triggeredReminders.push(reminder);
            sendNotification("Task Reminder", `Time to do: ${reminder.taskTitle}`);
        }
        updatedReminders.push(reminder);
    }
    
    if(triggeredReminders.length > 0) {
        remindersArray = updatedReminders;
        saveRemindersToLocal();
        renderReminders();
    }
}

function startNotificationChecker() {
    if(notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        checkReminders();
    }, 30000);
}

function updateDateTime() {
    let now = new Date();
    let dateStr = now.toLocaleDateString(undefined, { day:'numeric', month:'short' }) + " " + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    if(liveDateTimeSpan) liveDateTimeSpan.innerText = dateStr;
    checkReminders();
}
setInterval(updateDateTime, 1000);
updateDateTime();

function loadData() {
    let storedTasks = localStorage.getItem("studentTasks");
    if(storedTasks) {
        tasksArray = JSON.parse(storedTasks);
    } else {
        tasksArray = [
            { id: Date.now()+1, title: "Complete DSA assignment", priority: "High", completed: false, createdAt: new Date().toISOString() },
            { id: Date.now()+2, title: "Read JavaScript notes", priority: "Medium", completed: true, createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
            { id: Date.now()+3, title: "Submit college project", priority: "High", completed: false, createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() }
        ];
        saveTasksToLocal();
    }

    let storedRoutine = localStorage.getItem("dailyRoutine");
    if(storedRoutine) {
        routineArray = JSON.parse(storedRoutine);
    } else {
        routineArray = [
            { id: 101, activity: "🌅 Wake Up", time: "06:30 AM" },
            { id: 102, activity: "📖 Study / Lectures", time: "09:00 AM" },
            { id: 103, activity: "🏋️ Exercise", time: "05:00 PM" },
            { id: 104, activity: "🍛 Lunch", time: "01:00 PM" },
            { id: 105, activity: "💻 Coding Practice", time: "07:00 PM" }
        ];
        saveRoutineToLocal();
    }
    
    let storedCalendar = localStorage.getItem("calendarTasks");
    if(storedCalendar) {
        calendarTasks = JSON.parse(storedCalendar);
    } else {
        calendarTasks = {};
        let today = new Date().toISOString().split('T')[0];
        let yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        calendarTasks[today] = [
            { id: Date.now(), title: "Attend college meeting", priority: "Medium", completed: false }
        ];
        calendarTasks[yesterday] = [
            { id: Date.now()+100, title: "Submit assignment", priority: "High", completed: true }
        ];
        saveCalendarToLocal();
    }
    
    let storedReminders = localStorage.getItem("taskReminders");
    if(storedReminders) {
        remindersArray = JSON.parse(storedReminders);
    } else {
        remindersArray = [];
        let sampleDate = new Date();
        sampleDate.setHours(sampleDate.getHours() + 1);
        remindersArray.push({
            id: Date.now(),
            taskId: tasksArray[0]?.id,
            taskTitle: tasksArray[0]?.title || "Sample Task",
            datetime: sampleDate.toISOString(),
            triggered: false
        });
        saveRemindersToLocal();
    }
}

function saveTasksToLocal() {
    localStorage.setItem("studentTasks", JSON.stringify(tasksArray));
}

function saveRoutineToLocal() {
    localStorage.setItem("dailyRoutine", JSON.stringify(routineArray));
}

function saveCalendarToLocal() {
    localStorage.setItem("calendarTasks", JSON.stringify(calendarTasks));
}

function saveRemindersToLocal() {
    localStorage.setItem("taskReminders", JSON.stringify(remindersArray));
}

function updateDashboard() {
    let total = tasksArray.length;
    let completed = tasksArray.filter(t => t.completed === true).length;
    let pending = total - completed;
    if(totalTasksSpan) totalTasksSpan.innerText = total;
    if(completedTasksSpan) completedTasksSpan.innerText = completed;
    if(pendingTasksSpan) pendingTasksSpan.innerText = pending;
}

// CHART FUNCTIONS
function getWeeklyData() {
    let weeklyData = [];
    let labels = [];
    let today = new Date();
    
    for(let i = 6; i >= 0; i--) {
        let date = new Date(today);
        date.setDate(today.getDate() - i);
        let dateStr = date.toISOString().split('T')[0];
        let dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
        labels.push(dayName);
        
        let tasksForDay = calendarTasks[dateStr] || [];
        let completed = tasksForDay.filter(t => t.completed === true).length;
        let total = tasksForDay.length;
        weeklyData.push({ completed, total, date: dateStr });
    }
    
    return { labels, data: weeklyData };
}

function getMonthlyData() {
    let monthlyData = [];
    let labels = [];
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    
    let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for(let i = 1; i <= daysInMonth; i++) {
        let date = new Date(currentYear, currentMonth, i);
        let dateStr = date.toISOString().split('T')[0];
        labels.push(i);
        
        let tasksForDay = calendarTasks[dateStr] || [];
        let completed = tasksForDay.filter(t => t.completed === true).length;
        let total = tasksForDay.length;
        monthlyData.push({ completed, total, date: dateStr, day: i });
    }
    
    return { labels, data: monthlyData };
}

function renderProgressChart(mode) {
    let ctx = document.getElementById('progressChart').getContext('2d');
    let chartData, chartLabels, title;
    
    if(mode === 'weekly') {
        let weekly = getWeeklyData();
        chartLabels = weekly.labels;
        chartData = weekly.data;
        title = 'Weekly Task Completion (Last 7 days)';
        
        let totalCompleted = chartData.reduce((sum, d) => sum + d.completed, 0);
        let totalTasks = chartData.reduce((sum, d) => sum + d.total, 0);
        let completionRate = totalTasks > 0 ? ((totalCompleted / totalTasks) * 100).toFixed(1) : 0;
        chartStats.innerHTML = `<p>📊 This week: ${totalCompleted}/${totalTasks} tasks completed (${completionRate}%)</p>`;
    } else {
        let monthly = getMonthlyData();
        chartLabels = monthly.labels;
        chartData = monthly.data;
        title = 'Monthly Task Completion';
        
        let totalCompleted = chartData.reduce((sum, d) => sum + d.completed, 0);
        let totalTasks = chartData.reduce((sum, d) => sum + d.total, 0);
        let completionRate = totalTasks > 0 ? ((totalCompleted / totalTasks) * 100).toFixed(1) : 0;
        chartStats.innerHTML = `<p>📅 This month: ${totalCompleted}/${totalTasks} tasks completed (${completionRate}%)</p>`;
    }
    
    if(progressChart) {
        progressChart.destroy();
    }
    
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: chartData.map(d => d.completed),
                    backgroundColor: '#e8436e',
                    borderRadius: 8,
                    barPercentage: 0.7
                },
                {
                    label: 'Total Tasks',
                    data: chartData.map(d => d.total),
                    backgroundColor: '#ffb7c5',
                    borderRadius: 8,
                    barPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 12 } }
                },
                title: {
                    display: true,
                    text: title,
                    font: { size: 14, weight: 'bold' },
                    color: '#e8436e'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Tasks', font: { size: 11 } },
                    grid: { color: '#ffe0e8' }
                },
                x: {
                    title: { display: true, text: mode === 'weekly' ? 'Day' : 'Date', font: { size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function switchChartMode(mode) {
    currentChartMode = mode;
    if(mode === 'weekly') {
        weeklyChartBtn.classList.add('active');
        monthlyChartBtn.classList.remove('active');
    } else {
        weeklyChartBtn.classList.remove('active');
        monthlyChartBtn.classList.add('active');
    }
    renderProgressChart(mode);
}

function updateReminderTaskSelect() {
    reminderTaskSelect.innerHTML = '<option value="">Select a task...</option>';
    let pendingTasks = tasksArray.filter(t => !t.completed);
    pendingTasks.forEach(task => {
        let option = document.createElement("option");
        option.value = task.id;
        option.textContent = `${task.title} (${task.priority})`;
        reminderTaskSelect.appendChild(option);
    });
}

function renderReminders() {
    let now = new Date();
    let upcoming = remindersArray.filter(r => !r.triggered);
    let past = remindersArray.filter(r => r.triggered);
    
    upcoming.sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
    
    if(upcoming.length === 0) {
        remindersList.innerHTML = '<div style="padding:20px; text-align:center; color:#b99">No upcoming reminders ✨</div>';
    } else {
        remindersList.innerHTML = '';
        upcoming.forEach(reminder => {
            let reminderDiv = document.createElement("div");
            reminderDiv.className = "reminder-item";
            let reminderDate = new Date(reminder.datetime);
            let timeLeft = Math.ceil((reminderDate - now) / (1000 * 60));
            let timeText = timeLeft > 0 ? `in ${timeLeft} minutes` : "soon";
            reminderDiv.innerHTML = `
                <div class="reminder-info">
                    <div class="reminder-task">📌 ${escapeHtml(reminder.taskTitle)}</div>
                    <div class="reminder-time">⏰ ${reminderDate.toLocaleString()} (${timeText})</div>
                </div>
                <button class="delete-reminder-btn" data-id="${reminder.id}">🗑️</button>
            `;
            remindersList.appendChild(reminderDiv);
        });
    }
    
    if(past.length === 0) {
        pastRemindersList.innerHTML = '<div style="padding:20px; text-align:center; color:#b99">No past reminders</div>';
    } else {
        pastRemindersList.innerHTML = '';
        past.slice(-5).forEach(reminder => {
            let reminderDiv = document.createElement("div");
            reminderDiv.className = "past-reminder-item";
            let triggeredDate = reminder.triggeredAt ? new Date(reminder.triggeredAt) : new Date(reminder.datetime);
            reminderDiv.innerHTML = `
                <div class="reminder-info">
                    <div class="reminder-task">✅ ${escapeHtml(reminder.taskTitle)}</div>
                    <div class="reminder-time">⏰ Completed at: ${triggeredDate.toLocaleString()}</div>
                </div>
            `;
            pastRemindersList.appendChild(reminderDiv);
        });
    }
    
    document.querySelectorAll(".delete-reminder-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let id = parseInt(btn.getAttribute("data-id"));
            if(confirm("Delete this reminder?")) {
                remindersArray = remindersArray.filter(r => r.id !== id);
                saveRemindersToLocal();
                renderReminders();
            }
        });
    });
}

function addReminder() {
    let taskId = parseInt(reminderTaskSelect.value);
    if(!taskId) {
        alert("Please select a task");
        return;
    }
    let datetime = reminderDateTime.value;
    if(!datetime) {
        alert("Please select date and time");
        return;
    }
    
    let task = tasksArray.find(t => t.id === taskId);
    if(!task) {
        alert("Task not found");
        return;
    }
    
    let reminderTime = new Date(datetime);
    if(reminderTime <= new Date()) {
        alert("Please select a future time");
        return;
    }
    
    let newReminder = {
        id: Date.now(),
        taskId: taskId,
        taskTitle: task.title,
        datetime: reminderTime.toISOString(),
        triggered: false
    };
    
    remindersArray.push(newReminder);
    saveRemindersToLocal();
    renderReminders();
    reminderDateTime.value = "";
    reminderTaskSelect.value = "";
    showToast(`Reminder set for "${task.title}" at ${reminderTime.toLocaleString()}`);
}

function requestNotificationPermission() {
    if (Notification.permission === "granted") {
        showToast("Notifications already enabled! ✅");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showToast("Notifications enabled! You'll receive reminders. 🔔");
                sendNotification("Welcome!", "Reminders are now active");
            } else {
                showToast("Notification permission denied. You'll see toast alerts instead.");
            }
        });
    } else {
        showToast("Notifications blocked. Please enable in browser settings.");
    }
}

function renderTasks() {
    if(!taskListContainer) return;
    let searchTerm = searchTask ? searchTask.value.toLowerCase() : "";
    let statusFilter = filterStatus ? filterStatus.value : "all";
    
    let filtered = tasksArray.filter(task => {
        let matchesSearch = task.title.toLowerCase().includes(searchTerm);
        let matchesStatus = true;
        if(statusFilter === "pending") matchesStatus = !task.completed;
        else if(statusFilter === "completed") matchesStatus = task.completed;
        return matchesSearch && matchesStatus;
    });
    
    if(filtered.length === 0) {
        taskListContainer.innerHTML = `<div style="padding:30px; text-align:center; color:#b38b9b;">✨ No tasks found. Add some!</div>`;
        return;
    }
    
    taskListContainer.innerHTML = "";
    filtered.forEach(task => {
        let taskCard = document.createElement("div");
        taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
        let priorityClass = task.priority === "High" ? "🔴 High" : (task.priority === "Medium" ? "🟠 Medium" : "🔵 Low");
        taskCard.innerHTML = `
            <div class="task-info">
                <input type="checkbox" class="complete-check" data-id="${task.id}" ${task.completed ? "checked" : ""}>
                <span class="task-title" style="${task.completed ? 'text-decoration:line-through; color:#a99' : ''}">${escapeHtml(task.title)}</span>
                <span class="task-priority">${priorityClass}</span>
            </div>
            <div class="task-actions">
                <button class="edit-task" data-id="${task.id}">✏️</button>
                <button class="delete-task" data-id="${task.id}">🗑️</button>
            </div>
        `;
        taskListContainer.appendChild(taskCard);
    });
    
    document.querySelectorAll(".complete-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            let id = parseInt(e.target.getAttribute("data-id"));
            let task = tasksArray.find(t => t.id === id);
            if(task) {
                task.completed = e.target.checked;
                saveTasksToLocal();
                for(let date in calendarTasks) {
                    let calTask = calendarTasks[date].find(t => t.id === id);
                    if(calTask) calTask.completed = e.target.checked;
                }
                saveCalendarToLocal();
                renderTasks();
                updateDashboard();
                renderCalendar();
                updateReminderTaskSelect();
                if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
                    renderProgressChart(currentChartMode);
                }
                if(e.target.checked) {
                    showToast(`🎉 Completed: ${task.title}`);
                }
            }
        });
    });
    
    document.querySelectorAll(".edit-task").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let id = parseInt(btn.getAttribute("data-id"));
            openEditModal(id);
        });
    });
    
    document.querySelectorAll(".delete-task").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let id = parseInt(btn.getAttribute("data-id"));
            if(confirm("Delete this task?")) {
                tasksArray = tasksArray.filter(t => t.id !== id);
                remindersArray = remindersArray.filter(r => r.taskId !== id);
                for(let date in calendarTasks) {
                    calendarTasks[date] = calendarTasks[date].filter(t => t.id !== id);
                }
                saveTasksToLocal();
                saveRemindersToLocal();
                saveCalendarToLocal();
                renderTasks();
                updateDashboard();
                renderCalendar();
                updateReminderTaskSelect();
                renderReminders();
                if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
                    renderProgressChart(currentChartMode);
                }
                showToast(`🗑️ Task deleted`);
            }
        });
    });
}

function openEditModal(id) {
    let task = tasksArray.find(t => t.id === id);
    if(task) {
        currentEditId = id;
        modalTitle.innerText = "Edit Task";
        taskTitleInput.value = task.title;
        taskPriority.value = task.priority;
        taskModal.classList.remove("hidden");
    }
}

function addNewTask() {
    currentEditId = null;
    modalTitle.innerText = "Add New Task";
    taskTitleInput.value = "";
    taskPriority.value = "Medium";
    taskModal.classList.remove("hidden");
}

function saveTaskFromModal() {
    let title = taskTitleInput.value.trim();
    if(title === "") {
        alert("Please enter task title");
        return;
    }
    let priority = taskPriority.value;
    if(currentEditId) {
        let taskIndex = tasksArray.findIndex(t => t.id === currentEditId);
        if(taskIndex !== -1) {
            tasksArray[taskIndex].title = title;
            tasksArray[taskIndex].priority = priority;
            for(let date in calendarTasks) {
                let calTask = calendarTasks[date].find(t => t.id === currentEditId);
                if(calTask) {
                    calTask.title = title;
                    calTask.priority = priority;
                }
            }
            let reminder = remindersArray.find(r => r.taskId === currentEditId);
            if(reminder) reminder.taskTitle = title;
        }
    } else {
        let newId = Date.now();
        let newTask = {
            id: newId,
            title: title,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasksArray.push(newTask);
        let today = new Date().toISOString().split('T')[0];
        if(!calendarTasks[today]) calendarTasks[today] = [];
        calendarTasks[today].push({ ...newTask });
    }
    saveTasksToLocal();
    saveCalendarToLocal();
    saveRemindersToLocal();
    closeModal();
    renderTasks();
    updateDashboard();
    renderCalendar();
    updateReminderTaskSelect();
    if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
        renderProgressChart(currentChartMode);
    }
    showToast(`✅ Task saved: ${title}`);
}

function closeModal() {
    taskModal.classList.add("hidden");
    currentEditId = null;
}

function renderRoutine() {
    if(!routineListDiv) return;
    if(routineArray.length === 0) {
        routineListDiv.innerHTML = "<div style='padding:20px; text-align:center;'>No routine set. Add some activities!</div>";
        return;
    }
    routineListDiv.innerHTML = "";
    routineArray.forEach(routine => {
        let div = document.createElement("div");
        div.className = "routine-item";
        div.innerHTML = `
            <span class="routine-time">🕒 ${escapeHtml(routine.time)}</span>
            <span class="routine-activity">${escapeHtml(routine.activity)}</span>
            <button class="delete-routine" data-id="${routine.id}">🗑️ Remove</button>
        `;
        routineListDiv.appendChild(div);
    });
    document.querySelectorAll(".delete-routine").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let id = parseInt(btn.getAttribute("data-id"));
            if(confirm("Remove this routine?")) {
                routineArray = routineArray.filter(r => r.id !== id);
                saveRoutineToLocal();
                renderRoutine();
            }
        });
    });
}

function addRoutineItem() {
    let activity = newRoutineActivity.value.trim();
    let timeVal = newRoutineTime.value;
    if(activity === "") {
        alert("Please enter activity");
        return;
    }
    let hours = parseInt(timeVal.split(":")[0]);
    let ampm = hours >= 12 ? "PM" : "AM";
    let displayHours = hours % 12 || 12;
    let displayTime = `${displayHours}:${timeVal.split(":")[1]} ${ampm}`;
    let newId = Date.now();
    routineArray.push({
        id: newId,
        activity: activity,
        time: displayTime
    });
    saveRoutineToLocal();
    renderRoutine();
    newRoutineActivity.value = "";
    newRoutineTime.value = "09:00";
    showToast(`➕ Added to routine: ${activity}`);
}

function resetDefaultRoutineFunc() {
    if(confirm("Reset routine to default?")) {
        routineArray = [
            { id: Date.now()+1, activity: "🌅 Wake Up", time: "06:30 AM" },
            { id: Date.now()+2, activity: "📖 Study / Lectures", time: "09:00 AM" },
            { id: Date.now()+3, activity: "🏋️ Exercise", time: "05:00 PM" },
            { id: Date.now()+4, activity: "🍛 Lunch", time: "01:00 PM" },
            { id: Date.now()+5, activity: "💻 Coding Practice", time: "07:00 PM" }
        ];
        saveRoutineToLocal();
        renderRoutine();
        showToast("Routine reset to default");
    }
}

// CALENDAR FUNCTIONS
function renderCalendar() {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    let firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    
    currentMonthYear.innerText = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    
    let gridHtml = '';
    let weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        gridHtml += `<div class="weekday">${day}</div>`;
    });
    
    for(let i = 0; i < startDay; i++) {
        gridHtml += `<div class="empty-day"></div>`;
    }
    
    for(let d = 1; d <= daysInMonth; d++) {
        let dateObj = new Date(year, month, d);
        let dateStr = dateObj.toISOString().split('T')[0];
        let hasTask = calendarTasks[dateStr] && calendarTasks[dateStr].length > 0;
        let isSelected = (selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d);
        let selectedClass = isSelected ? 'selected' : '';
        let taskClass = hasTask ? 'has-task' : '';
        gridHtml += `<div class="calendar-day ${selectedClass} ${taskClass}" data-date="${dateStr}">${d}</div>`;
    }
    
    calendarGrid.innerHTML = gridHtml;
    
    document.querySelectorAll('.calendar-day').forEach(dayDiv => {
        if(dayDiv.getAttribute('data-date')) {
            dayDiv.addEventListener('click', (e) => {
                let clickedDate = dayDiv.getAttribute('data-date');
                selectedDate = new Date(clickedDate);
                renderCalendar();
                showTasksForDate(clickedDate);
            });
        }
    });
    
    let todayStr = selectedDate.toISOString().split('T')[0];
    showTasksForDate(todayStr);
}

function showTasksForDate(dateStr) {
    selectedDateText.innerText = dateStr;
    let tasks = calendarTasks[dateStr] || [];
    
    if(tasks.length === 0) {
        dateTasksList.innerHTML = '<div style="padding:10px; color:#b99">No tasks for this date ✨</div>';
    } else {
        dateTasksList.innerHTML = '';
        tasks.forEach(task => {
            let taskDiv = document.createElement('div');
            taskDiv.className = 'date-task-item';
            let priorityIcon = task.priority === 'High' ? '🔴' : (task.priority === 'Medium' ? '🟠' : '🔵');
            taskDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" class="cal-task-check" data-date="${dateStr}" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <span style="${task.completed ? 'text-decoration:line-through; color:#aaa' : ''}">${priorityIcon} ${escapeHtml(task.title)}</span>
                </div>
                <button class="delete-cal-task" data-date="${dateStr}" data-id="${task.id}">🗑️</button>
            `;
            dateTasksList.appendChild(taskDiv);
        });
        
        document.querySelectorAll('.cal-task-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                let date = chk.getAttribute('data-date');
                let id = parseInt(chk.getAttribute('data-id'));
                let task = calendarTasks[date].find(t => t.id === id);
                if(task) {
                    task.completed = chk.checked;
                    saveCalendarToLocal();
                    let mainTask = tasksArray.find(t => t.id === id);
                    if(mainTask) mainTask.completed = chk.checked;
                    saveTasksToLocal();
                    showTasksForDate(date);
                    renderCalendar();
                    renderTasks();
                    updateDashboard();
                    updateReminderTaskSelect();
                    if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
                        renderProgressChart(currentChartMode);
                    }
                }
            });
        });
        
        document.querySelectorAll('.delete-cal-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let date = btn.getAttribute('data-date');
                let id = parseInt(btn.getAttribute('data-id'));
                if(confirm('Delete this task?')) {
                    calendarTasks[date] = calendarTasks[date].filter(t => t.id !== id);
                    if(calendarTasks[date].length === 0) delete calendarTasks[date];
                    saveCalendarToLocal();
                    tasksArray = tasksArray.filter(t => t.id !== id);
                    remindersArray = remindersArray.filter(r => r.taskId !== id);
                    saveTasksToLocal();
                    saveRemindersToLocal();
                    showTasksForDate(date);
                    renderCalendar();
                    renderTasks();
                    updateDashboard();
                    updateReminderTaskSelect();
                    renderReminders();
                    if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
                        renderProgressChart(currentChartMode);
                    }
                }
            });
        });
    }
}

function addTaskToSelectedDate() {
    let taskTitle = calendarTaskInput.value.trim();
    if(!taskTitle) {
        alert("Please enter task title");
        return;
    }
    let priority = calendarTaskPriority.value;
    let dateStr = selectedDate.toISOString().split('T')[0];
    let newId = Date.now();
    
    if(!calendarTasks[dateStr]) {
        calendarTasks[dateStr] = [];
    }
    calendarTasks[dateStr].push({
        id: newId,
        title: taskTitle,
        priority: priority,
        completed: false
    });
    
    tasksArray.push({
        id: newId,
        title: taskTitle,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    saveCalendarToLocal();
    saveTasksToLocal();
    calendarTaskInput.value = '';
    showTasksForDate(dateStr);
    renderCalendar();
    renderTasks();
    updateDashboard();
    updateReminderTaskSelect();
    if(document.getElementById("dashboardTab").classList.contains("active-tab")) {
        renderProgressChart(currentChartMode);
    }
    showToast(`📅 Added task for ${dateStr}`);
}

function escapeHtml(str) {
    if(!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';
        return m;
    });
}

function switchTab(tabId) {
    dashboardTab.classList.remove("active-tab");
    tasksTab.classList.remove("active-tab");
    routineTab.classList.remove("active-tab");
    calendarTab.classList.remove("active-tab");
    remindersTab.classList.remove("active-tab");
    
    if(tabId === "dashboard") dashboardTab.classList.add("active-tab");
    if(tabId === "tasks") tasksTab.classList.add("active-tab");
    if(tabId === "routine") routineTab.classList.add("active-tab");
    if(tabId === "calendar") calendarTab.classList.add("active-tab");
    if(tabId === "reminders") remindersTab.classList.add("active-tab");
    
    navBtns.forEach(btn => {
        btn.classList.remove("active");
        if(btn.getAttribute("data-tab") === tabId) btn.classList.add("active");
    });
    
    if(tabId === "tasks") renderTasks();
    if(tabId === "routine") renderRoutine();
    if(tabId === "dashboard") {
        updateDashboard();
        renderProgressChart(currentChartMode);
    }
    if(tabId === "calendar") renderCalendar();
    if(tabId === "reminders") {
        updateReminderTaskSelect();
        renderReminders();
    }
}

function handleLogin() {
    let user = loginUsername.value.trim();
    let pass = loginPassword.value.trim();
    if(user === validUser && pass === validPass) {
        loginContainer.style.display = "none";
        appContainer.style.display = "block";
        loadData();
        renderTasks();
        renderRoutine();
        updateDashboard();
        renderCalendar();
        renderProgressChart('weekly');
        updateReminderTaskSelect();
        renderReminders();
        startNotificationChecker();
        switchTab("dashboard");
        showToast("Welcome back, Pratiksha! 👋");
    } else {
        alert("Invalid credentials! Use pratiksha / 12345");
    }
}

function handleLogout() {
    if(notificationInterval) clearInterval(notificationInterval);
    loginContainer.style.display = "flex";
    appContainer.style.display = "none";
    loginUsername.value = "pratiksha";
    loginPassword.value = "12345";
    tasksArray = [];
    routineArray = [];
    calendarTasks = {};
    remindersArray = [];
    if(progressChart) progressChart.destroy();
}

// EVENT LISTENERS
loginBtn.addEventListener("click", handleLogin);
logoutBtnSide.addEventListener("click", handleLogout);
addNewTaskBtn.addEventListener("click", addNewTask);
saveTaskBtn.addEventListener("click", saveTaskFromModal);
cancelModalBtn.addEventListener("click", closeModal);
closeModalSpan.addEventListener("click", closeModal);
searchTask.addEventListener("input", () => renderTasks());
filterStatus.addEventListener("change", () => renderTasks());
addRoutineBtn.addEventListener("click", addRoutineItem);
resetDefaultRoutine.addEventListener("click", resetDefaultRoutineFunc);
prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});
addTaskForDateBtn.addEventListener("click", addTaskToSelectedDate);
weeklyChartBtn.addEventListener("click", () => switchChartMode('weekly'));
monthlyChartBtn.addEventListener("click", () => switchChartMode('monthly'));
addReminderBtn.addEventListener("click", addReminder);
requestNotificationBtn.addEventListener("click", requestNotificationPermission);

navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        let tab = btn.getAttribute("data-tab");
        switchTab(tab);
    });
});

window.addEventListener("click", (e) => {
    if(e.target === taskModal) closeModal();
});
