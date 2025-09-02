// Initialize Gantt with enhanced configuration
gantt.config.date_format = "%Y-%m-%d";
gantt.config.grid_width = 500; // Increased default width
gantt.config.row_height = 30;
gantt.config.scale_height = 80;
gantt.config.autosize = "y"; // Auto-adjust height
gantt.config.autosize_min_width = 800;
gantt.config.fit_tasks = true; // Fit tasks to screen width
gantt.config.open_tree_initially = true; // ALWAYS open expanded
gantt.config.scroll_on_click = true;
gantt.config.show_progress = true;
gantt.config.show_task_cells = true;
gantt.config.grid_resize = true; // Enable grid resizing
gantt.config.columns_resizable = true; // Enable column resizing
gantt.config.columns_movable = true; // Allow column reordering

// Configure columns with better sizing and resizing capabilities
gantt.config.columns = [
    {
        name: "text", 
        label: "Task name", 
        tree: true, 
        width: 300, // Increased width
        min_width: 200, // Minimum width when resizing
        max_width: 500, // Maximum width when resizing
        resize: true // Enable resize for this column
    },
    {
        name: "start_date", 
        label: "Start", 
        align: "center", 
        width: 90,
        min_width: 80,
        resize: true
    },
    {
        name: "duration", 
        label: "Days", 
        align: "center", 
        width: 50,
        min_width: 40,
        resize: true
    },
    {
        name: "progress", 
        label: "Progress", 
        align: "center", 
        width: 80,
        min_width: 60,
        resize: true,
        template: function(task) {
            return Math.round(task.progress * 100) + "%";
        }
    },
    {
        name: "priority",
        label: "Priority",
        align: "center",
        width: 70,
        min_width: 60,
        resize: true,
        template: function(task) {
            return task.priority || "normal";
        }
    }
];

// Configure scales for better visibility
gantt.config.scales = [
    {unit: "year", step: 1, format: "%Y"},
    {unit: "month", step: 1, format: "%M %Y"},
    {unit: "week", step: 1, format: "Week %W"}
];

// Enable all required plugins
gantt.plugins({
    critical_path: true,
    marker: true,
    fullscreen: true,
    export_api: true, // Enable export functionality
    multiselect: true,
    tooltip: true
});

// Add tooltips for truncated text
gantt.templates.tooltip_text = function(start, end, task) {
    return "<b>Task:</b> " + task.text + 
           "<br/><b>Start:</b> " + gantt.templates.tooltip_date_format(start) + 
           "<br/><b>End:</b> " + gantt.templates.tooltip_date_format(end) + 
           "<br/><b>Progress:</b> " + Math.round(task.progress * 100) + "%" +
           "<br/><b>Priority:</b> " + (task.priority || "normal") +
           (task.notes ? "<br/><b>Notes:</b> " + task.notes : "");
};

// Initialize Gantt
gantt.init("gantt_here");

// API endpoint
const API_ENDPOINT = '/api/tasks';

// Main function to load tasks
function loadTasks() {
    console.log('Loading tasks from:', API_ENDPOINT);
    
    fetch(API_ENDPOINT)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Tasks loaded successfully');
            if (data && data.tasks) {
                gantt.parse(data);
                
                // Expand all tasks after loading
                gantt.eachTask(function(task){
                    gantt.open(task.id);
                });
                
                // Update statistics
                updateStatistics();
                
                // Add year-specific classes
                addYearClasses();
                
                // Scroll to today's date
                scrollToToday();
                
                // Render the gantt
                gantt.render();
            } else {
                console.error('Invalid data format:', data);
            }
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            loadTestData();
        });
}

// Function to scroll to today's date
function scrollToToday() {
    const today = new Date();
    // Calculate position to scroll to
    const scrollTo = gantt.posFromDate(today);
    // Get the scroll container
    const scrollContainer = document.querySelector('.gantt_task');
    if (scrollContainer) {
        // Scroll to today with some offset for better visibility
        scrollContainer.scrollLeft = scrollTo - 200;
    }
    
    // Also ensure vertical scroll shows current tasks
    const todaysTasks = [];
    gantt.eachTask(function(task) {
        const taskStart = new Date(task.start_date);
        const taskEnd = gantt.calculateEndDate(task.start_date, task.duration);
        if (taskStart <= today && taskEnd >= today) {
            todaysTasks.push(task);
        }
    });
    
    // If there are active tasks today, scroll to the first one
    if (todaysTasks.length > 0) {
        gantt.showTask(todaysTasks[0].id);
    }
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
    alert('Failed to load project data. Please check that tasks.json exists.');
}

// Add year-specific CSS classes for visual distinction
function addYearClasses() {
    gantt.eachTask(function(task) {
        const year = new Date(task.start_date).getFullYear();
        if (year === 2025) task.$custom_class = "year1";
        else if (year === 2026) task.$custom_class = "year2";
        else if (year === 2027) task.$custom_class = "year3";
        else if (year === 2028 || year === 2029) task.$custom_class = "year4";
    });
}

// Update statistics dashboard
function updateStatistics() {
    let total = 0, completed = 0, inProgress = 0, critical = 0;
    let totalProgress = 0;
    
    gantt.eachTask(function(task) {
        if (task.type !== "phase" || !task.type) {
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

// Enhanced zoom to fit function
window.zoomToFit = function() {
    const project_start = gantt.getState().min_date;
    const project_end = gantt.getState().max_date;
    
    gantt.config.start_date = project_start;
    gantt.config.end_date = project_end;
    
    gantt.render();
    gantt.showDate(new Date());
}

// PDF Export Function
window.exportToPDF = function() {
    console.log('Exporting to PDF...');
    
    // Configure PDF export options
    const exportConfig = {
        name: "Westmere_Factory_Development_" + new Date().toISOString().split('T')[0] + ".pdf",
        format: "A4",
        orientation: "landscape",
        header: "<h2>Westmere Factory Development Strategy - Vietnam 2025-2029</h2>",
        footer: "<p>Page {pageNum} of {pageCount} - Generated: " + new Date().toLocaleString() + "</p>",
        server: "https://export.dhtmlx.com/gantt",
        raw: false,
        callback: function(result) {
            if (result && result.url) {
                // Download the PDF
                const link = document.createElement('a');
                link.href = result.url;
                link.download = "Westmere_Gantt_" + new Date().toISOString().split('T')[0] + ".pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Fallback: Export visible area as image
                exportVisibleAreaAsPDF();
            }
        }
    };
    
    // Try to use DHTMLX export service
    if (gantt.exportToPDF) {
        gantt.exportToPDF(exportConfig);
    } else {
        // Fallback method if export service is not available
        exportVisibleAreaAsPDF();
    }
}

// Fallback PDF export using browser print
function exportVisibleAreaAsPDF() {
    // Store original title
    const originalTitle = document.title;
    
    // Set title for PDF
    document.title = "Westmere Factory Development - " + new Date().toLocaleDateString();
    
    // Add print-specific styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #gantt_here, #gantt_here * { visibility: visible; }
            #gantt_here { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                height: auto;
            }
            .header { display: none !important; }
            .statistics { display: none !important; }
            .controls { display: none !important; }
        }
    `;
    document.head.appendChild(printStyles);
    
    // Trigger print dialog (user can save as PDF)
    window.print();
    
    // Clean up
    setTimeout(() => {
        document.title = originalTitle;
        const printStyleElement = document.getElementById('print-styles');
        if (printStyleElement) {
            printStyleElement.remove();
        }
    }, 1000);
}

// Enhanced Excel Export with hierarchy preservation
window.exportToExcel = function() {
    console.log('Exporting to Excel with full Gantt structure...');
    
    // Try to use DHTMLX export service first
    if (gantt.exportToExcel) {
        gantt.exportToExcel({
            name: "Westmere_Factory_Development_" + new Date().toISOString().split('T')[0] + ".xlsx",
            columns: [
                { id: "text", header: "Task Name", width: 300 },
                { id: "start_date", header: "Start Date", width: 120 },
                { id: "end_date", header: "End Date", width: 120 },
                { id: "duration", header: "Duration (days)", width: 100 },
                { id: "progress", header: "Progress %", width: 100 },
                { id: "priority", header: "Priority", width: 100 },
                { id: "parent", header: "Parent Task", width: 150 },
                { id: "notes", header: "Notes", width: 300 }
            ],
            server: "https://export.dhtmlx.com/gantt",
            visual: true,
            cellColors: true,
            callback: function(result) {
                if (!result || !result.url) {
                    // Fallback to custom export
                    exportToExcelCustom();
                }
            }
        });
    } else {
        // Use custom export method
        exportToExcelCustom();
    }
}

// Custom Excel export with hierarchy
function exportToExcelCustom() {
    let csvContent = "Level,Task ID,Task Name,Start Date,End Date,Duration (days),Progress %,Priority,Status,Notes,Parent\n";
    
    // Helper function to get task level
    function getTaskLevel(task) {
        let level = 0;
        let parent = task.parent;
        while (parent && parent !== 0) {
            level++;
            parent = gantt.getTask(parent).parent;
        }
        return level;
    }
    
    // Export tasks in hierarchical order
    function exportTask(taskId, indent = "") {
        const task = gantt.getTask(taskId);
        const level = getTaskLevel(task);
        const endDate = gantt.calculateEndDate(task.start_date, task.duration);
        const status = task.progress >= 1 ? "Completed" : task.progress > 0 ? "In Progress" : "Not Started";
        const parentName = task.parent ? gantt.getTask(task.parent).text : "";
        
        // Add indentation to task name for hierarchy
        const indentedName = "  ".repeat(level) + task.text;
        
        csvContent += `${level},"${task.id}","${indentedName}",${task.start_date},${gantt.templates.date_format(endDate)},${task.duration},${Math.round(task.progress * 100)},${task.priority || 'normal'},${status},"${task.notes || ''}","${parentName}"\n`;
        
        // Export children
        const children = gantt.getChildren(taskId);
        children.forEach(childId => exportTask(childId, indent + "  "));
    }
    
    // Get root tasks and export hierarchically
    gantt.eachTask(function(task) {
        if (!task.parent || task.parent === 0) {
            exportTask(task.id);
        }
    }, 0);
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Westmere_Factory_Gantt_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Show/hide critical path
window.showCriticalPath = function() {
    gantt.config.highlight_critical_path = !gantt.config.highlight_critical_path;
    gantt.render();
}

// Toggle fullscreen
window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Filter by year
window.filterByYear = function() {
    const year = document.getElementById("yearFilter").value;
    
    if (year === "all") {
        loadTasks();
    } else {
        fetch(API_ENDPOINT)
            .then(response => response.json())
            .then(data => {
                const yearNum = parseInt(year);
                const filteredTasks = data.tasks.filter(task => {
                    const taskYear = new Date(task.start_date).getFullYear();
                    return taskYear === yearNum || taskYear === (yearNum + 1);
                });
                
                gantt.clearAll();
                gantt.parse({tasks: filteredTasks, links: data.links});
                
                // Expand all filtered tasks
                gantt.eachTask(function(task){
                    gantt.open(task.id);
                });
                
                updateStatistics();
                addYearClasses();
                gantt.render();
            })
            .catch(error => {
                console.error('Error filtering tasks:', error);
            });
    }
}

// Add today marker with enhanced visibility
const today = new Date();
gantt.addMarker({
    start_date: today,
    css: "today",
    text: "Today",
    title: "Today: " + today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
});

// Add custom styling for today marker and other enhancements
const style = document.createElement('style');
style.textContent = `
    .today {
        background-color: #ff5722;
        opacity: 0.6;
        width: 2px !important;
    }
    .gantt_task_cell.week_end {
        background-color: #f4f4f4;
    }
    .gantt_task_row.gantt_selected .gantt_task_cell {
        background-color: #fff3cd;
    }
    /* Ensure task text is visible */
    .gantt_tree_content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    /* Tooltip styling */
    .gantt_tooltip {
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        max-width: 300px;
    }
    /* Column resize handle */
    .gantt_grid_head_cell .gantt_grid_head_cell_resize_wrapper {
        cursor: col-resize;
        position: absolute;
        width: 10px;
        margin-left: -5px;
    }
`;
document.head.appendChild(style);

// Event handlers for better UX
gantt.attachEvent("onAfterTaskUpdate", function(id, task) {
    console.log("Task updated:", task);
    updateStatistics();
});

gantt.attachEvent("onAfterTaskAdd", function(id, task) {
    console.log("Task added:", task);
    updateStatistics();
});

gantt.attachEvent("onAfterTaskDelete", function(id, task) {
    console.log("Task deleted:", task);
    updateStatistics();
});

// Enable keyboard navigation
gantt.config.keyboard_navigation = true;
gantt.config.keyboard_navigation_cells = true;

// Load tasks when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
});

// Auto-refresh every 5 minutes (optional)
setInterval(function() {
    console.log('Auto-refreshing task data...');
    loadTasks();
}, 300000); // 5 minutes

console.log('Enhanced Gantt application loaded successfully');