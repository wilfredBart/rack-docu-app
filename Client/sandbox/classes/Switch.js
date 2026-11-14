/**
 * Switch klasse die overerft van Device.
 */
export class Switch extends Device {
  constructor(id, label, ports) {
    super(id, "switch", label, ports);
  }

  /**
   * Specifieke methode voor switches: bereken het totale PoE-verbruik in Watt.
   */
  getTotalPoEUsage() {
    return this.ports
      .filter(p => p.status === "up" && p.poeW)
      .reduce((total, p) => total + p.poeW, 0);
  }
}