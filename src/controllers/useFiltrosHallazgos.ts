/**
 * ============================================================================
 * USE FILTROS HALLAZGOS - Hallazgos Filter Management Hook
 * ============================================================================
 * 
 * This hook provides management operations for filtering hallazgos by:
 * - Type (Peligro, Barrera, POE, SOL)
 * - Search text
 * - Analysis origin
 * - Location range
 * - Relationship status
 * 
 * Features:
 * - Filter state management
 * - Toggle filters on/off
 * - Search text filtering
 * - Count by type
 * - Filter statistics
 * - Immutable state updates
 * 
 * @module controllers/useFiltrosHallazgos
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Hallazgo, TipoHallazgo } from '../models/hallazgo/types';

import { useSesionContext } from '../lib/state/SessionContext';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Filter configuration options.
 */
export interface FiltroConfig {
  /** Available filter types */
  tiposDisponibles: TipoHallazgo[];

  /** Case-sensitive search */
  busquedaCaseSensitive: boolean;
}

/**
 * Location range for spatial filtering.
 */
export interface UbicacionRango {
  /** Minimum X (0-100) */
  xMin: number;

  /** Maximum X (0-100) */
  xMax: number;

  /** Minimum Y (0-100) */
  yMin: number;

  /** Maximum Y (0-100) */
  yMax: number;
}

/**
 * Filter options for hallazgos.
 */
export interface FiltroOpciones {
  /** Filter by type */
  tipos?: TipoHallazgo[];

  /** Filter by search text */
  busqueda?: string;

  /** Filter by location range */
  ubicacionRango?: UbicacionRango;

  /** Filter by analysis origin ID */
  analisisOrigenId?: string;

  /** Filter by relationship status */
  conRelaciones?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: FiltroConfig = {
  tiposDisponibles: ['Peligro', 'Barrera', 'POE', 'SOL'],
  busquedaCaseSensitive: false,
};

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useFiltrosHallazgos hook.
 */
export interface UseFiltrosHallazgosReturn {
  // Filter State
  /** Active filter types */
  filtrosActivos: TipoHallazgo[];

  /** All available filter types */
  todosLosFiltros: TipoHallazgo[];

  /** Current search text */
  busquedaTexto: string;

  // Filter Actions
  /** Activate a filter type */
  activarFiltro: (tipo: TipoHallazgo) => void;

  /** Deactivate a filter type */
  desactivarFiltro: (tipo: TipoHallazgo) => void;

  /** Toggle filter type on/off */
  toggleFiltro: (tipo: TipoHallazgo) => void;

  /** Activate all filter types */
  activarTodos: () => void;

  /** Deactivate all filter types */
  desactivarTodos: () => void;

  /** Update search text */
  actualizarBusqueda: (texto: string) => void;

  /** Clear all filters */
  limpiarFiltros: () => void;

  // Query Functions
  /** Get filtered hallazgos */
  hallazgosFiltrados: () => Hallazgo[];

  /** Get count by type */
  contarPorTipo: () => Record<TipoHallazgo, number>;

  /** Check if any filters are active */
  hayFiltrosActivos: () => boolean;

  /** Get count of active filters */
  filtrosActivosCount: () => number;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hallazgos filter management controller hook.
 * Provides operations for filtering hallazgos by various criteria.
 * 
 * @param config - Optional filter configuration
 * @returns Filter state and management functions
 * 
 * @example
 * // Basic usage
 * function FilterPanel() {
 *   const {
 *     filtrosActivos,
 *     toggleFiltro,
 *     hallazgosFiltrados,
 *     contarPorTipo
 *   } = useFiltrosHallazgos();
 * 
 *   const counts = contarPorTipo();
 *   const filtrados = hallazgosFiltrados();
 * 
 *   return (
 *     <div>
 *       {todosLosFiltros.map(tipo => (
 *         <label key={tipo}>
 *           <input
 *             type="checkbox"
 *             checked={filtrosActivos.includes(tipo)}
 *             onChange={() => toggleFiltro(tipo)}
 *           />
 *           {tipo} ({counts[tipo] || 0})
 *         </label>
 *       ))}
 *       <p>Mostrando: {filtrados.length} hallazgos</p>
 *     </div>
 *   );
 * }
 */
export function useFiltrosHallazgos(config?: Partial<FiltroConfig>): UseFiltrosHallazgosReturn {
  // Merge config with defaults
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Get session context
  const { sesion } = useSesionContext();

  // Filter state (local, not in session)
  const [filtrosActivos, setFiltrosActivos] = useState<TipoHallazgo[]>(
    mergedConfig.tiposDisponibles
  );
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================

  /**
   * Activate a filter type.
   * 
   * @param tipo - Filter type to activate
   * 
   * @example
   * activarFiltro('Peligro');
   */
  const activarFiltro = useCallback((tipo: TipoHallazgo): void => {
    setFiltrosActivos((prev) => {
      if (prev.includes(tipo)) {
        return prev; // Already active
      }
      return [...prev, tipo];
    });
  }, []);

  /**
   * Deactivate a filter type.
   * 
   * @param tipo - Filter type to deactivate
   * 
   * @example
   * desactivarFiltro('Peligro');
   */
  const desactivarFiltro = useCallback((tipo: TipoHallazgo): void => {
    setFiltrosActivos((prev) => prev.filter((t) => t !== tipo));
  }, []);

  /**
   * Toggle filter type on/off.
   * 
   * @param tipo - Filter type to toggle
   * 
   * @example
   * toggleFiltro('Peligro');
   */
  const toggleFiltro = useCallback((tipo: TipoHallazgo): void => {
    setFiltrosActivos((prev) => {
      if (prev.includes(tipo)) {
        return prev.filter((t) => t !== tipo);
      } else {
        return [...prev, tipo];
      }
    });
  }, []);

  /**
   * Activate all filter types.
   * 
   * @example
   * activarTodos();
   */
  const activarTodos = useCallback((): void => {
    setFiltrosActivos(mergedConfig.tiposDisponibles);
  }, [mergedConfig.tiposDisponibles]);

  /**
   * Deactivate all filter types.
   * 
   * @example
   * desactivarTodos();
   */
  const desactivarTodos = useCallback((): void => {
    setFiltrosActivos([]);
  }, []);

  /**
   * Update search text.
   * 
   * @param texto - New search text
   * 
   * @example
   * actualizarBusqueda('reactor');
   */
  const actualizarBusqueda = useCallback((texto: string): void => {
    setBusquedaTexto(texto);
  }, []);

  /**
   * Clear all filters (types and search).
   * 
   * @example
   * limpiarFiltros();
   */
  const limpiarFiltros = useCallback((): void => {
    setFiltrosActivos(mergedConfig.tiposDisponibles);
    setBusquedaTexto('');
  }, [mergedConfig.tiposDisponibles]);

  // ============================================================================
  // QUERY FUNCTIONS
  // ============================================================================

  /**
   * Get filtered hallazgos.
   * 
   * @returns Array of hallazgos matching active filters
   * 
   * @example
   * const filtrados = hallazgosFiltrados();
   * console.log(`Mostrando ${filtrados.length} hallazgos`);
   */
  const hallazgosFiltrados = useCallback((): Hallazgo[] => {
    if (!sesion) {
      return [];
    }

    return sesion.hallazgos.filter((h) => {
      // Filter by type
      if (filtrosActivos.length > 0 && !filtrosActivos.includes(h.tipo)) {
        return false;
      }

      // Filter by search text
      if (busquedaTexto.trim()) {
        const searchFn = mergedConfig.busquedaCaseSensitive
          ? (str: string) => str.includes(busquedaTexto)
          : (str: string) => str.toLowerCase().includes(busquedaTexto.toLowerCase());

        const coincideTitulo = searchFn(h.titulo);
        const coincideDescripcion = searchFn(h.descripcion);

        // Search in type-specific fields
        let coincideCampoEspecifico = false;
        if (h.tipo === 'Peligro') {
          coincideCampoEspecifico =
            searchFn((h as any).consecuencia || '') ||
            searchFn((h as any).causaRaiz || '');
        } else if (h.tipo === 'Barrera') {
          coincideCampoEspecifico =
            searchFn((h as any).elementoProtegido || '') ||
            searchFn((h as any).tipoBarrera || '');
        } else if (h.tipo === 'POE') {
          coincideCampoEspecifico =
            searchFn((h as any).procedimientoReferencia || '') ||
            searchFn((h as any).responsable || '');
        } else if (h.tipo === 'SOL') {
          coincideCampoEspecifico =
            searchFn((h as any).tipoTecnologia || '');
        }

        if (!coincideTitulo && !coincideDescripcion && !coincideCampoEspecifico) {
          return false;
        }
      }

      return true;
    });
  }, [sesion, filtrosActivos, busquedaTexto, mergedConfig.busquedaCaseSensitive]);

  /**
   * Get count by type.
   * 
   * @returns Object with count for each type
   * 
   * @example
   * const counts = contarPorTipo();
   * console.log(`Peligros: ${counts.Peligro}`);
   */
  const contarPorTipo = useCallback((): Record<TipoHallazgo, number> => {
    if (!sesion) {
      return {
        Peligro: 0,
        Barrera: 0,
        POE: 0,
        SOL: 0,
      };
    }

    const counts: Record<TipoHallazgo, number> = {
      Peligro: 0,
      Barrera: 0,
      POE: 0,
      SOL: 0,
    };

    sesion.hallazgos.forEach((h) => {
      counts[h.tipo]++;
    });

    return counts;
  }, [sesion]);

  /**
   * Check if any filters are active.
   * 
   * @returns True if filters or search are active
   * 
   * @example
   * if (hayFiltrosActivos()) {
   *   console.log('Hay filtros activos');
   * }
   */
  const hayFiltrosActivos = useCallback((): boolean => {
    const tiposNoTodosActivos =
      filtrosActivos.length > 0 &&
      filtrosActivos.length < mergedConfig.tiposDisponibles.length;

    const busquedaActiva = busquedaTexto.trim() !== '';

    return tiposNoTodosActivos || busquedaActiva;
  }, [filtrosActivos, mergedConfig.tiposDisponibles.length, busquedaTexto]);

  /**
   * Get count of active filters.
   * 
   * @returns Number of active filter types
   * 
   * @example
   * const count = filtrosActivosCount();
   * console.log(`${count} filtros activos`);
   */
  const filtrosActivosCount = useCallback((): number => {
    return filtrosActivos.length;
  }, [filtrosActivos]);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Filter State
      filtrosActivos,
      todosLosFiltros: mergedConfig.tiposDisponibles,
      busquedaTexto,

      // Filter Actions
      activarFiltro,
      desactivarFiltro,
      toggleFiltro,
      activarTodos,
      desactivarTodos,
      actualizarBusqueda,
      limpiarFiltros,

      // Query Functions
      hallazgosFiltrados,
      contarPorTipo,
      hayFiltrosActivos,
      filtrosActivosCount,
    }),
    [
      filtrosActivos,
      mergedConfig.tiposDisponibles,
      busquedaTexto,
      activarFiltro,
      desactivarFiltro,
      toggleFiltro,
      activarTodos,
      desactivarTodos,
      actualizarBusqueda,
      limpiarFiltros,
      hallazgosFiltrados,
      contarPorTipo,
      hayFiltrosActivos,
      filtrosActivosCount,
    ]
  );
}
