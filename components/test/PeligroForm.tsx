'use client';

import React, { useState } from 'react';
import { useHallazgo } from '@/src/controllers/useHallazgo';
import type { CrearPeligroDTO } from '@/src/controllers/useHallazgo';
import type { Severidad } from '@/src/models/hallazgo/types';

interface PeligroFormProps {
  onCreated?: (id: string) => void;
}

const emptyForm: CrearPeligroDTO = {
  titulo: '',
  descripcion: '',
  consecuencia: '',
  severidad: 3,
  causaRaiz: '',
};

const SEVERIDAD_LABELS: Record<Severidad, string> = {
  1: '1 — Insignificante',
  2: '2 — Menor',
  3: '3 — Moderado',
  4: '4 — Mayor',
  5: '5 — Catastrófico',
};

const SEVERIDAD_COLORS: Record<Severidad, string> = {
  1: 'rgba(34,197,94,0.15)',
  2: 'rgba(234,179,8,0.15)',
  3: 'rgba(249,115,22,0.15)',
  4: 'rgba(239,68,68,0.15)',
  5: 'rgba(220,38,38,0.20)',
};

export function PeligroForm({ onCreated }: PeligroFormProps) {
  const { crearPeligro } = useHallazgo();
  const [form, setForm] = useState<CrearPeligroDTO>(emptyForm);
  const [resultado, setResultado] = useState<{ exito: boolean; mensaje: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'severidad' ? (Number(value) as Severidad) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Use dummy location (center of map)
    const res = crearPeligro(form, { x: 50, y: 50 });
    if (res.exito) {
      setResultado({ exito: true, mensaje: `Peligro registrado con ID: ${res.id}` });
      setForm(emptyForm);
      onCreated?.(res.id!);
    } else {
      setResultado({ exito: false, mensaje: res.errores.join(' · ') });
    }
  }

  const severidadColor = SEVERIDAD_COLORS[form.severidad as Severidad];

  return (
    <div className="knar-card" style={{ padding: 'var(--space-5)' }}>
      <div className="knar-card-header" style={{ padding: '0 0 var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="knar-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="knar-card-header-text">
          <p className="knar-eyebrow">Hallazgo</p>
          <h4 className="knar-card-title">Registrar Peligro</h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <FormField label="Título" required>
          <input className="knar-input" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej: Sobrepresión en Reactor" required />
        </FormField>

        <FormField label="Descripción" required>
          <textarea className="knar-input knar-textarea" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción detallada del peligro..." required rows={2} />
        </FormField>

        <FormField label="Consecuencia" required>
          <textarea className="knar-input knar-textarea" name="consecuencia" value={form.consecuencia} onChange={handleChange} placeholder="Consecuencia si el peligro se realiza..." required rows={2} />
        </FormField>

        <FormField label="Causa Raíz" required>
          <input className="knar-input" name="causaRaiz" value={form.causaRaiz} onChange={handleChange} placeholder="Ej: Falla en válvula de control" required />
        </FormField>

        <FormField label="Severidad" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <select
              className="knar-input"
              name="severidad"
              value={form.severidad}
              onChange={handleChange}
              style={{ background: severidadColor }}
            >
              {([1, 2, 3, 4, 5] as Severidad[]).map(s => (
                <option key={s} value={s}>{SEVERIDAD_LABELS[s]}</option>
              ))}
            </select>
            <SeverityBar value={form.severidad as Severidad} />
          </div>
        </FormField>

        <div style={{
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--knar-orange-5)',
          border: '0.5px solid var(--border-6)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}>
          Ubicacion: coordenada dummy (50, 50) — centro del mapa
        </div>

        {resultado && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            background: resultado.exito ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `0.5px solid ${resultado.exito ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: resultado.exito ? '#86efac' : '#fca5a5',
          }}>
            {resultado.mensaje}
          </div>
        )}

        <button type="submit" className="knar-btn knar-btn-primary" style={{ alignSelf: 'flex-start' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
          Registrar Peligro
        </button>
      </form>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-normal)', letterSpacing: 'var(--tracking-wide)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SeverityBar({ value }: { value: Severidad }) {
  const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626'];
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i <= value ? colors[i - 1] : 'var(--border-10)',
            transition: 'background 200ms ease',
          }}
        />
      ))}
    </div>
  );
}
