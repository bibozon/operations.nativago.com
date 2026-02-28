import React from "react";

export function SlotList({ slots, onAdd }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-lg">Disponibilidad</h2>
        <button className="btn-primary" onClick={onAdd}>Agregar slot</button>
      </div>
      <ul className="flex flex-col gap-2">
        {slots.map(slot => (
          <li key={slot.id} className="rounded bg-slate-50 p-3 flex justify-between items-center">
            <span>{slot.date} {slot.time}</span>
            <span className="bg-emerald-100 text-emerald-700 rounded px-2">{slot.capacity} pax</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
