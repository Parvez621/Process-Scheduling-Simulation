// script.js

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
      priority: params.get(`priority-${i}`) ? parseInt(params.get(`priority-${i}`), 10) : null
    });
  }

  return { algorithm, processes, timeQuantum };
}

function getColorClass(pid) {
  return `p${pid}`;
}

function displayGantt(gantt) {
  const chart = document.getElementById('ganttChart');
  const axis = document.getElementById('ganttAxis');
  chart.innerHTML = '';
  axis.innerHTML = '';

  // Determine total time
  const totalTime = gantt[gantt.length - 1].end;

  // Create segments
  gantt.forEach(({ pid, start, end }) => {
    const segment = document.createElement('div');
    segment.className = `gantt-segment ${getColorClass(pid)}`;
    segment.textContent = `P${pid}`;
    segment.style.width = `${(end - start) * 40}px`; // 40px per unit
    chart.appendChild(segment);
  });

  // Create time axis
  for (let i = 0; i <= totalTime; i++) {
    const tick = document.createElement('div');
    tick.className = 'gantt-tick';
    tick.textContent = i;
    axis.appendChild(tick);
  }
}


function displayLog(log) {
  document.getElementById('simLog').textContent = log.join('\n');
}

function displayMetrics(data) {
  document.getElementById('avgWaiting').textContent = data.avgWaiting;
  document.getElementById('avgTurnaround').textContent = data.avgTurnaround;
  document.getElementById('throughput').textContent = data.throughput;
  document.getElementById('cpuUtilPercent').textContent = `${data.cpuUtil}%`;
  document.getElementById('cpuUtilBar').style.width = `${data.cpuUtil}%`;
}

document.getElementById('startBtn').addEventListener('click', () => {
  const { algorithm, processes } = getQueryParams();
  let result = null;

  if (algorithm === 'fcfs') {
    result = simulateFCFS([...processes]);
  }
  // You can add conditions for SJF, RR, etc.

  if (result) {
    displayLog(result.log);
    displayGantt(result.gantt);
    displayMetrics(result);
  }
});

function displayGantt(gantt) {
  const chart = document.getElementById('ganttChart');
  const axis = document.getElementById('ganttAxis');
  chart.innerHTML = '';
  axis.innerHTML = '';

  const UNIT_WIDTH = 40;

  // Add axis ticks first
  const totalTime = gantt[gantt.length - 1].end;
  for (let i = 0; i <= totalTime; i++) {
    const tick = document.createElement('div');
    tick.className = 'gantt-tick';
    tick.textContent = i;
    axis.appendChild(tick);
  }

  // Animate segments
  gantt.forEach(({ pid, start, end }, index) => {
    setTimeout(() => {
      const segment = document.createElement('div');
      segment.className = `gantt-segment ${getColorClass(pid)}`;
      segment.textContent = `P${pid}`;
      segment.style.width = `${(end - start) * UNIT_WIDTH}px`;
      chart.appendChild(segment);
    }, index * 300);
  });
}


document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('simLog').textContent = '';
  document.getElementById('ganttChart').innerHTML = '';
  document.getElementById('ganttAxis').innerHTML = '';
  document.getElementById('avgWaiting').textContent = '-';
  document.getElementById('avgTurnaround').textContent = '-';
  document.getElementById('throughput').textContent = '-';
  document.getElementById('cpuUtilPercent').textContent = '0%';
  document.getElementById('cpuUtilBar').style.width = '0%';
});
