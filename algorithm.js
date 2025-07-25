// algorithm.js

// FCFS: First-Come, First-Served
function simulateFCFS(processes) {
  let time = 0;
  const log = [];
  const gantt = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;

  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  processes.forEach(proc => {
    if (time < proc.arrivalTime) time = proc.arrivalTime;
    proc.startTime = time;
    proc.completionTime = time + proc.burstTime;
    proc.waitingTime = proc.startTime - proc.arrivalTime;
    proc.turnaroundTime = proc.completionTime - proc.arrivalTime;

    gantt.push({ pid: proc.pid, start: proc.startTime, end: proc.completionTime });

    time = proc.completionTime;
    totalWaiting += proc.waitingTime;
    totalTurnaround += proc.turnaroundTime;

    log.push(`P${proc.pid} | AT: ${proc.arrivalTime}, BT: ${proc.burstTime}, ST: ${proc.startTime}, CT: ${proc.completionTime}`);
  });

  return finalizeResult(log, gantt, totalWaiting, totalTurnaround, processes.length, time, processes);
}

// SJF Non-Preemptive
function simulateSJFNonPreemptive(processes) {
  let time = 0;
  let completed = 0;
  const log = [];
  const gantt = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;
  const n = processes.length;
  const isDone = new Array(n).fill(false);

  while (completed < n) {
    const ready = processes.filter((p, i) => p.arrivalTime <= time && !isDone[i]);
    if (ready.length === 0) {
      time++;
      continue;
    }

    const next = ready.reduce((a, b) => a.burstTime < b.burstTime ? a : b);
    const idx = processes.indexOf(next);
    processes[idx].startTime = time;
    processes[idx].completionTime = time + next.burstTime;
    processes[idx].waitingTime = time - next.arrivalTime;
    processes[idx].turnaroundTime = processes[idx].completionTime - next.arrivalTime;

    totalWaiting += processes[idx].waitingTime;
    totalTurnaround += processes[idx].turnaroundTime;
    gantt.push({ pid: next.pid, start: time, end: time + next.burstTime });
    log.push(`P${next.pid} | AT: ${next.arrivalTime}, BT: ${next.burstTime}, ST: ${time}, CT: ${time + next.burstTime}`);

    time += next.burstTime;
    isDone[idx] = true;
    completed++;
  }

  return finalizeResult(log, gantt, totalWaiting, totalTurnaround, n, time, processes);
}

// SJF Preemptive (Shortest Remaining Time First)
function simulateSJFPreemptive(processes) {
  let time = 0;
  let completed = 0;
  const n = processes.length;
  const log = [];
  const gantt = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;

  processes.forEach(p => {
    p.remaining = p.burstTime;
  });

  let currentProcess = null;
  let startTime = null;

  while (completed < n) {
    const ready = processes.filter(p => p.arrivalTime <= time && p.remaining > 0);
    if (ready.length === 0) {
      time++;
      continue;
    }

    const next = ready.reduce((a, b) => (a.remaining < b.remaining ? a : b));

    if (currentProcess !== next) {
      if (currentProcess && startTime !== null) {
        gantt.push({ pid: currentProcess.pid, start: startTime, end: time });
      }
      currentProcess = next;
      startTime = time;
    }

    next.remaining--;
    time++;

    if (next.remaining === 0) {
      currentProcess.completionTime = time;
      currentProcess.turnaroundTime = time - currentProcess.arrivalTime;
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

      totalWaiting += currentProcess.waitingTime;
      totalTurnaround += currentProcess.turnaroundTime;
      log.push(`P${currentProcess.pid} | AT: ${currentProcess.arrivalTime}, BT: ${currentProcess.burstTime}, CT: ${time}`);
      completed++;
      currentProcess = null;
      startTime = null;
    }
  }

  if (startTime !== null && currentProcess) {
    gantt.push({ pid: currentProcess.pid, start: startTime, end: time });
  }

  return finalizeResult(log, gantt, totalWaiting, totalTurnaround, n, time, processes);
}

// Priority Scheduling (Non-Preemptive)
function simulatePriorityScheduling(processes) {
  let time = 0;
  const n = processes.length;
  const isDone = new Array(n).fill(false);
  const log = [];
  const gantt = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;
  let completed = 0;

  while (completed < n) {
    const ready = processes.filter((p, i) => p.arrivalTime <= time && !isDone[i]);
    if (ready.length === 0) {
      time++;
      continue;
    }

    const next = ready.reduce((a, b) => a.priority < b.priority ? a : b);
    const idx = processes.indexOf(next);

    processes[idx].startTime = time;
    processes[idx].completionTime = time + next.burstTime;
    processes[idx].waitingTime = time - next.arrivalTime;
    processes[idx].turnaroundTime = processes[idx].completionTime - next.arrivalTime;

    totalWaiting += processes[idx].waitingTime;
    totalTurnaround += processes[idx].turnaroundTime;
    gantt.push({ pid: next.pid, start: time, end: time + next.burstTime });
    log.push(`P${next.pid} | Priority: ${next.priority}, AT: ${next.arrivalTime}, BT: ${next.burstTime}, ST: ${time}, CT: ${time + next.burstTime}`);

    time += next.burstTime;
    isDone[idx] = true;
    completed++;
  }

  return finalizeResult(log, gantt, totalWaiting, totalTurnaround, n, time, processes);
}

// Round Robin
function simulateRoundRobin(processes, tq) {
  let time = 0;
  const n = processes.length;
  const queue = [];
  const gantt = [];
  const log = [];
  let totalWaiting = 0;
  let totalTurnaround = 0;
  processes.forEach(p => {
    p.remaining = p.burstTime;
    p.started = false;
  });

  const arrivalSorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let index = 0;

  while (queue.length > 0 || index < n) {
    while (index < n && arrivalSorted[index].arrivalTime <= time) {
      queue.push(arrivalSorted[index++]);
    }

    if (queue.length === 0) {
      time++;
      continue;
    }

    const proc = queue.shift();

    const execTime = Math.min(proc.remaining, tq);
    const start = time;
    time += execTime;
    proc.remaining -= execTime;

    gantt.push({ pid: proc.pid, start, end: time });

    while (index < n && arrivalSorted[index].arrivalTime <= time) {
      queue.push(arrivalSorted[index++]);
    }

    if (proc.remaining > 0) {
      queue.push(proc);
    } else {
      proc.completionTime = time;
      proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
      proc.waitingTime = proc.turnaroundTime - proc.burstTime;

      totalWaiting += proc.waitingTime;
      totalTurnaround += proc.turnaroundTime;
      log.push(`P${proc.pid} | AT: ${proc.arrivalTime}, BT: ${proc.burstTime}, CT: ${proc.completionTime}`);
    }
  }

  return finalizeResult(log, gantt, totalWaiting, totalTurnaround, n, time, processes);
}

// Common Result Formatter
function finalizeResult(log, gantt, totalWaiting, totalTurnaround, n, time, processes) {
  return {
    log,
    gantt,
    avgWaiting: (totalWaiting / n).toFixed(2),
    avgTurnaround: (totalTurnaround / n).toFixed(2),
    throughput: (n / time).toFixed(2),
    cpuUtil: ((processes.reduce((acc, p) => acc + p.burstTime, 0) / time) * 100).toFixed(2)
  };
}
