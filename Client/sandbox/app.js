const SW = new Switch("sw-core-01", "Core Switch 48P", [
  { n: 1, type: "rj45", speed: "1G", poe: "PoE+", status: "up", vlan: "VLAN 10", client: "Access Point", poeW: 12.5 },
  { n: 2, type: "rj45", speed: "1G", poe: "PoE+", status: "down", vlan: null, client: null, poeW: 0 },
  { n: 49, type: "sfp", speed: "10G", poe: null, status: "up", vlan: "Trunk", client: "Router — Uplink", poeW: 0 }
]);