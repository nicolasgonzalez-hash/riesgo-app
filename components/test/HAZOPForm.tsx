'use client';

import React, { useState } from 'react';
import { useAnalisis } from '@/src/controllers/useAnalisis';
import type { AnalisisHAZOP } from '@/src/models/analisis/types';

interface HAZOPFormProps {
  onCreated?: (id: string) => void;
}

const emptyForm: AnalisisHAZOP = {
  nodo: '',
  parametro: '',
  palabraGuia: '',
  causa: '',
  consecuencia: '',
  salvaguardasExistentes: [],
  recomendaciones: [],
};

export function HAZOPForm({ onCreated }: HAZOPFormProps) {
  const { crearAnalisisHAZOP } = useAnalisis();
  const [form, setForm] = useState<AnalisisHAZOP>(emptyForm);
  const [salvaguardaInput, setSalvaguardaInput] = useState('');
  const [recomendacionInput, setRecomendacionInput] = useState('');
  const [resultado, setResultado] = useState<{ exito: boolean; mensaje: string; id?: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addSalvaguarda() {
    if (!salvaguardaInput.trim()) return;
    setForm(prev => ({ ...prev, salvaguardasExistentes: [...prev.salvaguardasExistentes, salvaguardaInput.trim()] }));
    setSalvaguardaInput('');
  }

  function removeSalvaguarda(idx: number) {
    setForm(prev => ({ ...prev, salvaguardasExistentes: prev.salvaguardasExistentes.filter((_, i) => i !== idx) }));
  }

  function addRecomendacion() {
    if (!recomendacionInput.trim()) return;
    setForm(prev => ({ ...prev, recomendaciones: [...prev.recomendaciones, recomendacionInput.trim()] }));
    setRecomendacionInput('');
  }

  function removeRecomendacion(idx: number) {
    setForm(prev => ({ ...prev, recomendaciones: prev.recomendaciones.filter((_, i) => i !== idx) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = crearAnalisisHAZOP(form);
    if (res.exito) {
      setResultado({ exito: true, mensaje: `HAZOP creado con ID: ${res.id}`, id: res.id });
      setForm(emptyForm);
      setSalvaguardaInput('');
      setRecomendacionInput('');
      onCreated?.(res.id!);
    } else {
      setResultado({ exito: false, mensaje: res.errores.join(' · ') });
    }
  }

  const palabrasGuia = ['No / Ninguno', 'Más de', 'Menos de', 'Inverso', 'Otro que', 'Parte de', 'Además de'];

  return (
    <div className="knar-card" style={{ padding: 'var(--space-5)' }}>
      <div className="knar-card-header" style={{ padding: '0 0 var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="knar-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
        <div className="knar-card-header-text">
          <p className="knar-eyebrow">Análisis</p>
          <h4 className="knar-card-title">Crear HAZOP</h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <FormField label="Nodo" required>
            <input className="knar-input" name="nodo" value={form.nodo} onChange={handleChange} placeholder="Ej: Reactor R-101" required />
          </FormField>
          <FormField label="Parámetro" required>
            <input className="knar-input" name="parametro" value={form.parametro} onChange={handleChange} placeholder="Ej: Presión" required />
          </FormField>
        </div>

        <FormField label="Palabra Guía" required>
          <select className="knar-input" name="palabraGuia" value={form.palabraGuia} onChange={handleChange} required>
            <option value="">Seleccionar...</option>
            {palabrasGuia.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>

        <FormField label="Causa" required>
          <textarea className="knar-input knar-textarea" name="causa" value={form.causa} onChange={handleChange} placeholder="Causa de la desviación..." required rows={2} />
        </FormField>

        <FormField label="Consecuencia" required>
          <textarea className="knar-input knar-textarea" name="consecuencia" value={form.consecuencia} onChange={handleChange} placeholder="Consecuencia si ocurre..." required rows={2} />
        </FormField>

        <FormField label="Salvaguardas Existentes">
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <input
              className="knar-input"
              value={salvaguardaInput}
              onChange={e => setSalvaguardaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSalvaguarda())}
              placeholder="Ej: PSV-101"
              style={{ flex: 1 }}
            />
            <button type="button" className="knar-btn knar-btn-ghost" onClick={addSalvaguarda} style={{ padding: 'var(--space-2) var(--space-3)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
              Agregar
            </button>
          </div>
          <TagList items={form.salvaguardasExistentes} onRemove={removeSalvaguarda} />
        </FormField>

        <FormField label="Recomendaciones">
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <input
              className="knar-input"
              value={recomendacionInput}
              onChange={e => setRecomendacionInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecomendacion())}
              placeholder="Acción recomendada..."
              style={{ flex: 1 }}
            />
            <button type="button" className="knar-btn knar-btn-ghost" onClick={addRecomendacion} style={{ padding: 'var(--space-2) var(--space-3)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
              Agregar
            </button>
          </div>
          <TagList items={form.recomendaciones} onRemove={removeRecomendacion} />
        </FormField>

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
          Crear HAZOP
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

function TagList({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
          padding: 'var(--space-1) var(--space-2-5)',
          background: 'var(--knar-orange-10)', border: '0.5px solid var(--knar-orange-20)',
          borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--knar-orange)',
        }}>
          {item}
          <button
            type="button"
            onClick={() => onRemove(i)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
      ))}
    </div>
  );
}
