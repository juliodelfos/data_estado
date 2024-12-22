import { supabase } from '../db/supabaseClient.js';

// 1) Devuelve TODOS los ministerios de la versión
export const getAllMinisterios = async (req, res) => {
  try {
    const { versionParam } = req.params; // "v0", "v1.0", etc.
    const versionNumber = versionParam.replace('v', ''); // "0", "1.0"

    // Obtener la versión de la tabla "versiones"
    const { data: versionRow, error: versionError } = await supabase
      .from('versiones')
      .select('id, numero_version')
      .eq('numero_version', versionNumber)
      .single();

    if (versionError || !versionRow) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }
    const versionId = versionRow.id;

    // Obtener los ministerios
    const { data: ministerios, error: minError } = await supabase
      .from('ministerios')
      .select(`
        id,
        nombre,
        sitio_web,
        subsecretarias (
          nombre,
          sitio_web
        )
      `)
      .order('id', { ascending: true });

    if (minError) {
      return res.status(500).json({ error: minError.message });
    }

    // Formatear la respuesta excluyendo los campos no deseados
    const result = ministerios.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      sitio_web: m.sitio_web,
      subsecretarias: m.subsecretarias || [], // Asegura que siempre sea un array
    }));

    // Retornar la respuesta final
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno' });
  }
};


// 2) Devuelve SOLO un ministerio en la versión
export const getMinisterioEspecifico = async (req, res) => {
  try {
    const { versionParam, slugMinisterio } = req.params;
    const versionNumber = versionParam.replace('v', ''); // "0", "1.0", etc.

    // 1) Obtener la versión de la tabla "versiones"
    const { data: versionRow, error: versionError } = await supabase
      .from('versiones')
      .select('id, numero_version')
      .eq('numero_version', versionNumber)
      .single();

    if (versionError || !versionRow) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }
    const versionId = versionRow.id;

    // 2) Obtener el ministerio por "slug"
    const { data: ministerioRow, error: ministerioError } = await supabase
      .from('ministerios')
      .select('*')
      .eq('slug', slugMinisterio)
      .maybeSingle();

    if (ministerioError || !ministerioRow) {
      return res.status(404).json({ error: `Ministerio '${slugMinisterio}' no encontrado` });
    }
    const ministerioId = ministerioRow.id;

    // 3) Buscar el cargo de "Ministro" (o titular) en la tabla "cargos", filtrando:
    //    - version_id = versionId
    //    - ministerio_id = ministerioId
    //    - subsecretaria_id = null (ya que es el ministro, no un subsecretario)
    //    - Asumiendo que en tu DB, "persona_id" es la referencia a "personas"
    //      y que "personas" tiene campos como "nombres, apellidos, fecha_nacimiento, ..." 
    //      y "personas.partido_politico_id" relaciona con "partidos_politicos(nombre)".
    
    const { data: cargoMin, error: cargoMinErr } = await supabase
      .from('cargos')
      .select(`
        nombre_cargo,
        fecha_inicio,
        fecha_fin,
        persona_id (
          nombres,
          apellidos,
          fecha_nacimiento,
          profesion,
          universidad,
          genero,
          partido_politico_id ( nombre )
        )
      `)
      .match({ version_id: versionId, ministerio_id: ministerioId })
      .eq('subsecretaria_id', null)
      .maybeSingle(); // si solo hay un ministro/a en esa versión

    let titular = {};
    if (cargoMin) {
      // cargoMin.persona_id es un objeto con la info de la persona
      titular = {
        nombres: cargoMin.persona_id.nombres,
        apellidos: cargoMin.persona_id.apellidos,
        cargo: cargoMin.nombre_cargo,
        nacimiento: cargoMin.persona_id.fecha_nacimiento,
        profesion: cargoMin.persona_id.profesion,
        universidad: cargoMin.persona_id.universidad,
        partido: cargoMin.persona_id.partido_politico_id?.nombre || '', 
        genero: cargoMin.persona_id.genero,
        asume: cargoMin.fecha_inicio,
        finaliza: cargoMin.fecha_fin
      };
    }

    // 4) Buscar las subsecretarías de ese ministerio
    const { data: subsRows, error: subsErr } = await supabase
      .from('subsecretarias')
      .select(`id, nombre, sitio_web`)
      .eq('ministerio_id', ministerioId);

    if (subsErr) {
      // Opcionalmente, manejar error
      console.error(subsErr);
    }

    // 5) Para cada subsecretaría, buscar su "cargo" en la tabla "cargos"
    //    version_id = versionId, subsecretaria_id = ...
    //    Luego construimos un array subsecretarias: [...]
    let subsecretarias = [];
    if (subsRows && subsRows.length > 0) {
      for (let sub of subsRows) {
        // Cargo de esa subsecretaría
        const { data: cargoSub, error: cargoSubErr } = await supabase
          .from('cargos')
          .select(`
            nombre_cargo,
            fecha_inicio,
            fecha_fin,
            persona_id (
              nombres,
              apellidos,
              fecha_nacimiento,
              profesion,
              universidad,
              genero,
              partido_politico_id ( nombre )
            )
          `)
          .match({ version_id: versionId, subsecretaria_id: sub.id })
          .maybeSingle();

        let titularSub = {};
        if (cargoSub) {
          titularSub = {
            nombres: cargoSub.persona_id.nombres,
            apellidos: cargoSub.persona_id.apellidos,
            cargo: cargoSub.nombre_cargo,
            nacimiento: cargoSub.persona_id.fecha_nacimiento,
            profesion: cargoSub.persona_id.profesion,
            universidad: cargoSub.persona_id.universidad,
            partido: cargoSub.persona_id.partido_politico_id?.nombre || '',
            genero: cargoSub.persona_id.genero,
            asume: cargoSub.fecha_inicio,
            finaliza: cargoSub.fecha_fin
          };
        }

        subsecretarias.push({
          subsecretaria: sub.nombre,
          web: sub.sitio_web,
          titular: titularSub
        });
      }
    }

    // 6) Construir el objeto final
    const response = {
      orden: ministerioRow.orden,
      nombre: ministerioRow.nombre,
      web: ministerioRow.sitio_web,
      titular,
      subsecretarias
    };

    // 7) Retornar
    return res.json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno' });
  }
};
