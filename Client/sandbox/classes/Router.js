/**
 * Router klasse die overerft van Device.
 */
export class Router extends Device {
  constructor(id, label, ports) {
    super(id, "router", label, ports);
  }

  /**
   * Specifieke methode voor routers: controleer WAN-verbindingen.
   */
  getWanStatus() {
    const wanPorts = this.ports.filter(p => p.isWan);
    return wanPorts.map(p => ({ port: p.n, status: p.status }));
  }
}
