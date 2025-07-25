// script.js - Merged version with working simulation and Gantt chart
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const algorithm = params.get('algorithm');
  const numProcesses = parseInt(params.get('num-processes'), 10);
  const timeQuantum = params.get('time-quantum');

  const processes = [];
  for (let i = 1; i <= numProcesses; i++) {
    processes.push({
      pid: i,
      arrivalTime: parseInt(params.get(`arrival-${i}`), 10),
      burstTime: parseInt(params.get(`burst-${i}`), 10),
      priority: params.get(`priority-${i}`) ? parseInt(params.get(`priority-${i}`), 10) : null,
      remainingTime: parseInt(params.get(`burst-${i}`), 10)
    });
  }

  return { algorithm, processes, timeQuantum };
}

function getColorClass(pid) {
  return `p${pid}`;
}

// Simulation variables
let simulationInterval;
let currentTime = 0;
let jobQueue = [];
let readyQueue = [];
let cpuProcess = null;
let completedProcesses = [];
let ganttChart = [];
let logEntries = [];

// Initialize simulation
function initSimulation() {
  const { processes } = getQueryParams();
  
  currentTime = 0;
  jobQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  readyQueue = [];
  cpuProcess = null;
  completedProcesses = [];
  ganttChart = [];
  logEntries = [];
  
  // Reset UI
  document.getElementById('simLog').textContent = 'Simulation initialized...';
  document.getElementById('simTimer').textContent = '0';
  updateQueueDisplay();
}

// Update all queue displays
function updateQueueDisplay() {
  // Job Queue
  const jobQueueEl = document.getElementById('jobQueue');
  jobQueueEl.innerHTML = '';
  jobQueue.forEach(proc => {
    const procEl = document.createElement('div');
    procEl.className = `sim-process ${getColorClass(proc.pid)}`;
    procEl.textContent = `P${proc.pid} (${proc.remainingTime})`;
    jobQueueEl.appendChild(procEl);
  });

  // Ready Queue
  const readyQueueEl = document.getElementById('readyQueue');
  readyQueueEl.innerHTML = '';
  readyQueue.forEach(proc => {
    const procEl = document.createElement('div');
    procEl.className = `sim-process ${getColorClass(proc.pid)}`;
    procEl.textContent = `P${proc.pid} (${proc.remainingTime})`;
    readyQueueEl.appendChild(procEl);
  });

  // CPU
  const cpuSlotEl = document.getElementById('cpuSlot');
  if (cpuProcess) {
    cpuSlotEl.className = `sim-process ${getColorClass(cpuProcess.pid)}`;
    cpuSlotEl.textContent = `P${cpuProcess.pid} (${cpuProcess.remainingTime})`;
  } else {
    cpuSlotEl.className = 'sim-cpu-idle';
    cpuSlotEl.textContent = 'Idle';
  }

  // Completed Jobs
  const jobCompletedEl = document.getElementById('jobCompleted');
  jobCompletedEl.innerHTML = '';
  completedProcesses.forEach(proc => {
    const procEl = document.createElement('div');
    procEl.className = `sim-process ${getColorClass(proc.pid)}`;
    procEl.textContent = `P${proc.pid}`;
    jobCompletedEl.appendChild(procEl);
  });

  // Timer
  document.getElementById('simTimer').textContent = currentTime;
}

// Run one step of simulation
function runSimulationStep() {
  currentTime++;
  
  // Move arrived processes to ready queue
  const arrived = jobQueue.filter(p => p.arrivalTime <= currentTime);
  jobQueue = jobQueue.filter(p => p.arrivalTime > currentTime);
  readyQueue.push(...arrived);

  // If CPU is free, schedule next process
  if (!cpuProcess && readyQueue.length > 0) {
    scheduleNextProcess();
  }

  // Execute current process in CPU
  if (cpuProcess) {
    executeCurrentProcess();
  }

  // Update logs and UI
  updateLog();
  updateQueueDisplay();
  updateGanttChart();
  
  // Check if simulation is complete
  if (jobQueue.length === 0 && readyQueue.length === 0 && !cpuProcess && completedProcesses.length > 0) {
    stopSimulation();
    calculateMetrics();
  }
}

function scheduleNextProcess() {
  const { algorithm } = getQueryParams();
  
  // For RR, just take the first process
  if (algorithm === 'rr') {
    cpuProcess = readyQueue.shift();
  }
  // For other algorithms, sort ready queue based on algorithm
  else {
    readyQueue.sort((a, b) => {
      if (algorithm === 'fcfs') return a.arrivalTime - b.arrivalTime;
      if (algorithm === 'sjf-non' || algorithm === 'sjf-pre') return a.burstTime - b.burstTime;
      if (algorithm === 'priority') return a.priority - b.priority;
      return 0;
    });
    cpuProcess = readyQueue.shift();
  }
  
  cpuProcess.startTime = currentTime;
  ganttChart.push({
    pid: cpuProcess.pid,
    start: currentTime,
    end: currentTime + 1,
    type: 'start'
  });
}

function executeCurrentProcess() {
  // If this is the first execution cycle for this process
  if (!cpuProcess.currentSegment || cpuProcess.currentSegment.end < currentTime) {
    cpuProcess.currentSegment = {
      pid: cpuProcess.pid,
      start: currentTime,
      end: currentTime + 1
    };
    ganttChart.push(cpuProcess.currentSegment);
  } else {
    // Extend the current segment
    cpuProcess.currentSegment.end = currentTime + 1;
  }

  cpuProcess.remainingTime--;
  
  // Update Gantt chart
  ganttChart[ganttChart.length - 1].end = currentTime + 1;
  
  // If process completed
  if (cpuProcess.remainingTime <= 0) {
    cpuProcess.completionTime = currentTime + 1;
    cpuProcess.turnaroundTime = cpuProcess.completionTime - cpuProcess.arrivalTime;
    cpuProcess.waitingTime = cpuProcess.turnaroundTime - cpuProcess.burstTime;
    completedProcesses.push(cpuProcess);
    
    logEntries.push(`P${cpuProcess.pid} completed at time ${cpuProcess.completionTime}`);
    cpuProcess = null;
  }
}

function updateLog() {
  const logEl = document.getElementById('simLog');
  logEl.textContent = logEntries.join('\n');
  logEl.scrollTop = logEl.scrollHeight;
}

function updateGanttChart() {
  const chartEl = document.getElementById('ganttChart');
  chartEl.innerHTML = '';
  
  ganttChart.forEach(segment => {
    const segmentEl = document.createElement('div');
    segmentEl.className = `gantt-segment ${getColorClass(segment.pid)}`;
    segmentEl.style.width = `${(segment.end - segment.start) * 40}px`;
    segmentEl.innerHTML = `
      <div class="gantt-segment-label">P${segment.pid}</div>
      <div class="gantt-segment-time">${segment.start}-${segment.end}</div>
    `;
    chartEl.appendChild(segmentEl);
  });
}

function calculateMetrics() {
  const totalProcesses = completedProcesses.length;
  const totalWaiting = completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTurnaround = completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalBurst = completedProcesses.reduce((sum, p) => sum + p.burstTime, 0);
  
  document.getElementById('avgWaiting').textContent = (totalWaiting / totalProcesses).toFixed(2);
  document.getElementById('avgTurnaround').textContent = (totalTurnaround / totalProcesses).toFixed(2);
  document.getElementById('throughput').textContent = (totalProcesses / currentTime).toFixed(2);
  
  const utilization = (totalBurst / currentTime) * 100;
  document.getElementById('cpuUtilPercent').textContent = `${utilization.toFixed(2)}%`;
  document.getElementById('cpuUtilBar').style.width = `${utilization}%`;
}

// Control functions
function startSimulation() {
  if (simulationInterval) return;
  initSimulation();
  simulationInterval = setInterval(runSimulationStep, 1000);
}

function stopSimulation() {
  clearInterval(simulationInterval);
  simulationInterval = null;
}

function resetSimulation() {
  stopSimulation();
  initSimulation();
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startSimulation);
document.getElementById('pauseBtn').addEventListener('click', stopSimulation);
document.getElementById('resetBtn').addEventListener('click', resetSimulation);

// Initialize
initSimulation();
