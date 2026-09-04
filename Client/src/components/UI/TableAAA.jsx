

function Table({ thead, tbody }) {
  console.log(thead, tbody);
  return (
    <table className="table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          {thead.map((header, index) => (
            <th key={index} className="border border-gray-400 px-4 py-2">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tbody.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border border-gray-400 px-4 py-2">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
