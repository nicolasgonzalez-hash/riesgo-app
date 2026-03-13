'use client';

import React from 'react';
import { useHallazgo } from '@/src/controllers/useHallazgo';
import { useAnalisis } from '@/src/controllers/useAnalisis';
import type { Hallazgo, Peligro, Barrera } from '@/src/models/hallazgo/types';
import type { AnalisisOrigen } from '@/src/models/analisis/types';

const TIPO_COLORS: Record<string, string> = {
  Peligro:  'rgba(239,68,68,0.12)',
  Barrera:  'rgba(59,130,246,0.12)',
  POE:      'rgba(234,179,8,0.12)',
  SOL:      'rgba(34,197,94,0.12)',
};

const TIPO_TEXT_COLORS: Record<string, string> = {
  Peligro:  '#fca5a5',
  Barrera:  '#93c5fd',
  POE:      '#fde047',
  SOL:      '#86efac',
};

const TIPO_BORDER: Record<string, string> = {
  Peligro:  'rgba(239,68,68,0.25)',
  Barrera:  'rgba(59,130,246,0.25)',
  POE:      'rgba(234,179,8,0.25)',
  SOL:      'rgba(34,197,94,0.25)',
};

export function HallazgosList() {
  const { hallazgos, eliminarHallazgo } = useHallazgo();
  const { analisis } = useAnalisis();

  if (hallazgos.length === 0) {
    return (
      <div className="knar-card" style={{ padding: 'var(--space-5)' }}>
        <div className="knar-card-header" style={{ padding: '0 0 var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div className="knar-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
          </div>
          <div className="knar-card-header-text">
            <p className="knar-eyebrow">Resultados</p>
            <h4 className="knar-card-title">Hallazgos registrados</h4>
          </div>
        </div>
        <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          No hay hallazgos aún. Registra un HAZOP o un Peligro.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header Card */}
      <div className="knar-card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="knar-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
            </div>
            <div>
              <p className="knar-eyebrow">Resultados</p>
              <h4 className="knar-card-title">Hallazgos registrados</h4>
            </div>
          </div>
          <CountBadges hallazgos={hallazgos} />
        </div>
      </div>

      {/* Analisis Section */}
      {analisis.length > 0 && (
        <div className="knar-card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <p className="knar-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Análisis en sesión</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {analisis.map(a => <AnalisisRow key={a.base.id} analisis={a} />)}
          </div>
        </div>
      )}

      {/* Hallazgos list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {hallazgos.map(h => (
          <HallazgoRow key={h.id} hallazgo={h} onDelete={() => eliminarHallazgo(h.id)} />
        ))}
      </div>
    </div>
  );
}

function CountBadges({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const counts: Record<string, number> = {};
  hallazgos.forEach(h => { counts[h.tipo] = (counts[h.tipo] || 0) + 1; });
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {Object.entries(counts).map(([tipo, count]) => (
        <span key={tipo} style={{
          padding: 'var(--space-1) var(--space-2-5)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          background: TIPO_COLORS[tipo] || 'var(--knar-orange-10)',
          border: `0.5px solid ${TIPO_BORDER[tipo] || 'var(--knar-orange-20)'}`,
          color: TIPO_TEXT_COLORS[tipo] || 'var(--knar-orange)',
        }}>
          {tipo}: {count}
        </span>
      ))}
    </div>
  );
}

function AnalisisRow({ analisis }: { analisis: AnalisisOrigen }) {
  const datos = analisis.datos as Record<string, unknown>;
  const titulo = (datos.nodo || datos.componente || datos.titulo || datos.escenario || datos.eventoIniciador || analisis.base.id) as string;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-2) var(--space-3)',
      background: 'var(--knar-orange-5)',
      border: '0.5px solid var(--border-6)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{
          padding: 'var(--space-0-5) var(--space-2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-3xs)',
          fontWeight: 'var(--weight-medium)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          background: 'var(--knar-orange-15)',
          border: '0.5px solid var(--knar-orange-25)',
          color: 'var(--knar-orange)',
        }}>
          {analisis.base.tipo}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{titulo}</span>
      </div>
      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
        {analisis.base.id.slice(0, 22)}…
      </span>
    </div>
  );
}

function HallazgoRow({ hallazgo, onDelete }: { hallazgo: Hallazgo; onDelete: () => void }) {
  const [confirmando, setConfirmando] = React.useState(false);

  function handleDelete() {
    if (!confirmando) { setConfirmando(true); return; }
    onDelete();
    setConfirmando(false);
  }

  const extraInfo = getExtraInfo(hallazgo);

  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--card)',
      border: `0.5px solid ${TIPO_BORDER[hallazgo.tipo] || 'var(--border-10)'}`,
      borderRadius: 'var(--radius-md)',
      borderLeft: `2px solid ${TIPO_TEXT_COLORS[hallazgo.tipo] || 'var(--accent)'}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)',
      transition: 'background 200ms ease',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1-5)' }}>
          <span style={{
            padding: 'var(--space-0-5) var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-3xs)',
            fontWeight: 'var(--weight-medium)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            background: TIPO_COLORS[hallazgo.tipo],
            border: `0.5px solid ${TIPO_BORDER[hallazgo.tipo]}`,
            color: TIPO_TEXT_COLORS[hallazgo.tipo],
          }}>
            {hallazgo.tipo}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--weight-normal)' }}>
            {hallazgo.titulo}
          </span>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', lineHeight: 'var(--leading-normal)' }}>
          {hallazgo.descripcion}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {extraInfo.map(([key, val]) => (
            <span key={key} style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{key}:</span> {val}
            </span>
          ))}
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
            pos({hallazgo.ubicacion.x}, {hallazgo.ubicacion.y})
          </span>
        </div>
      </div>
      <button
        onClick={handleDelete}
        onBlur={() => setConfirmando(false)}
        style={{
          flexShrink: 0,
          padding: 'var(--space-1-5) var(--space-2-5)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          cursor: 'pointer',
          border: `0.5px solid ${confirmando ? 'rgba(239,68,68,0.40)' : 'var(--border-8)'}`,
          background: confirmando ? 'rgba(239,68,68,0.12)' : 'transparent',
          color: confirmando ? '#fca5a5' : 'var(--text-muted)',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        {confirmando ? 'Confirmar' : 'Eliminar'}
      </button>
    </div>
  );
}

function getExtraInfo(h: Hallazgo): [string, string][] {
  if (h.tipo === 'Peligro') {
    const p = h as Peligro;
    return [['Severidad', String(p.severidad)], ['Causa', p.causaRaiz.slice(0, 40)]];
  }
  if (h.tipo === 'Barrera') {
    const b = h as Barrera;
    return [['Tipo', b.tipoBarrera], ['Efectividad', String(b.efectividadEstimada)]];
  }
  return [];
}
