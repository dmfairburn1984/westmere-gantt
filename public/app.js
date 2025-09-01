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
    fullscreen: true
});

// Initialize
gantt.init("gantt_here");

// Load tasks with proper error handling
function loadTasks() {
    fetch('/api/tasks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load tasks from API');
            }
            return response.json();
        })
        .then(data => {
            console.log('Tasks loaded successfully:', data.tasks ? data.tasks.length : 0, 'tasks');
            gantt.parse(data);
            updateStatistics();
            addYearClasses();
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            // Show error message to user
            alert('Error loading project data. Please refresh the page or contact support.');
        });
}

// Load tasks on page load
loadTasks();

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
    // Create CSV content
    let csvContent = "Task Name,Start Date,End Date,Duration,Progress,Priority\n";
    
    gantt.eachTask(function(task) {
        csvContent += `"${task.text}",${task.start_date},${task.end_date || ''},${task.duration},${Math.round(task.progress * 100)}%,${task.priority || 'normal'}\n`;
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'westmere_factory_development.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showCriticalPath() {
    gantt.config.highlight_critical_path = !gantt.config.highlight_critical_path;
    gantt.render();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function filterByYear() {
    const year = document.getElementById("yearFilter").value;
    
    if (year === "all") {
        loadTasks();
    } else {
        fetch('/api/tasks')
            .then(response => response.json())
            .then(data => {
                const filteredTasks = data.tasks.filter(task => {
                    const taskYear = new Date(task.start_date).getFullYear();
                    const yearNum = parseInt(year);
                    return taskYear === yearNum || taskYear === (yearNum + 1);
                });
                
                gantt.clearAll();
                gantt.parse({tasks: filteredTasks, links: data.links});
                updateStatistics();
                addYearClasses();
            })
            .catch(error => {
                console.error('Error filtering tasks:', error);
            });
    }
}

// Auto-save functionality (for future implementation)
gantt.attachEvent("onAfterTaskUpdate", function(id, task) {
    console.log("Task updated:", task);
    // In production, this would save to server
    // fetch('/api/tasks/' + id, { method: 'PUT', body: JSON.stringify(task) })
});

// Add today marker
const today = new Date();
gantt.addMarker({
    start_date: today,
    css: "today",
    text: "Today",
    title: today.toDateString()
});

// Add custom styling for today marker
const style = document.createElement('style');
style.textContent = `
    .today {
        background-color: #ff5722;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);