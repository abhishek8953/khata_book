import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 ${className}`}>
    {children}
  </div>
);

export const Table = ({ headers, data, actions, className = '' }) => {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="px-4 sm:px-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              {headers.map((header, idx) => (
                <th key={idx} className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  {header}
                </th>
              ))}
              {actions && <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
              data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition">
                  {Object.entries(row)
                    .filter(([key]) => !key.endsWith('Id') && key !== '_id')
                    .map(([key, cell], cidx) => (
                    <td key={cidx} className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 break-words">
                      <span className="block overflow-hidden text-ellipsis">
                        {cell}
                      </span>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-sm">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500 text-sm sm:text-base">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50'
  }[color];

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  }[color];

  return (
    <div className={`${bgColor} rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4`}>
      {Icon && <Icon className={`${textColor} w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0`} />}
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-600">{title}</p>
        <p className={`text-lg sm:text-2xl font-bold ${textColor} break-words`}>{value}</p>
      </div>
    </div>
  );
};
