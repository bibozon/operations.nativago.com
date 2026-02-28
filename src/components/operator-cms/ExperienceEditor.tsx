import React from "react";

export function ExperienceEditor({ form, onChange, onSave, onCancel }) {
  return (
    <form className="flex flex-col gap-4 p-4">
      <input className="input" placeholder="Título" value={form.title} onChange={e => onChange("title", e.target.value)} />
      <textarea className="input" placeholder="Descripción" value={form.description} onChange={e => onChange("description", e.target.value)} />
      <input className="input" type="number" placeholder="Precio" value={form.price} onChange={e => onChange("price", e.target.value)} />
      <input className="input" type="number" placeholder="Duración (minutos)" value={form.duration} onChange={e => onChange("duration", e.target.value)} />
      <select className="input" value={form.city} onChange={e => onChange("city", e.target.value)}>
        {/* Opciones de ciudades */}
      </select>
      <select className="input" value={form.category} onChange={e => onChange("category", e.target.value)}>
        {/* Opciones de categorías */}
      </select>
      <input className="input" type="file" onChange={e => onChange("image", e.target.files[0])} />
      <div className="flex gap-2 mt-4">
        <button type="button" className="btn-primary flex-1" onClick={onSave}>Guardar</button>
        <button type="button" className="btn-outline flex-1" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
