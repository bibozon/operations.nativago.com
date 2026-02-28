import React from "react";

type AddSlotForm = {
  date: string;
  time: string;
  capacity: number | string;
};

type AddSlotModalProps = {
  open?: boolean;
  onClose: () => void;
  onSave: () => void;
  form: AddSlotForm;
  onChange: (field: keyof AddSlotForm, value: string | number) => void;
};

export function AddSlotModal({ open, onClose, onSave, form, onChange }: AddSlotModalProps) {
  if (!open) return null;
  return (
    <div className="modal">
      <div className="modal-content flex flex-col gap-4">
        <input className="input" type="date" value={form.date} onChange={e => onChange("date", e.target.value)} />
        <input className="input" type="time" value={form.time} onChange={e => onChange("time", e.target.value)} />
        <input className="input" type="number" min={1} max={50} value={form.capacity} onChange={e => onChange("capacity", e.target.value)} />
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={onSave}>Guardar</button>
          <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
