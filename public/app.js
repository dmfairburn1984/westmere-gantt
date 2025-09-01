// Initialize Gantt
gantt.config.date_format = "%Y-%m-%d";
gantt.config.grid_width = 450;
gantt.config.row_height = 30;
gantt.config.scale_height = 80;

// Configure columns
gantt.config.columns = [
    {name: "text", label: "Task name", tree: true, width: 250},
    {name: "start_date", label: "Start", align: "center", width: 80},
    {name: "duration", label: "Duration", align: "center", width: 60},
    {name: "progress", label: "Progress", align: "center", width: 60, template: function(task) {
        return Math.round(task.progress * 100) + "%";
    }}
];

// Configure scales
gantt.config.scales = [
    {unit: "year", step: 1, format: "%Y"},
    {unit: "month", step: 1, format: "%M"},
    {unit: "week", step: 1, format: "Week %W"}
];

// Enable features
gantt.plugins({
    critical_path: true,
    marker: true,
    fullscreen: true,
    export_api: true
});

// Initialize
gantt.init("gantt_here");

// Load tasks
fetch('/api/tasks')
    .then(response => response.json())
    .then(data => {
        gantt.parse(data);
        updateStatistics();
        addYearClasses();
    })
    .catch(error => {
        // Fallback to local tasks.json
        fetch('/tasks.json')
            .then(response => response.json())
            .then(data => {
                gantt.parse(data);
                updateStatistics();
                addYearClasses();
            });
    });

// Add year-specific CSS classes
function addYearClasses() {
    gantt.eachTask(function(task) {
        const year = new Date(task.start_date).getFullYear();
        if (year === 2025 || year === 2026) task.$custom_class = "year1";
        else if (year === 2026 || year === 2027) task.$custom_class = "year2";
        else if (year === 2027 || year === 2028) task.$custom_class = "year3";
        else if (year === 2028 || year === 2029) task.$custom_class = "year4";
    });
    gantt.render();
}

// Update statistics
function updateStatistics() {
    let total = 0, completed = 0, inProgress = 0, critical = 0;
    let totalProgress = 0;
    
    gantt.eachTask(function(task) {
        if (task.type !== "phase") {
            total++;
            totalProgress += task.progress || 0;
            
            if (task.progress >= 1) completed++;
            else if (task.progress > 0) inProgress++;
            
            if (task.priority === "critical") critical++;
        }
    });
    
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("inProgressTasks").textContent = inProgress;
    document.getElementById("criticalTasks").textContent = critical;
    document.getElementById("overallProgress").textContent = 
        total > 0 ? Math.round((totalProgress / total) * 100) + "%" : "0%";
}

// Control functions
function zoomToFit() {
    gantt.ext.zoom.zoomToFit();
}

function exportToExcel() {
    gantt.exportToExcel({
        name: "westmere_factory_development.xlsx",
        columns: [
            { id: "text", header: "Task", width: 300 },
            { id: "start_date", header: "Start Date", width: 150 },
            { id: "end_date", header: "End Date", width: 150 },
            { id: "duration", header: "Duration", width: 100 },
            { id: "progress", header: "Progress", width: 100 },
            { id: "priority", header: "Priority", width: 100 }
        ]
    });
}

function showCriticalPath() {
    gantt.config.highlight_critical_path = !gantt.config.highlight_critical_path;
    gantt.render();
}

function toggleFullscreen() {
    gantt.ext.fullscreen.toggle();
}

function filterByYear() {
    const year = document.getElementById("yearFilter").value;
    
    gantt.clearAll();
    
    fetch('/api/tasks')
        .then(response => response.json())
        .then(data => {
            if (year === "all") {
                gantt.parse(data);
            } else {
                const filteredTasks = data.tasks.filter(task => {
                    const taskYear = new Date(task.start_date).getFullYear();
                    return taskYear.toString() === year || 
                           taskYear.toString() === (parseInt(year) + 1).toString();
                });
                gantt.parse({tasks: filteredTasks, links: data.links});
            }
            updateStatistics();
            addYearClasses();
        });
}

// Auto-save functionality
let saveTimeout;
gantt.attachEvent("onAfterTaskUpdate", function(id, task) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        // In production, this would save to server
        console.log("Task updated:", task);
    }, 1000);
});

// Add today marker
const today = new Date();
gantt.addMarker({
    start_date: today,
    css: "today",
    text: "Today",
    title: today.toDateString()
});