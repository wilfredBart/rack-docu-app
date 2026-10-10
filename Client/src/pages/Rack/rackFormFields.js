// Veld-configuratie voor de device/patch-panel/cable FormModals.
// deviceFields hangt af van deviceTypes (voor de select-opties), vandaar als functie.
// De andere twee zijn statisch en kunnen als losse constanten geëxporteerd worden.

export function getDeviceFields(deviceTypes) {
  return [
    { name: "label", label: "Label", type: "text", required: true },
    {
      name: "device_type_id",
      label: "Type",
      type: "select",
      required: true,
      options: (deviceTypes ?? []).map((type) => ({
        value: String(type.id),
        label: type.name,
      })),
    },
    {
      name: "rack_position",
      label: "Start-U",
      type: "number",
      required: true,
    },
    {
      name: "rack_units",
      label: "Aantal U",
      type: "number",
      required: true,
    },
    {
      name: "port_count",
      label: "Aantal poorten",
      type: "number",
      required: true,
      hint: "Maakt meteen een leeg patchplan met deze poorten.",
    },
    { name: "manufacturer", label: "Fabrikant", type: "text" },
    { name: "model", label: "Model", type: "text" },
    { name: "serial_number", label: "Serienummer", type: "text" },
    { name: "mac_address", label: "MAC-adres", type: "text" },
    { name: "notes", label: "Opmerking", type: "textarea" },
  ];
}

export const patchPanelFields = [
  { name: "label", label: "Label", type: "text", required: true },
  { name: "type", label: "Type", type: "text" },
  { name: "manufacturer", label: "Fabrikant", type: "text" },
  { name: "model", label: "Model", type: "text" },
  {
    name: "port_count",
    label: "Aantal poorten",
    type: "number",
    required: true,
  },
  {
    name: "rack_position",
    label: "Start-U",
    type: "number",
    required: true,
  },
  { name: "rack_units", label: "Aantal U", type: "number", required: true },
  { name: "notes", label: "Opmerking", type: "textarea" },
];

export const cableFields = [
  { name: "label", label: "Label", type: "text", required: true },
  { name: "type", label: "Type", type: "text" },
  {
    name: "rack_position",
    label: "Start-U",
    type: "number",
    required: true,
  },
  { name: "rack_units", label: "Aantal U", type: "number", required: true },
  { name: "notes", label: "Opmerking", type: "textarea" },
];
