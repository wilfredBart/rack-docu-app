/**
 * Basisklasse voor alle netwerkapparaten in de rack mockups.
 */
export class Device {
  constructor(id, type, label, ports = []) {
    this.id = id;
    this.type = type;         // Bijv. "router", "switch", "ap"
    this.label = label;       // Fysiek labletjeNaam/model van het apparaat
    this.ports = ports;       // Lijst van poorten gekoppeld aan dit apparaat
  }

  /**
   * Zoek een specifieke poort op basis van het poortnummer.
   * @param {number} portNumber 
   * @returns {Object|undefined}
   */
  getPort(portNumber) {
    return this.ports.find(p => p.n === portNumber);
  }

  /**
   * Wissel de verbindingsstatus (up/down) van een poort.
   * @param {number} portNumber 
   */
  togglePortStatus(portNumber) {
    const port = this.getPort(portNumber);
    if (port) {
      port.status = port.status === "up" ? "down" : "up";
      console.log(`Poort ${portNumber} van ${this.label} is nu ${port.status}`);
    }
  }

  /**
   * Geeft een samenvatting terug van het apparaat en de status van de poorten.
   */
  getSummary() {
    const totalPorts = this.ports.length;
    const activePorts = this.ports.filter(p => p.status === "up").length;
    return `${this.label} (${this.type.toUpperCase()}) — ${activePorts}/${totalPorts} poorten actief`;
  }
}