// Initialize Gantt with enhanced configuration
gantt.config.date_format = "%Y-%m-%d";
gantt.config.grid_width = 900; // Much wider grid to prevent any overlap
gantt.config.row_height = 35; // Taller rows for better readability
gantt.config.scale_height = 80;
gantt.config.autosize = "y"; // Auto-adjust height
gantt.config.autosize_min_width = 1400;
gantt.config.fit_tasks = true; // Fit tasks to screen width
gantt.config.open_tree_initially = true; // ALWAYS open expanded
gantt.config.scroll_on_click = true;
gantt.config.show_progress = true;
gantt.config.show_task_cells = true;
gantt.config.grid_resize = true; // Enable grid resizing
gantt.config.columns_resizable = true; // Enable column resizing
gantt.config.columns_movable = true; // Allow column reordering
gantt.config.indent = 20; // Set tree indentation width
gantt.config.indent_unit = "px";

// Date format templates - must be defined BEFORE column configuration
gantt.templates.date_grid = function(date) {
    if (!date) return "";
    return gantt.date.date_to_str("%Y-%m-%d")(date);
};

// Configure columns with better sizing and resizing capabilities
gantt.config.columns = [
    {
        name: "text", 
        label: "Task name", 
        tree: true, 
        width: 450, // Even wider to accommodate tree and text
        min_width: 400,
        max_width: 700,
        resize: true,
        template: function(task) {
            // Just return the text, let CSS handle the display
            return task.text || "";
        }
    },
    {
        name: "start_date", 
        label: "Start Date", 
        align: "center", 
        width: 150, // Wider still for dates
        min_width: 140,
        resize: true,
        template: function(task) {
            if (!task.start_date) return "";
            return gantt.templates.date_grid(task.start_date);
        }
    },
    {
        name: "duration", 
        label: "Days", 
        align: "center", 
        width: 70,
        min_width: 60,
        resize: true
    },
    {
        name: "progress", 
        label: "Progress", 
        align: "center", 
        width: 100,
        min_width: 80,
        resize: true,
        template: function(task) {
            return Math.round((task.progress || 0) * 100) + "%";
        }
    },
    {
        name: "priority",
        label: "Priority",
        align: "center",
        width: 90,
        min_width: 80,
        resize: true,
        template: function(task) {
            return task.priority || "normal";
        }
    }
];

// Date format templates
gantt.templates.date_grid = function(date) {
    if (!date) return "";
    return gantt.date.date_to_str("%Y-%m-%d")(date);
};

// Configure scales for better visibility
gantt.config.scales = [
    {unit: "year", step: 1, format: "%Y"},
    {unit: "month", step: 1, format: "%M %Y"},
    {unit: "week", step: 1, format: "Week %W"}
];

// Additional text visibility settings
gantt.config.autofit = false; // Don't auto-shrink columns
gantt.config.readonly = false; // Allow interactions
gantt.config.smart_scales = true; // Smart scale rendering
gantt.config.min_column_width = 70; // Minimum width for any column
gantt.config.scale_offset_minimal = false; // Show full scale

// Enable all required plugins
gantt.plugins({
    critical_path: true,
    marker: true,
    fullscreen: true,
    multiselect: true,
    tooltip: true
});

// Enable all required plugins
gantt.plugins({
    critical_path: true,
    marker: true,
    fullscreen: true,
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
                
                // Auto-adjust column widths based on content
                adjustColumnWidths();
                
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

// Function to auto-adjust column widths based on content
function adjustColumnWidths() {
    // Find the longest task name accounting for tree structure
    let maxTaskNameLength = 0;
    gantt.eachTask(function(task) {
        // Account for tree indentation (20px per level) plus icon space
        const level = task.$level || 0;
        const indentWidth = (level * 20) + 30; // 20px per level + 30px for icons
        const textLength = (task.text || '').length * 8 + indentWidth + 60; // Add extra buffer
        maxTaskNameLength = Math.max(maxTaskNameLength, textLength);
    });
    
    // Update the text column width if needed
    const columns = gantt.config.columns;
    if (columns && columns[0] && columns[0].name === 'text') {
        // Set to calculated width but within min/max bounds
        const newWidth = Math.min(Math.max(maxTaskNameLength, 450), 700);
        columns[0].width = newWidth;
        
        // Update grid width to accommodate all columns
        let totalWidth = 0;
        columns.forEach(col => {
            totalWidth += col.width || 100;
        });
        gantt.config.grid_width = Math.max(totalWidth + 30, 900); // Add padding
    }
    
    // Force gantt to recalculate layout
    if (gantt.$container) {
        gantt.render();
    }
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

// PDF Export Function - Simplified and working
window.exportToPDF = function() {
    console.log('Starting PDF export...');
    
    // Method 1: Use browser's print dialog (most reliable)
    const printWindow = function() {
        // Store original title
        const originalTitle = document.title;
        document.title = "Westmere Factory Development - " + new Date().toLocaleDateString();
        
        // Create a print-specific style
        const printStyle = document.createElement('style');
        printStyle.id = 'pdf-print-styles';
        printStyle.innerHTML = `
            @media print {
                body { 
                    background: white !important; 
                    margin: 0;
                    padding: 0;
                }
                .header { 
                    page-break-after: avoid;
                    background: white !important;
                    padding: 10px !important;
                }
                .controls { display: none !important; }
                .statistics { 
                    page-break-after: avoid;
                    padding: 10px !important;
                }
                #gantt_here { 
                    margin: 0 !important;
                    padding: 10px !important;
                    border: none !important;
                    box-shadow: none !important;
                    min-width: 100% !important;
                }
                .gantt_grid_scale,
                .gantt_grid_data,
                .gantt_task {
                    background: white !important;
                }
            }
            @page {
                size: landscape;
                margin: 0.5in;
            }
        `;
        document.head.appendChild(printStyle);
        
        // Trigger print
        setTimeout(() => {
            window.print();
            
            // Cleanup
            setTimeout(() => {
                document.title = originalTitle;
                const styleEl = document.getElementById('pdf-print-styles');
                if (styleEl) styleEl.remove();
            }, 100);
        }, 500);
    };
    
    // Try the dhtmlx export first, fallback to print
    if (window.gantt && gantt.exportToPDF) {
        try {
            gantt.exportToPDF({
                name: "Westmere_Gantt_" + new Date().toISOString().split('T')[0] + ".pdf",
                format: "A4",
                orientation: "landscape",
                header: "Westmere Factory Development Strategy",
                footer: "Generated: " + new Date().toLocaleString()
            });
        } catch (e) {
            console.log('DHTMLX export failed, using print dialog...');
            printWindow();
        }
    } else {
        printWindow();
    }
}

// Enhanced Excel Export - Simplified and working
window.exportToExcel = function() {
    console.log('Starting Excel export...');
    
    // Build CSV content with proper structure
    let csvContent = "Task Name,Start Date,End Date,Duration (days),Progress %,Priority,Status,Parent Task,Notes\n";
    
    // Helper function to escape CSV values
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
    
    // Helper function to get indentation
    function getIndent(level) {
        return '  '.repeat(level);
    }
    
    // Helper function to format date
    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Process all tasks in hierarchical order
    function processTask(taskId, level = 0) {
        try {
            const task = gantt.getTask(taskId);
            const endDate = gantt.calculateEndDate(task.start_date, task.duration);
            const status = task.progress >= 1 ? "Completed" : 
                          task.progress > 0 ? "In Progress" : "Not Started";
            const parentTask = task.parent && task.parent !== 0 ? 
                              gantt.getTask(task.parent).text : "";
            
            // Add task to CSV with indentation
            const taskName = getIndent(level) + task.text;
            const startDate = formatDate(task.start_date);
            const endDateStr = formatDate(endDate);
            const progress = Math.round(task.progress * 100);
            const priority = task.priority || 'normal';
            const notes = task.notes || '';
            
            csvContent += [
                escapeCSV(taskName),
                escapeCSV(startDate),
                escapeCSV(endDateStr),
                task.duration,
                progress,
                escapeCSV(priority),
                escapeCSV(status),
                escapeCSV(parentTask),
                escapeCSV(notes)
            ].join(',') + '\n';
            
            // Process children
            const children = gantt.getChildren(taskId);
            children.forEach(childId => {
                processTask(childId, level + 1);
            });
        } catch (e) {
            console.error('Error processing task:', taskId, e);
        }
    }
    
    // Get all root tasks and process
    try {
        gantt.eachTask(function(task) {
            if (!task.parent || task.parent === 0) {
                processTask(task.id, 0);
            }
        }, 0);
        
        // Create and download the file
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Westmere_Gantt_Export_' + new Date().toISOString().split('T')[0] + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Excel export completed successfully');
    } catch (error) {
        console.error('Excel export failed:', error);
        alert('Export failed. Please try again.');
    }
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
                
                // Auto-adjust column widths for filtered content
                adjustColumnWidths();
                
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
    /* Fix tree indentation and text visibility */
    .gantt_tree_content {
        overflow: visible !important;
        text-overflow: initial !important;
        white-space: normal !important;
        word-wrap: break-word;
        padding-right: 15px;
        padding-left: 5px;
        line-height: 1.4;
        display: inline-block;
        width: calc(100% - 25px);
    }
    /* Ensure tree icons don't overlap text */
    .gantt_tree_icon {
        margin-right: 8px;
        vertical-align: middle;
    }
    .gantt_tree_indent {
        display: inline-block;
        width: 20px;
    }
    /* Fix cell content display */
    .gantt_cell_tree {
        overflow: visible !important;
        position: relative;
    }
    .gantt_cell_tree .gantt_tree_content {
        position: relative;
        z-index: 1;
    }
    /* Ensure date columns show full dates */
    .gantt_cell[data-column-name="start_date"] {
        white-space: nowrap !important;
        font-size: 13px;
        padding: 4px 8px !important;
        overflow: visible !important;
    }
    /* Tooltip styling */
    .gantt_tooltip {
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        max-width: 400px;
        z-index: 10000;
    }
    /* Column resize handle */
    .gantt_grid_head_cell .gantt_grid_head_cell_resize_wrapper {
        cursor: col-resize;
        position: absolute;
        width: 10px;
        margin-left: -5px;
    }
    /* Ensure grid cells have proper padding */
    .gantt_grid_data .gantt_cell {
        padding: 6px 10px;
        overflow: visible !important;
    }
    /* Row height adjustment for better text visibility */
    .gantt_task_row, .gantt_row {
        min-height: 35px !important;
    }
    /* Fix date display */
    .gantt_date {
        white-space: nowrap !important;
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
    
    // Add resize handler to maintain column visibility
    window.addEventListener('resize', function() {
        if (gantt.$container) {
            gantt.render();
            adjustColumnWidths();
        }
    });
    
    // Ensure columns are resizable by user
    gantt.attachEvent("onColumnResize", function(ind, column, new_width){
        // Save user's preferred width
        console.log("Column resized:", column.name, "New width:", new_width);
        return true;
    });
});

// Auto-refresh every 5 minutes (optional)
setInterval(function() {
    console.log('Auto-refreshing task data...');
    loadTasks();
}, 300000); // 5 minutes

console.log('Enhanced Gantt application loaded successfully');