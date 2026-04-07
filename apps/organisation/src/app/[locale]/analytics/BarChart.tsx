function BarChart({
  category1,
  category2,
  category3,
  percent1,
  percent2,
  percent3,
}: {
  category1?: string;
  category2?: string;
  category3?: string;
  percent1?: string;
  percent2?: string;
  percent3?: string;
}) {
  const rows = [
    { category: category1, percent: percent1 },
    { category: category2, percent: percent2 },
    { category: category3, percent: percent3 },
  ].filter(
    ({ category, percent }) => category !== undefined && percent !== undefined,
  );

  return (
    <table className="w-full border-separate border-spacing-y-3">
      <tbody>
        {rows.map(({ category, percent }, i) => {
          const numericValue = parseFloat(percent!);
          const validWidth = isNaN(numericValue) ? "0%" : `${numericValue}%`;

          return (
            <tr key={i}>
              <td className="w-24 pr-4 max-w-48">
                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap truncate block">
                  {category}
                </span>
              </td>
              <td className="w-full px-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: validWidth }}
                  />
                </div>
              </td>
              <td className="w-16 pl-4 text-right">
                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap">
                  {isNaN(numericValue) ? "0%" : percent}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default BarChart;
