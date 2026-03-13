'use client';

import React, { useState } from 'react';
import { HAZOPForm } from '@/components/test/HAZOPForm';
import { PeligroForm } from '@/components/test/PeligroForm';
import { HallazgosList } from '@/components/test/HallazgosList';
import { useSesion } from '@/src/controllers/useSesion';

type ActiveForm = 'hazop' | 'peligro';

export default function Home() {
  const { sesion, obtenerEstadisticas } = useSesion();
  const [activeForm, setActiveForm] = useState<ActiveForm>('hazop');
  const stats = obtenerEstadisticas();

  return (
    <div className="knar-bg-pattern" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '0.5px solid var(--border-10)',
        background: 'var(--knar-dark)',
        position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: 'var(--space-3) var(--space-10)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: 'var(--knar-orange-15)',
              border: '0.5px solid var(--knar-orange-25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--knar-orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-normal)', margin: 0 }}>
                Riesgo App
              </h1>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', margin: 0 }}>Sandbox de pruebas</p>
            </div>
          </div>

          {/* Session stats */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <StatChip label="Análisis" value={stats.totalAnalisis} />
            <StatChip label="Hallazgos" value={stats.totalHallazgos} />
            <StatChip label="Relaciones" value={stats.totalRelaciones} />
            {sesion && (
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
                {sesion.id}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 'var(--space-8) var(--space-10)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left panel: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Form switcher tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--knar-charcoal)',
            border: '0.5px solid var(--border-8)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1)',
            gap: 'var(--space-1)',
          }}>
            <TabButton label="HAZOP" active={activeForm === 'hazop'} onClick={() => setActiveForm('hazop')} />
            <TabButton label="Peligro directo" active={activeForm === 'peligro'} onClick={() => setActiveForm('peligro')} />
          </div>

          {activeForm === 'hazop' && <HAZOPForm />}
          {activeForm === 'peligro' && <PeligroForm />}

          {/* Info card */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--knar-charcoal)',
            border: '0.5px solid var(--border-6)',
            borderRadius: 'var(--radius-md)',
          }}>
            <p className="knar-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Cómo funciona</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 0 }}>
              {[
                ['HAZOP', 'Crea un análisis de tipo HAZOP con nodo, parámetro y palabra guía.'],
                ['Peligro', 'Registra un hallazgo de tipo Peligro directamente (intuición). La ubicación se asigna a (50, 50) como dummy.'],
                ['Lista', 'Los hallazgos y análisis se muestran en tiempo real desde el estado de sesión.'],
              ].map(([title, desc]) => (
                <li key={title} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                  <span style={{ color: 'var(--knar-orange)', fontWeight: 'var(--weight-normal)', flexShrink: 0 }}>{title}:</span>
                  {desc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel: Live results */}
        <div>
          <HallazgosList />
        </div>
      </main>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)' }}>{label}</span>
      <span style={{
        minWidth: 20,
        padding: '0 var(--space-2)',
        height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: value > 0 ? 'var(--knar-orange-12)' : 'var(--border-6)',
        border: `0.5px solid ${value > 0 ? 'var(--knar-orange-25)' : 'var(--border-8)'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        color: value > 0 ? 'var(--knar-orange)' : 'var(--text-disabled)',
        fontWeight: 'var(--weight-normal)',
        fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </span>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        border: active ? '0.5px solid var(--knar-orange-25)' : '0.5px solid transparent',
        background: active ? 'var(--knar-orange-12)' : 'transparent',
        color: active ? 'var(--knar-orange)' : 'var(--text-muted)',
        fontSize: 'var(--text-xs)',
        fontWeight: active ? 'var(--weight-normal)' : 'var(--weight-light)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        letterSpacing: 'var(--tracking-wide)',
      }}
    >
      {label}
    </button>
  );
}
