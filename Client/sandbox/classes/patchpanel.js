/**
 * Basisklasse voor alle netwerkapparaten in de rack mockups.
 */
export class Patchpanel {
  constructor(id, utpConnectorType, label, ports = []) {
    this.id = id;
    this.utpConnectorType = utpConnectorType;         // zmax , keystone, vorm van de connector
    this.label = label;         // Fysiek labletje Naam/model van het apparaat
    this.ports = ports;         // Lijst van poorten gekoppeld aan dit apparaat
    this.unit = 1;              // Standaard unit voor patchpanelen
  }

 
}