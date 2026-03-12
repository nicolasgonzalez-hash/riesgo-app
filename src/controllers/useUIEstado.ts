/**
 * ============================================================================
 * USE UI ESTADO - UI State Management Hook
 * ============================================================================
 * 
 * This hook provides management operations for UI state:
 * - View switching (mapa | tabla)
 * - Loading states
 * - Error management
 * - Notifications (future-ready)
 * 
 * Features:
 * - View state management
 * - Loading wrapper for async operations
 * - Error queue with severity levels
 * - Notification system (toast-ready)
 * - Immutable state updates
 * 
 * @module controllers/useUIEstado
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type { VistaActiva } from '../models/sesion/types';

import { useSesionContext } from '../lib/state/SessionContext';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * UI Error representation.
 */
export interface ErrorUI {
  /** Unique error identifier */
  id: string;

  /** Error message to display */
  mensaje: string;

  /** Error severity level */
  severidad: 'info' | 'warning' | 'error' | 'success';

  /** Timestamp when error was added */
  timestamp: string;
}

/**
 * UI Notification representation.
 */
export interface Notificacion {
  /** Unique notification identifier */
  id: string;

  /** Notification title */
  titulo: string;

  /** Notification message */
  mensaje: string;

  /** Notification type */
  tipo: 'info' | 'success' | 'warning' | 'error';

  /** Duration in milliseconds (default: 5000) */
  duracion?: number;

  /** Timestamp when notification was added */
  timestamp: string;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useUIEstado hook.
 */
export interface UseUIEstadoReturn {
  // View State
  /** Current active view */
  vistaActiva: VistaActiva;

  /** Change active view */
  cambiarVista: (vista: VistaActiva) => void;

  /** Toggle between mapa and tabla */
  toggleVista: () => void;

  // Loading State
  /** Loading state flag */
  loading: boolean;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Wrap promise with loading state */
  conLoading: <T>(promesa: Promise<T>) => Promise<T>;

  // Error State
  /** Current errors */
  errores: ErrorUI[];

  /** Add error */
  agregarError: (error: Omit<ErrorUI, 'id' | 'timestamp'>) => void;

  /** Clear all errors */
  limpiarErrores: () => void;

  /** Remove specific error */
  eliminarError: (id: string) => void;

  // Notification State (Future-ready)
  /** Current notifications */
  notificaciones: Notificacion[];

  /** Add notification */
  agregarNotificacion: (
    notif: Omit<Notificacion, 'id' | 'timestamp'>
  ) => void;

  /** Remove specific notification */
  eliminarNotificacion: (id: string) => void;

  /** Clear all notifications */
  limpiarNotificaciones: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for errors/notifications.
 */
function generarIdUnico(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO timestamp.
 */
function obtenerTimestampISO(): string {
  return new Date().toISOString();
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * UI state management controller hook.
 * Provides operations for managing view state, loading, errors, and notifications.
 * 
 * @returns UI state and management functions
 * 
 * @example
 * // Basic usage
 * function MiComponente() {
 *   const {
 *     vistaActiva,
 *     cambiarVista,
 *     loading,
 *     conLoading,
 *     errores,
 *     agregarError
 *   } = useUIEstado();
 * 
 *   const handleOperacion = async () => {
 *     try {
 *       await conLoading(algunaOperacionAsync());
 *     } catch (error) {
 *       agregarError({
 *         mensaje: 'Operación falló',
 *         severidad: 'error'
 *       });
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => cambiarVista('mapa')}>Mapa</button>
 *       <button onClick={() => cambiarVista('tabla')}>Tabla</button>
 *       {loading && <Spinner />}
 *       {errores.map(e => <ErrorBanner key={e.id} error={e} />)}
 *     </div>
 *   );
 * }
 */
export function useUIEstado(): UseUIEstadoReturn {
  // Get session context (for view state persistence if needed)
  const { sesion } = useSesionContext();

  // View state (local, can be synced with session in future)
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>(
    sesion?.vistaActiva || 'mapa'
  );

  // Loading state
  const [loading, setLoading] = useState<boolean>(false);

  // Error state
  const [errores, setErrores] = useState<ErrorUI[]>([]);

  // Notification state (future-ready)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // ============================================================================
  // VIEW STATE FUNCTIONS
  // ============================================================================

  /**
   * Change active view.
   * 
   * @param vista - New view ('mapa' | 'tabla')
   * 
   * @example
   * cambiarVista('tabla');
   */
  const cambiarVista = useCallback((vista: VistaActiva): void => {
    setVistaActiva(vista);
  }, []);

  /**
   * Toggle between mapa and tabla views.
   * 
   * @example
   * toggleVista();
   */
  const toggleVista = useCallback((): void => {
    setVistaActiva((prev) => (prev === 'mapa' ? 'tabla' : 'mapa'));
  }, []);

  // ============================================================================
  // LOADING STATE FUNCTIONS
  // ============================================================================

  /**
   * Set loading state.
   * 
   * @param nuevoLoading - New loading state
   * 
   * @example
   * setLoading(true);
   */
  const setLoadingState = useCallback((nuevoLoading: boolean): void => {
    setLoading(nuevoLoading);
  }, []);

  /**
   * Wrap promise with loading state.
   * Automatically sets loading to true before and false after.
   * 
   * @param promesa - Promise to wrap
   * @returns Promise result
   * 
   * @example
   * const resultado = await conLoading(fetchData());
   */
  const conLoading = useCallback(
    async <T,>(promesa: Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        return await promesa;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ============================================================================
  // ERROR STATE FUNCTIONS
  // ============================================================================

  /**
   * Add error to error queue.
   * 
   * @param error - Error without id and timestamp (auto-generated)
   * 
   * @example
   * agregarError({
   *   mensaje: 'Error al guardar',
   *   severidad: 'error'
   * });
   */
  const agregarError = useCallback(
    (error: Omit<ErrorUI, 'id' | 'timestamp'>): void => {
      const nuevoError: ErrorUI = {
        ...error,
        id: generarIdUnico(),
        timestamp: obtenerTimestampISO(),
      };

      setErrores((prev) => [...prev, nuevoError]);
    },
    []
  );

  /**
   * Clear all errors.
   * 
   * @example
   * limpiarErrores();
   */
  const limpiarErrores = useCallback((): void => {
    setErrores([]);
  }, []);

  /**
   * Remove specific error by ID.
   * 
   * @param id - Error ID to remove
   * 
   * @example
   * eliminarError('error-123');
   */
  const eliminarError = useCallback((id: string): void => {
    setErrores((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ============================================================================
  // NOTIFICATION STATE FUNCTIONS (FUTURE-READY)
  // ============================================================================

  /**
   * Add notification to notification queue.
   * 
   * @param notif - Notification without id and timestamp (auto-generated)
   * 
   * @example
   * agregarNotificacion({
   *   titulo: 'Guardado',
   *   mensaje: 'Datos guardados correctamente',
   *   tipo: 'success',
   *   duracion: 3000
   * });
   */
  const agregarNotificacion = useCallback(
    (notif: Omit<Notificacion, 'id' | 'timestamp'>): void => {
      const nuevaNotificacion: Notificacion = {
        ...notif,
        id: generarIdUnico(),
        timestamp: obtenerTimestampISO(),
      };

      setNotificaciones((prev) => [...prev, nuevaNotificacion]);

      // Auto-remove after duration (if specified)
      if (notif.duracion && notif.duracion > 0) {
        setTimeout(() => {
          setNotificaciones((prev) =>
            prev.filter((n) => n.id !== nuevaNotificacion.id)
          );
        }, notif.duracion);
      }
    },
    []
  );

  /**
   * Remove specific notification by ID.
   * 
   * @param id - Notification ID to remove
   * 
   * @example
   * eliminarNotificacion('notif-123');
   */
  const eliminarNotificacion = useCallback((id: string): void => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Clear all notifications.
   * 
   * @example
   * limpiarNotificaciones();
   */
  const limpiarNotificaciones = useCallback((): void => {
    setNotificaciones([]);
  }, []);

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // View State
      vistaActiva,
      cambiarVista,
      toggleVista,

      // Loading State
      loading,
      setLoading: setLoadingState,
      conLoading,

      // Error State
      errores,
      agregarError,
      limpiarErrores,
      eliminarError,

      // Notification State (Future-ready)
      notificaciones,
      agregarNotificacion,
      eliminarNotificacion,
      limpiarNotificaciones,
    }),
    [
      vistaActiva,
      cambiarVista,
      toggleVista,
      loading,
      setLoadingState,
      conLoading,
      errores,
      agregarError,
      limpiarErrores,
      eliminarError,
      notificaciones,
      agregarNotificacion,
      eliminarNotificacion,
      limpiarNotificaciones,
    ]
  );
}
