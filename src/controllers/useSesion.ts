/**
 * ============================================================================
 * USE SESION - Session Management Controller Hook
 * ============================================================================
 * 
 * This hook provides a convenient API for session management operations.
 * It wraps the SessionContext and adds business logic, statistics, and
 * helper functions.
 * 
 * Features:
 * - Session lifecycle management (start, close, reset)
 * - Session statistics
 * - Immutable state updates
 * - Memoized callbacks for performance
 * 
 * @module controllers/useSesion
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { Sesion } from '../models/sesion/types';
import { useSesionContext, obtenerEstadisticasDeSesion } from '../lib/state/SessionContext';
import { clonarSesion } from '../models/utils/transformadores';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useSesion hook.
 */
interface UseSesionReturn {
  // Estado
  /** Current session (null if not initialized) */
  sesion: Sesion | null;
  
  /** Whether session has been loaded/initialized */
  sesionCargada: boolean;
  
  // Funciones de ciclo de vida
  /** Start a new session */
  iniciarSesion: () => void;
  
  /** Close current session (clear all data) */
  cerrarSesion: () => void;
  
  /** Reset session to initial empty state */
  reiniciarSesion: () => void;
  
  // Utilidades
  /** Get session statistics */
  obtenerEstadisticas: () => ReturnType<typeof obtenerEstadisticasDeSesion>;
  
  /** Clone current session (for undo/redo) */
  clonarSesionActual: () => Sesion | null;
  
  // Dispatcher directo (para operaciones avanzadas)
  /** Direct dispatch function for advanced operations */
  dispatch: React.Dispatch<any>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Session management controller hook.
 * Provides convenient API for session operations.
 * 
 * @returns Session state and management functions
 * 
 * @example
 * // Basic usage in component
 * function MiComponente() {
 *   const { sesion, sesionCargada, iniciarSesion } = useSesion();
 *   
 *   if (!sesionCargada) {
 *     return <button onClick={iniciarSesion}>Iniciar Sesión</button>;
 *   }
 *   
 *   return <div>Sesión {sesion.id}</div>;
 * }
 * 
 * @example
 * // Get statistics
 * const { obtenerEstadisticas } = useSesion();
 * const stats = obtenerEstadisticas();
 * console.log(`Total hallazgos: ${stats.totalHallazgos}`);
 */
export function useSesion(): UseSesionReturn {
  // Get context (throws if not within provider)
  const context = useSesionContext();
  
  const { sesion, sesionCargada, dispatch } = context;

  // ============================================================================
  // LIFECYCLE FUNCTIONS
  // ============================================================================

  /**
   * Start a new session.
   * Creates a new empty session with default values.
   * 
   * @example
   * const { iniciarSesion } = useSesion();
   * iniciarSesion(); // Creates new session
   */
  const iniciarSesion = useCallback(() => {
    dispatch({ type: 'INICIAR_SESION' });
  }, [dispatch]);

  /**
   * Close current session.
   * Clears all data and sets sesionCargada to false.
   * 
   * @example
   * const { cerrarSesion } = useSesion();
   * cerrarSesion(); // Session cleared
   */
  const cerrarSesion = useCallback(() => {
    dispatch({ type: 'CERRAR_SESION' });
  }, [dispatch]);

  /**
   * Reset session to initial empty state.
   * Similar to iniciarSesion but doesn't change sesionCargada.
   * 
   * @example
   * const { reiniciarSesion } = useSesion();
   * reiniciarSesion(); // Session reset to empty
   */
  const reiniciarSesion = useCallback(() => {
    dispatch({ type: 'REINICIAR_SESION' });
  }, [dispatch]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get session statistics.
   * Returns counts and breakdowns of session entities.
   * 
   * @returns Statistics object with counts by type
   * 
   * @example
   * const { obtenerEstadisticas } = useSesion();
   * const stats = obtenerEstadisticas();
   * 
   * console.log('Resumen de sesión:', {
   *   analisis: stats.totalAnalisis,
   *   hallazgos: stats.totalHallazgos,
   *   relaciones: stats.totalRelaciones,
   *   huerfanos: stats.hallazgosHuerfanos,
   * });
   */
  const obtenerEstadisticas = useCallback((): ReturnType<typeof obtenerEstadisticasDeSesion> => {
    return obtenerEstadisticasDeSesion(sesion);
  }, [sesion]);

  /**
   * Clone current session.
   * Creates a deep copy for undo/redo functionality.
   * 
   * @returns Cloned session or null if no session
   * 
   * @example
   * const { clonarSesionActual } = useSesion();
   * const sesionAnterior = clonarSesionActual();
   * // ... make changes ...
   * // Later: restore sesionAnterior
   */
  const clonarSesionActual = useCallback((): Sesion | null => {
    if (!sesion) return null;
    return clonarSesion(sesion);
  }, [sesion]);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Estado
      sesion,
      sesionCargada,
      
      // Funciones de ciclo de vida
      iniciarSesion,
      cerrarSesion,
      reiniciarSesion,
      
      // Utilidades
      obtenerEstadisticas,
      clonarSesionActual,
      
      // Dispatcher directo
      dispatch,
    }),
    [
      sesion,
      sesionCargada,
      iniciarSesion,
      cerrarSesion,
      reiniciarSesion,
      obtenerEstadisticas,
      clonarSesionActual,
      dispatch,
    ]
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export context for advanced usage
export { useSesionContext } from '../lib/state/SessionContext';
export type { Sesion } from '../models/sesion/types';
