import React from "react";

export interface ExperienceCardProps {
  experience: {
    image: string;
    title: string;
    city: string;
    category: string;
    price: number;
    duration: number;
  };
  onEdit: () => void;
  onCalendar: () => void;
}

export function ExperienceCard({ experience, onEdit, onCalendar }: ExperienceCardProps) {
  return (
    <div className="rounded-xl bg-white shadow p-4 flex flex-col gap-2">
      <img src={experience.image} alt={experience.title} className="rounded-lg h-32 w-full object-cover" />
      <div className="font-bold text-lg">{experience.title}</div>
      <div className="flex gap-2 text-sm">
        <span className="bg-blue-100 text-blue-700 rounded px-2">{experience.city}</span>
        <span className="bg-orange-100 text-orange-700 rounded px-2">{experience.category}</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="font-semibold text-emerald-700">${experience.price}</span>
        <span className="text-xs text-slate-500">{experience.duration} min</span>
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn-primary flex-1" onClick={onEdit}>Editar</button>
        <button className="btn-outline flex-1" onClick={onCalendar}>Calendario</button>
      </div>
    </div>
  );
}
