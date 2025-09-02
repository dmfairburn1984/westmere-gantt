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
    zoom: true  //
});

// Initialize
gantt.init("gantt_here");

// CORRECT URL - No .git references!
const API_ENDPOINT = '/api/tasks';

function loadTasks() {
    console.log('Attempting to load tasks from:', API_ENDPOINT);
    console.log('Current URL:', window.location.href);  // ← Add this
    
    fetch(API_ENDPOINT)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);  // ← Add this
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Tasks loaded successfully:', data);
            console.log('Data type:', typeof data);  // ← Add this
            console.log('Data keys:', Object.keys(data));  // ← Add this
            if (data && data.tasks) {
                console.log('Number of tasks:', data.tasks.length);
                gantt.parse(data);
                updateStatistics();
                addYearClasses();
            } else {
                console.error('Invalid data format:', data);
            }
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            console.error('Error stack:', error.stack);  // ← Add this
            loadTestData();
        });
}
// Test data fallback
function loadTestData() {
    console.log('Loading test data as fallback...');
    const testData = {
        tasks: [
            {
                id: "test1",
                text: "Test Task - Check tasks.json",
                start_date: "2025-09-01",
                duration: 5,
                progress: 0.5,
                type: "task"
            }
        ],
        links: []
    };
    gantt.parse(testData);
    alert('Failed to load project data. Showing test data. Please check that tasks.json exists in the root directory.');
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

window.zoomToFit = function() {
    try {
        if (gantt.ext && gantt.ext.zoom) {
            gantt.ext.zoom.zoomToFit();
        } else {
            console.error('Zoom extension not available');
        }
    } catch (error) {
        console.error('Errofunction loadTasks() {r with zoom:', error);
    }
}

window.exportToExcel = function() {
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

window.showCriticalPath = function() {
    gantt.config.highlight_critical_path = !gantt.config.highlight_critical_path;
    gantt.render();
}

window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

window.filterByYear = function() {
    const year = document.getElementById("yearFilter").value;
    
    if (year === "all") {
        loadTasks();
    } else {
        fetch(API_ENDPOINT)
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

console.log('App.js loaded successfully');
console.log('API Endpoint:', API_ENDPOINT);