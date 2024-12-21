import { supabase } from '../db/supabaseClient.js';

export const getAllMinisterios = async (req, res) => {
  try {
    // Ejemplo: obtienes la versión de la URL (ej. /api/vX/)
    const { versionParam } = req.params; // "v0", "v1.0", etc.
    const versionNumber = versionParam.replace('v', ''); // "0", "1.0"

    // 1) Buscar en la tabla versiones para obtener versionId
    const { data: versionRows, error: versionError } = await supabase
      .from('versiones')
      .select('id, numero_version')
      .eq('numero_version', versionNumber)
      .single();

    if (versionError || !versionRows) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }
    const versionId = versionRows.id;

    // 2) Ejemplo: traer todos los ministerios
    const { data: ministerios, error: minError } = await supabase
      .from('ministerios')
      .select('*')
      .order('orden', { ascending: true });

    if (minError) {
      return res.status(500).json({ error: minError.message });
    }

    // 3) Para cada ministerio, armar el JSON: { orden, nombre, web, titular, subsecretarias[] }
    //    HARDCODE: Lógica de consultas a cargos, personas, etc.
    //    Por simplicidad, te muestro un pseudo-ejemplo:

    const result = [];
    for (let m of ministerios) {
      // (A) Buscar titular del ministerio en la versión actual
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
        .match({ version_id: versionId, ministerio_id: m.id })
        .eq('subsecretaria_id', null)
        .maybeSingle(); // puede ser single o multiple

      // (B) Tomar subsecretarias
      const { data: subs, error: subsErr } = await supabase
        .from('subsecretarias')
        .select(`
          id,
          nombre,
          sitio_web
        `)
        .eq('ministerio_id', m.id);

      // Para cada subsecretaría, buscar su titular
      const subsecretarias = [];
      if (!subsErr && subs.length > 0) {
        for (let sub of subs) {
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

          subsecretarias.push({
            subsecretaria: sub.nombre,
            web: sub.sitio_web,
            titular: cargoSub
              ? {
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
                }
              : null
          });
        }
      }

      // Armar el objeto final
      result.push({
        orden: m.orden,
        nombre: m.nombre,
        web: m.sitio_web,
        titular: cargoMin
          ? {
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
            }
          : null,
        subsecretarias
      });
    }

    // 4) Retornar
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno' });
  }
};
