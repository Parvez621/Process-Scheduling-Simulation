// algorithm.js

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

    gantt.push({
      pid: proc.pid,
      start: proc.startTime,
      end: proc.completionTime
    });

    time = proc.completionTime;
    totalWaiting += proc.waitingTime;
    totalTurnaround += proc.turnaroundTime;

    log.push(`P${proc.pid} | AT: ${proc.arrivalTime}, BT: ${proc.burstTime}, ST: ${proc.startTime}, CT: ${proc.completionTime}`);
  });

  return {
    log,
    gantt,
    avgWaiting: (totalWaiting / processes.length).toFixed(2),
    avgTurnaround: (totalTurnaround / processes.length).toFixed(2),
    throughput: (processes.length / time).toFixed(2),
    cpuUtil: ((processes.reduce((acc, p) => acc + p.burstTime, 0) / time) * 100).toFixed(2)
  };
}
