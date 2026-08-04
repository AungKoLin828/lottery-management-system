interface Column<T> {
  key: keyof T;
  label: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          {columns.map((col) => (
            <th key={String(col.key)} className="p-3 text-left">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="border-b">
            {columns.map((col) => (
              <td key={String(col.key)} className="p-3">
                {String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
