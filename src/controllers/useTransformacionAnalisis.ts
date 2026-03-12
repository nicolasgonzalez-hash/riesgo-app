/**
 * ============================================================================
 * USE TRANSFORMACION ANALISIS - Analysis to Hallazgos Transformation Hook
 * ============================================================================
 * 
 * This hook provides automatic transformation of completed analysis into
 * hallazgos (findings). It uses the transformadores utilities to convert
 * analysis data into Peligro, Barrera, POE, and SOL entities.
 * 
 * Features:
 * - Transform single analysis to hallazgos
 * - Transform all analysis in batch
 * - Transform analysis by type
 * - Query transformation status
 * - Track hallazgo-analysis relationships
 * - Immutable state updates
 * 
 * @module controllers/useTransformacionAnalisis
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  AnalisisOrigen,
  TipoAnalisis,
  EstadoAnalisis,
} from '../models/analisis/types';

import type { Hallazgo } from '../models/hallazgo/types';

import type { Sesion } from '../models/sesion/types';

import {
  analisisToHallazgos,
  analisisHAZOPtoHallazgos,
  analisisFMEAtoHallazgos,
  analisisLOPAtoHallazgos,
  analisisOCAtoHallazgos,
  analisisIntuiciontoHallazgos,
} from '../models/utils/transformadores';

import { validarAnalisisGenerico } from '../models/analisis/validators';

import { useSesionContext } from '../lib/state/SessionContext';

// ============================================================================
// LOCAL TYPES
// ============================================================================

/**
 * Result of a single analysis transformation.
 */
export interface ResultadoTransformacion {
  /** Whether the transformation succeeded */
  exito: boolean;

  /** Created hallazgos (empty if failed) */
  hallazgosCreados: Hallazgo[];

  /** List of errors (empty if successful) */
  errores: string[];

  /** Warnings (non-blocking issues) */
  advertencias?: string[];

  /** ID of transformed analysis */
  analisisId?: string;
}

/**
 * Result of batch transformation.
 */
export interface ResultadoTransformacionMultiple {
  /** Whether the batch operation succeeded (at least one transformed) */
  exito: boolean;

  /** Total number of analysis processed */
  totalAnalisis: number;

  /** Number of successfully transformed analysis */
  totalTransformados: number;

  /** Number of failed transformations */
  totalFallidos: number;

  /** Individual results for each analysis */
  resultados: ResultadoTransformacion[];
}

/**
 * Transformation status for an analysis.
 */
export type EstadoTransformacion = 'pendiente' | 'transformado' | 'parcial';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useTransformacionAnalisis hook.
 */
export interface UseTransformacionAnalisisReturn {
  // Transform Functions
  /** Transform single analysis to hallazgos */
  transformarAnalisisAHallazgos: (analisisId: string) => ResultadoTransformacion;

  /** Transform all analysis in batch */
  transformarTodosAnalisis: () => ResultadoTransformacionMultiple;

  /** Transform analysis by type */
  transformarAnalisisPorTipo: (
    tipo: TipoAnalisis
  ) => ResultadoTransformacionMultiple;

  // Query Functions
  /** Get analysis that can be transformed */
  obtenerAnalisisTransformables: () => AnalisisOrigen[];

  /** Get hallazgos created from specific analysis */
  obtenerHallazgosDeAnalisis: (analisisId: string) => Hallazgo[];

  /** Get analysis that created a specific hallazgo */
  obtenerAnalisisDeHallazgo: (hallazgoId: string) => AnalisisOrigen[];

  // Status Functions
  /** Check if analysis can be transformed */
  esAnalisisTransformable: (analisisId: string) => boolean;

  /** Get transformation status of analysis */
  obtenerEstadoTransformacion: (analisisId: string) => EstadoTransformacion;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Analysis to hallazgos transformation controller hook.
 * Provides automatic transformation of completed analysis into findings.
 * 
 * @returns Transformation state and functions
 * 
 * @example
 * // Basic usage
 * function TransformacionPanel() {
 *   const {
 *     transformarAnalisisAHallazgos,
 *     obtenerAnalisisTransformables
 *   } = useTransformacionAnalisis();
 * 
 *   const transformables = obtenerAnalisisTransformables();
 * 
 *   const handleTransformar = (analisisId: string) => {
 *     const resultado = transformarAnalisisAHallazgos(analisisId);
 * 
 *     if (resultado.exito) {
 *       console.log('Hallazgos creados:', resultado.hallazgosCreados.length);
 *     } else {
 *       console.error('Errores:', resultado.errores);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {transformables.map(a => (
 *         <button
 *           key={a.base.id}
 *           onClick={() => handleTransformar(a.base.id)}
 *         >
 *           Transformar {a.base.tipo}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useTransformacionAnalisis(): UseTransformacionAnalisisReturn {
  // Get session context
  const { sesion, dispatch } = useSesionContext();

  // ============================================================================
  // QUERY FUNCTIONS (Must be declared before transform functions)
  // ============================================================================

  /**
   * Get analysis that can be transformed.
   * 
   * @returns Array of transformable analysis
   * 
   * @example
   * const transformables = obtenerAnalisisTransformables();
   * console.log(`Análisis listos para transformar: ${transformables.length}`);
   */
  const obtenerAnalisisTransformables = useCallback((): AnalisisOrigen[] => {
    if (!sesion) {
      return [];
    }

    return sesion.analisis.filter((analisis) => {
      // Must be completed
      if (analisis.base.estado !== 'completado') {
        return false;
      }

      // Must not have hallazgos already
      const tieneHallazgos = sesion.hallazgos.some((h) =>
        h.analisisOrigenIds.includes(analisis.base.id)
      );

      if (tieneHallazgos) {
        return false;
      }

      // Must be valid for transformation
      const validacion = validarAnalisisGenerico(
        analisis.base,
        analisis.datos
      );

      return validacion.valido;
    });
  }, [sesion]);

  /**
   * Get hallazgos created from specific analysis.
   * 
   * @param analisisId - Analysis ID to query
   * @returns Array of hallazgos created from this analysis
   * 
   * @example
   * const hallazgos = obtenerHallazgosDeAnalisis('hazop-001');
   */
  const obtenerHallazgosDeAnalisis = useCallback(
    (analisisId: string): Hallazgo[] => {
      if (!sesion) {
        return [];
      }

      return sesion.hallazgos.filter((h) =>
        h.analisisOrigenIds.includes(analisisId)
      );
    },
    [sesion]
  );

  /**
   * Get analysis that created a specific hallazgo.
   * 
   * @param hallazgoId - Hallazgo ID to query
   * @returns Array of analysis that created this hallazgo
   * 
   * @example
   * const analisis = obtenerAnalisisDeHallazgo('peligro-001');
   */
  const obtenerAnalisisDeHallazgo = useCallback(
    (hallazgoId: string): AnalisisOrigen[] => {
      if (!sesion) {
        return [];
      }

      const hallazgo = sesion.hallazgos.find((h) => h.id === hallazgoId);

      if (!hallazgo) {
        return [];
      }

      return sesion.analisis.filter((a) =>
        hallazgo.analisisOrigenIds.includes(a.base.id)
      );
    },
    [sesion]
  );

  // ============================================================================
  // TRANSFORM FUNCTIONS
  // ============================================================================

  /**
   * Transform single analysis to hallazgos.
   * 
   * @param analisisId - Analysis ID to transform
   * @returns Transformation result
   * 
   * @example
   * const resultado = transformarAnalisisAHallazgos('hazop-001');
   * if (resultado.exito) {
   *   console.log('Hallazgos:', resultado.hallazgosCreados);
   * }
   */
  const transformarAnalisisAHallazgos = useCallback(
    (analisisId: string): ResultadoTransformacion => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          hallazgosCreados: [],
          errores: ['No hay sesión activa'],
        };
      }

      // 2. Find analysis
      const analisis = sesion.analisis.find((a) => a.base.id === analisisId);

      if (!analisis) {
        return {
          exito: false,
          hallazgosCreados: [],
          errores: [`Análisis con ID '${analisisId}' no encontrado`],
        };
      }

      // 3. Check if already transformed (has hallazgos linked)
      const hallazgosExistentes = sesion.hallazgos.filter((h) =>
        h.analisisOrigenIds.includes(analisisId)
      );

      if (hallazgosExistentes.length > 0) {
        return {
          exito: false,
          hallazgosCreados: [],
          errores: [
            `El análisis ya fue transformado previamente (${hallazgosExistentes.length} hallazgos vinculados)`,
          ],
        };
      }

      // 4. Validate analysis before transformation
      const validacion = validarAnalisisGenerico(analisis.base, analisis.datos);

      if (!validacion.valido) {
        return {
          exito: false,
          hallazgosCreados: [],
          errores: validacion.errores,
        };
      }

      // 5. Transform analysis to hallazgos
      const transformResult = analisisToHallazgos(analisis);

      if (!transformResult.exito) {
        return {
          exito: false,
          hallazgosCreados: [],
          errores: transformResult.errores,
        };
      }

      // 6. Update hallazgos with analysis origin ID
      const hallazgosConOrigen = transformResult.datos.map((h) => ({
        ...h,
        analisisOrigenIds: [...(h.analisisOrigenIds || []), analisisId],
      }));

      // 7. Dispatch all hallazgos
      for (const hallazgo of hallazgosConOrigen) {
        dispatch({
          type: 'AGREGAR_HALLAZGO',
          payload: hallazgo,
        });
      }

      return {
        exito: true,
        hallazgosCreados: hallazgosConOrigen,
        errores: [],
        analisisId,
      };
    },
    [sesion, dispatch]
  );

  /**
   * Transform all analysis in batch.
   * 
   * @returns Batch transformation result
   * 
   * @example
   * const resultado = transformarTodosAnalisis();
   * console.log(`Transformados: ${resultado.totalTransformados}`);
   */
  const transformarTodosAnalisis = useCallback(
    (): ResultadoTransformacionMultiple => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          totalAnalisis: 0,
          totalTransformados: 0,
          totalFallidos: 0,
          resultados: [],
        };
      }

      // 2. Get transformable analysis
      const transformables = obtenerAnalisisTransformables();

      // 3. Transform each
      const resultados: ResultadoTransformacion[] = [];

      for (const analisis of transformables) {
        const resultado = transformarAnalisisAHallazgos(analisis.base.id);
        resultados.push(resultado);
      }

      // 4. Calculate totals
      const totalTransformados = resultados.filter((r) => r.exito).length;
      const totalFallidos = resultados.filter((r) => !r.exito).length;

      return {
        exito: totalTransformados > 0,
        totalAnalisis: transformables.length,
        totalTransformados,
        totalFallidos,
        resultados,
      };
    },
    [sesion, obtenerAnalisisTransformables, transformarAnalisisAHallazgos]
  );

  /**
   * Transform analysis by type.
   * 
   * @param tipo - Analysis type to transform
   * @returns Batch transformation result
   * 
   * @example
   * const resultado = transformarAnalisisPorTipo('HAZOP');
   * console.log(`HAZOP transformados: ${resultado.totalTransformados}`);
   */
  const transformarAnalisisPorTipo = useCallback(
    (tipo: TipoAnalisis): ResultadoTransformacionMultiple => {
      // 1. Check session exists
      if (!sesion) {
        return {
          exito: false,
          totalAnalisis: 0,
          totalTransformados: 0,
          totalFallidos: 0,
          resultados: [],
        };
      }

      // 2. Get transformable analysis of this type
      const transformables = obtenerAnalisisTransformables().filter(
        (a) => a.base.tipo === tipo
      );

      // 3. Transform each
      const resultados: ResultadoTransformacion[] = [];

      for (const analisis of transformables) {
        const resultado = transformarAnalisisAHallazgos(analisis.base.id);
        resultados.push(resultado);
      }

      // 4. Calculate totals
      const totalTransformados = resultados.filter((r) => r.exito).length;
      const totalFallidos = resultados.filter((r) => !r.exito).length;

      return {
        exito: totalTransformados > 0,
        totalAnalisis: transformables.length,
        totalTransformados,
        totalFallidos,
        resultados,
      };
    },
    [sesion, obtenerAnalisisTransformables, transformarAnalisisAHallazgos]
  );

  // ============================================================================
  // STATUS FUNCTIONS
  // ============================================================================

  /**
   * Check if analysis can be transformed.
   * 
   * @param analisisId - Analysis ID to check
   * @returns True if analysis is transformable
   * 
   * @example
   * if (esAnalisisTransformable('hazop-001')) {
   *   console.log('Listo para transformar');
   * }
   */
  const esAnalisisTransformable = useCallback(
    (analisisId: string): boolean => {
      if (!sesion) {
        return false;
      }

      const analisis = sesion.analisis.find((a) => a.base.id === analisisId);

      if (!analisis) {
        return false;
      }

      // Must be completed
      if (analisis.base.estado !== 'completado') {
        return false;
      }

      // Must not have hallazgos already
      const tieneHallazgos = sesion.hallazgos.some((h) =>
        h.analisisOrigenIds.includes(analisisId)
      );

      if (tieneHallazgos) {
        return false;
      }

      return true;
    },
    [sesion]
  );

  /**
   * Get transformation status of analysis.
   * 
   * @param analisisId - Analysis ID to check
   * @returns Status: 'pendiente' | 'transformado' | 'parcial'
   * 
   * @example
   * const estado = obtenerEstadoTransformacion('hazop-001');
   * console.log(`Estado: ${estado}`);
   */
  const obtenerEstadoTransformacion = useCallback(
    (analisisId: string): EstadoTransformacion => {
      if (!sesion) {
        return 'pendiente';
      }

      const analisis = sesion.analisis.find((a) => a.base.id === analisisId);

      if (!analisis) {
        return 'pendiente';
      }

      // Check if completed
      if (analisis.base.estado !== 'completado') {
        return 'pendiente';
      }

      // Get hallazgos linked to this analysis
      const hallazgosVinculados = sesion.hallazgos.filter((h) =>
        h.analisisOrigenIds.includes(analisisId)
      );

      if (hallazgosVinculados.length === 0) {
        return 'pendiente';
      }

      // Check if all expected hallazgos were created
      // This is a simplified check - in reality, each analysis type produces
      // a different number of hallazgos
      const hallazgosEsperados = {
        HAZOP: 3, // At least 1 Peligro + 1+ Barreras
        FMEA: 2, // At least 1 Peligro + 1 Barrera
        LOPA: 2, // At least 1 Peligro + 1+ SOLs
        OCA: 2, // At least 1 Peligro + 1 Barrera
        Intuicion: 1, // At least 1 Peligro
      };

      const minimoEsperado =
        hallazgosEsperados[analisis.base.tipo as keyof typeof hallazgosEsperados] ||
        1;

      if (hallazgosVinculados.length >= minimoEsperado) {
        return 'transformado';
      } else {
        return 'parcial';
      }
    },
    [sesion]
  );

  // ============================================================================
  // MEMOIZED RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      // Transform Functions
      transformarAnalisisAHallazgos,
      transformarTodosAnalisis,
      transformarAnalisisPorTipo,

      // Query Functions
      obtenerAnalisisTransformables,
      obtenerHallazgosDeAnalisis,
      obtenerAnalisisDeHallazgo,

      // Status Functions
      esAnalisisTransformable,
      obtenerEstadoTransformacion,
    }),
    [
      transformarAnalisisAHallazgos,
      transformarTodosAnalisis,
      transformarAnalisisPorTipo,
      obtenerAnalisisTransformables,
      obtenerHallazgosDeAnalisis,
      obtenerAnalisisDeHallazgo,
      esAnalisisTransformable,
      obtenerEstadoTransformacion,
    ]
  );
}
