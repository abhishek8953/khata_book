import { useState, useEffect } from "react";
import AdminGenerateLicense from "./AdminGenerateLicense";
import { API_BASE } from "../utils/adminApi";

const AdminLicenses = () => {
  const [licenses, setLicenses] = useState([]);
let adminUrl=API_BASE;
  useEffect(() => {
    fetch(API_BASE+"/licenses")
      .then((res) => res.json())
      .then((res) => {
        setLicenses(res || []);
      });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">License Keys</h2>
      </div>
      
      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {licenses.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No licenses found
                </td>
              </tr>
            ) : (
              licenses.map((l) => {
                const isExpired =
                  l.expiresAt && new Date(l.expiresAt) < new Date();

                const status = isExpired
                  ? "Expired"
                  : l.isUsed
                  ? "Active"
                  : "Unused";

                const statusColor = isExpired
                  ? "bg-red-100 text-red-700"
                  : l.isUsed
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700";

                return (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {l.assignedToSeller?.name || "Unused"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {l.expiresAt
                        ? new Date(l.expiresAt).toDateString()
                        : "No Expiry"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLicenses;
