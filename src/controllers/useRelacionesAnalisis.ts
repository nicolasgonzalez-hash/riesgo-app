/**
 * ============================================================================
 * USE RELACIONES ANALISIS - Analysis Relationships Management Hook
 * ============================================================================
 * 
 * This hook provides management operations for relationships between analysis:
 * HAZOP ↔ FMEA ↔ LOPA ↔ OCA ↔ Intuicion
 * 
 * Features:
 * - Create relationships (sustenta, complementa, deriva)
 * - Delete relationships
 * - Query connected analysis
 * - Detect orphan analysis (no relationships)
 * - Get supporting/supported analysis
 * - Immutable state updates
 * 
 * @module controllers/useRelacionesAnalisis
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  RelacionAnalisis,
  TipoRelacionAnalisis,
} from '../models/relaciones/types';

import type { AnalisisOrigen, TipoAnalisis } from '../models/analisis/types';

import { useSesionContext } from '../lib/state/SessionContext';

import { generarIdUnico } from '../models/utils/generadores';

import {
  validarRelacionAnalisis as validarRelacionAnalisisUtil,
  encontrarAnalisisHuerfanos as encontrarAnalisisHuerfanosUtil,
} from '../models/relaciones/utils';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Operation result for relationship CRUD operations.
 */
export interface ResultadoOperacion {
  /** Whether the operation succeeded */
  exito: boolean;

  /** List of errors (empty if successful) */
  errores: string[];

  /** ID of created/deleted entity (if applicable) */
  id?: string;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useRelacionesAnalisis hook.
 */
export interface UseRelacionesAnalisisReturn {
  // State
  /** All relationships in session */
  relaciones: RelacionAnalisis[];

  /** Get relationships for specific analysis */
  obtenerRelacionesDeAnalisis: (
    analisisId: string
  ) => RelacionAnalisis[];

  /** Get analysis connected to specific analysis */
  analisisConectados: (analisisId: string) => AnalisisOrigen[];

  // Create
  /** Create new relationship */
  crearRelacionAnalisis: (
    tipo: TipoRelacionAnalisis,
    analisisSustentoId: string,
    analisisSustentadoId: string,
    descripcion?: string
  ) => ResultadoOperacion;

  // Delete
  /** Delete relationship */
  eliminarRelacionAnalisis: (id: string) => ResultadoOperacion;

  // Query
  /** Get orphan analysis (no relationships) */
  analisisHuerfanos: () => AnalisisOrigen[];

  /** Get analysis that this analysis supports */
  obtenerAnalisisSustentados: (analisisId: string) => AnalisisOrigen[];

  /** Get analysis that support this analysis */
  obtenerAnalisisSustento: (analisisId: string) => AnalisisOrigen[];
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Analysis relationships management controller hook.
 * Provides operations for managing relationships between analysis documents.
 * 
 * @returns Relationships state and management functions
 * 
 * @example
 * // Basic usage
 * function AnalysisRelationshipEditor() {
 *   const {
 *     relaciones,
 *     crearRelacionAnalisis,
 *     analisisConectados
 *   } = useRelacionesAnalisis();
 * 
 *   const handleCrear = () => {
 *     const resultado = crearRelacionAnalisis(
 *       'sustenta',
 *       'fmea-001',
 *       'hazop-001',
 *       'FMEA component failures inform HAZOP deviations'
 *     );
 * 
 *     if (resultado.exito) {
 *       console.log('Relación creada:', resultado.id);
 *     } else {
 *       console.error('Errores:', resultado.errores);
 *     }
 *   };
 * 
 *   return <button onClick={handleCrear}>Crear Relación</button>;
 * }
 */
export function useRelacionesAnalisis(): UseRelacionesAnalisisReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /**
   * Get all relationships in session.
   */
  const relaciones = useMemo((): RelacionAnalisis[] => {
    return (sesion?.relaciones.filter((r) => 'analisisSustentoId' in r) ||
      []) as RelacionAnalisis[];
  }, [sesion?.relaciones]);

  /**
   * Get relationships for specific analysis.
   * 
   * @param analisisId - Analysis ID to query
   * @returns Array of relationships involving this analysis
   * 
   * @example
   * const relaciones = obtenerRelacionesDeAnalisis('hazop-001');
   */
  const obtenerRelacionesDeAnalisis = useCallback(
    (analisisId: string): RelacionAnalisis[] => {
      return relaciones.filter(
        (r) =>
          r.analisisSustentoId === analisisId ||
          r.analisisSustentadoId === analisisId
      );
    },
    [relaciones]
  );

  /**
   * Get analysis connected to specific analysis.
   * 
   * @param analisisId - Analysis ID to query
   * @returns Array of connected analysis
   * 
   * @example
   * const conectados = analisisConectados('hazop-001');
   * conectados.forEach(a => {
   *   console.log(`${a.base.tipo}: ${a.base.id}`);
   * });
   */
  const analisisConectados = useCallback(
    (analisisId: string): AnalisisOrigen[] => {
      if (!sesion) {
        return [];
      }

      const relacionesAnalisis = obtenerRelacionesDeAnalisis(analisisId);
      const conectadosIds = new Set<string>();

      relacionesAnalisis.forEach((r) => {
        if (r.analisisSustentoId !== analisisId) {
          conectadosIds.add(r.analisisSustentoId);
        }
        if (r.analisisSustentadoId !== analisisId) {
          conectadosIds.add(r.analisisSustentadoId);
        }
      });

      return sesion.analisis.filter((a) => conectadosIds.has(a.base.id));
    },
    [sesion, obtenerRelacionesDeAnalisis]
  );

  // ============================================================================
  // CREATE FUNCTION
  // ============================================================================

  /**
   * Create new relationship between analysis.
   * 
   * @param tipo - Relationship type (sustenta, complementa, deriva)
   * @param analisisSustentoId - Supporting analysis ID
   * @param analisisSustentadoId - Supported analysis ID
   * @param descripcion - Optional description
   * @returns Operation result
   * 
   * @example
   * // Create "sustenta" relationship (FMEA → HAZOP)
   * const resultado = crearRelacionAnalisis(
   *   'sustenta',
   *   'fmea-001',
   *   'hazop-001',
   *   'FMEA provides failure data for HAZOP'
   * );
   * 
   * if (resultado.exito) {
   *   console.log('Relación creada:', resultado.id);
   * } else {
   *   console.error('Errores:', resultado.errores);
   * }
   */
  const crearRelacionAnalisis = useCallback(
    (
      tipo: TipoRelacionAnalisis,
      analisisSustentoId: string,
      analisisSustentadoId: string,
      descripcion?: string
    ): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Check if analysis exist
      const sustentoExiste = sesion.analisis.some(
        (a) => a.base.id === analisisSustentoId
      );
      const sustentadoExiste = sesion.analisis.some(
        (a) => a.base.id === analisisSustentadoId
      );

      if (!sustentoExiste) {
        return {
          exito: false,
          errores: [`Análisis de sustento '${analisisSustentoId}' no encontrado`],
        };
      }

      if (!sustentadoExiste) {
        return {
          exito: false,
          errores: [
            `Análisis sustentado '${analisisSustentadoId}' no encontrado`,
          ],
        };
      }

      // 3. Check for self-reference
      if (analisisSustentoId === analisisSustentadoId) {
        return {
          exito: false,
          errores: ['No se puede relacionar un análisis consigo mismo'],
        };
      }

      // 4. Check for duplicate relationships
      const existeDuplicada = relaciones.some(
        (r) =>
          r.analisisSustentoId === analisisSustentoId &&
          r.analisisSustentadoId === analisisSustentadoId &&
          r.tipo === tipo
      );

      if (existeDuplicada) {
        return {
          exito: false,
          errores: ['Ya existe una relación idéntica'],
        };
      }

      // 5. Generate ID and create relationship
      const id = generarIdUnico('rel-analysis');
      const nuevaRelacion: RelacionAnalisis = {
        id,
        tipo,
        analisisSustentoId,
        analisisSustentadoId,
        descripcion: descripcion || '',
        fechaCreacion: new Date().toISOString(),
      };

      // 6. Dispatch create action
      dispatch({
        type: 'AGREGAR_RELACION',
        payload: nuevaRelacion,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch, relaciones]
  );

  // ============================================================================
  // DELETE FUNCTION
  // ============================================================================

  /**
   * Delete relationship.
   * 
   * @param id - Relationship ID to delete
   * @returns Operation result
   * 
   * @example
   * const resultado = eliminarRelacionAnalisis('rel-analysis-001');
   * if (resultado.exito) {
   *   console.log('Relación eliminada');
   * }
   */
  const eliminarRelacionAnalisis = useCallback(
    (id: string): ResultadoOperacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Check if relationship exists
      const relacionExistente = relaciones.find((r) => r.id === id);

      if (!relacionExistente) {
        return {
          exito: false,
          errores: [`Relación con ID '${id}' no encontrada`],
        };
      }

      // 3. Dispatch delete action
      dispatch({
        type: 'ELIMINAR_RELACION',
        payload: id,
      });

      return {
        exito: true,
        errores: [],
        id,
      };
    },
    [sesion, dispatch, relaciones]
  );

  // ============================================================================
  // QUERY FUNCTIONS
  // ============================================================================

  /**
   * Get orphan analysis (no relationships).
   * 
   * @returns Array of analysis without any relationships
   * 
   * @example
   * const huerfanos = analisisHuerfanos();
   * console.log(`Análisis sin relaciones: ${huerfanos.length}`);
   */
  const analisisHuerfanos = useCallback((): AnalisisOrigen[] => {
    if (!sesion) {
      return [];
    }

    // encontrarAnalisisHuerfanosUtil returns IDs, need to map to analysis
    const huerfanosIds = encontrarAnalisisHuerfanosUtil(sesion);
    return huerfanosIds
      .map((id) => sesion.analisis.find((a) => a.base.id === id))
      .filter((a): a is AnalisisOrigen => a !== undefined);
  }, [sesion]);

  /**
   * Get analysis that this analysis supports.
   * 
   * @param analisisId - Analysis ID to query
   * @returns Array of analysis supported by this analysis
   * 
   * @example
   * const sustentados = obtenerAnalisisSustentados('fmea-001');
   * // Returns HAZOP analysis that FMEA supports
   */
  const obtenerAnalisisSustentados = useCallback(
    (analisisId: string): AnalisisOrigen[] => {
      if (!sesion) {
        return [];
      }

      const relacionadosIds = relaciones
        .filter((r) => r.analisisSustentoId === analisisId)
        .map((r) => r.analisisSustentadoId);

      return sesion.analisis.filter((a) => relacionadosIds.includes(a.base.id));
    },
    [sesion, relaciones]
  );

  /**
   * Get analysis that support this analysis.
   * 
   * @param analisisId - Analysis ID to query
   * @returns Array of analysis that support this analysis
   * 
   * @example
   * const sustento = obtenerAnalisisSustento('hazop-001');
   * // Returns FMEA analysis that supports HAZOP
   */
  const obtenerAnalisisSustento = useCallback(
    (analisisId: string): AnalisisOrigen[] => {
      if (!sesion) {
        return [];
      }

      const relacionadosIds = relaciones
        .filter((r) => r.analisisSustentadoId === analisisId)
        .map((r) => r.analisisSustentoId);

      return sesion.analisis.filter((a) => relacionadosIds.includes(a.base.id));
    },
    [sesion, relaciones]
  );

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // State
      relaciones,
      obtenerRelacionesDeAnalisis,
      analisisConectados,

      // Create
      crearRelacionAnalisis,

      // Delete
      eliminarRelacionAnalisis,

      // Query
      analisisHuerfanos,
      obtenerAnalisisSustentados,
      obtenerAnalisisSustento,
    }),
    [
      relaciones,
      obtenerRelacionesDeAnalisis,
      analisisConectados,
      crearRelacionAnalisis,
      eliminarRelacionAnalisis,
      analisisHuerfanos,
      obtenerAnalisisSustentados,
      obtenerAnalisisSustento,
    ]
  );
}
