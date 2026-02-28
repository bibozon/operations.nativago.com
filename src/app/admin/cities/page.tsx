import React from "react";

export default function CitiesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cities</h1>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium">Add City</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border rounded-xl">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-slate-500">City</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Status</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-2">Búzios</td>
              <td className="px-4 py-2"><span className="bg-emerald-100 text-emerald-700 rounded px-2 py-0.5 text-xs">Active</span></td>
              <td className="px-4 py-2">
                <button className="text-emerald-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-2">Cabo Frio</td>
              <td className="px-4 py-2"><span className="bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 text-xs">Inactive</span></td>
              <td className="px-4 py-2">
                <button className="text-emerald-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
