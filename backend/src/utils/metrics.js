class Metrics {
  constructor() {
    this.startTime = Date.now();
    this.http = {
      requests: 0,
      errors: 0,
      durationTotalMs: 0,
    };
    this.socket = {
      connections: 0,
      disconnections: 0,
      activeConnections: 0,
      joinLatencies: [], // Keep last 100 for p95 calc
      updateEvents: 0,
      errors: 0,
    };
    this.db = {
      savesScheduled: 0,
      savesExecuted: 0,
      savesDurationTotalMs: 0,
    };
    this.documents = {
      activeCount: 0,
    };
  }

  recordHttpRequest(duration, isError) {
    this.http.requests++;
    this.http.durationTotalMs += duration;
    if (isError) this.http.errors++;
  }

  recordSocketConnection() {
    this.socket.connections++;
    this.socket.activeConnections++;
  }

  recordSocketDisconnection() {
    this.socket.disconnections++;
    this.socket.activeConnections = Math.max(0, this.socket.activeConnections - 1);
  }

  recordSocketError() {
    this.socket.errors++;
  }

  recordSocketJoin(latencyMs) {
    this.socket.joinLatencies.push(latencyMs);
    if (this.socket.joinLatencies.length > 100) {
      this.socket.joinLatencies.shift();
    }
  }

  recordSocketUpdate() {
    this.socket.updateEvents++;
  }

  recordDbSaveScheduled() {
    this.db.savesScheduled++;
  }

  recordDbSaveExecuted(duration) {
    this.db.savesExecuted++;
    this.db.savesDurationTotalMs += duration;
  }

  setActiveDocuments(count) {
    this.documents.activeCount = count;
  }

  calculatePercentiles(arr) {
    if (arr.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    return { p50, p95, p99 };
  }

  getReport() {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    const httpAvgDuration = this.http.requests > 0 ? (this.http.durationTotalMs / this.http.requests).toFixed(2) : 0;
    const dbAvgDuration = this.db.savesExecuted > 0 ? (this.db.savesDurationTotalMs / this.db.savesExecuted).toFixed(2) : 0;
    
    return {
      uptimeSeconds,
      http: {
        ...this.http,
        averageDurationMs: parseFloat(httpAvgDuration),
      },
      socket: {
        ...this.socket,
        joinLatenciesMs: this.calculatePercentiles(this.socket.joinLatencies),
      },
      db: {
        ...this.db,
        averageSaveDurationMs: parseFloat(dbAvgDuration),
      },
      documents: this.documents,
    };
  }
}

const metrics = new Metrics();
module.exports = metrics;
