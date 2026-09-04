import {useState} from "react";
import Header from "../components/Header";

function PatchPlan() {
  const [VanDeviceNaam, setVanDeviceNaam] = useState("");
  const [VanDevicePoort, setVanDevicePoort] = useState("");
  const [VanDeviceStatus, setVanDeviceStatus] = useState(false);
  const [NaarDeviceNaam, setNaarDeviceNaam] = useState("");
  const [NaarDevicePoort, setNaarDevicePoort] = useState("");
  const [NaarDeviceStatus, setNaarDeviceStatus] = useState(false);

  return (
    <>
      <Header />

      <h1 className="text-xl font-bold p-4">Patch Plan : #patch-plan-01#</h1>

      <table className="w-full border-collapse text-sm">
        <caption className="text-left p-2 font-semibold">
          Patch plan — Patchpaneel-01
        </caption>

        <thead className="text-left">
          <tr>
            <th className="border p-2 bg-gray-100 " colSpan={3}>
              Van Device
            </th>
            <th
              className="border p-2 bg-gray-200 border-l-4 border-l-gray-500"
              colSpan={3}
            >
              Naar Device
            </th>
          </tr>
          <tr>
            <th className="border p-2 bg-gray-50">Device naam</th>
            <th className="border p-2 bg-gray-50">Poort</th>
            <th className="border p-2 bg-gray-50">Status</th>
            <th className="border p-2 bg-gray-100 border-l-4 border-l-gray-500">
              Device naam
            </th>
            <th className="border p-2 bg-gray-100">Poort</th>
            <th className="border p-2 bg-gray-100">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            {/* Van Device */ ""}
            <td className="border p-2">
              <input
                type="text"
                placeholder="leeg"
                className="w-full border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 p-1"
                value={VanDeviceNaam}
                onChange={(e) => setVanDeviceNaam(e.target.value)}
              />
            </td>
            <td className="border p-2">
              <input
                type="text"
                placeholder="leeg"
                className="w-full border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 p-1"
                value={VanDevicePoort}
                onChange={(e) => setVanDevicePoort(e.target.value)}
              />
            </td>
            <td className="border p-2">
              <label className="relative inline-flex items-center cursor-pointer w-14 h-7">
                <input
                  type="checkbox"
                  defaultChecked={VanDeviceStatus}
                  className="sr-only peer"
                  onChange={(e) => setVanDeviceStatus(e.target.checked)}
                />
                <div className="absolute inset-0 bg-red-500 peer-checked:bg-green-500 rounded-full transition-colors duration-200"></div>

                <span className="absolute right-1.5 text-white text-[10px] font-bold peer-checked:opacity-0 opacity-100 transition-opacity">
                  OFF
                </span>

                <span className="absolute left-1.5 text-white text-[10px] font-bold opacity-0 peer-checked:opacity-100 transition-opacity">
                  ON
                </span>

                <div className="absolute left-1 peer-checked:left-8 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow"></div>
              </label>
            </td>

            {/* Naar Device */}
            <td className="border p-2">
              <input
                type="text"
                placeholder="leeg"
                className="w-full border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 p-1"
                value={NaarDeviceNaam}
                onChange={(e) => setNaarDeviceNaam(e.target.value)}
              />
            </td>
            <td className="border p-2">
              <input
                type="text"
                placeholder="leeg"
                className="w-full border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 p-1"
                value={NaarDevicePoort}
                onChange={(e) => setNaarDevicePoort(e.target.value)}
              />
            </td>
            <td className="border p-2">
              <label className="relative inline-flex items-center cursor-pointer w-14 h-7">
                <input
                  type="checkbox"
                  defaultChecked={NaarDeviceStatus}
                  className="sr-only peer"
                  onChange={(e) => setNaarDeviceStatus(e.target.checked)}
                />
                <div className="absolute inset-0 bg-red-500 peer-checked:bg-green-500 rounded-full transition-colors duration-200"></div>

                <span className="absolute right-1.5 text-white text-[10px] font-bold peer-checked:opacity-0 opacity-100 transition-opacity">
                  OFF
                </span>

                <span className="absolute left-1.5 text-white text-[10px] font-bold opacity-0 peer-checked:opacity-100 transition-opacity">
                  ON
                </span>

                <div className="absolute left-1 peer-checked:left-8 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow"></div>
              </label>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td className="border p-2" colSpan={6}>
              5 verbindingen gepland vanaf Patchpaneel-01 — 4 doeldevices
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

export default PatchPlan;
