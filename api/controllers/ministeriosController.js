import { supabase } from "../db/supabaseClient.js";

// 1) Devuelve TODOS los ministerios de la versión
export const getAllMinisterios = async (req, res) => {
  try {
    const { versionParam } = req.params; // "v0", "v1.0", etc.
    let versionNumber = versionParam.replace(/^v/, ""); // Elimina 'v'
    if (versionNumber === "1") versionNumber = "1.0"; // Mapea versiones cortas

    // Obtener la versión de la tabla "versiones"
    const { data: versionRow, error: versionError } = await supabase
      .from("versiones")
      .select("id, numero_version")
      .eq("numero_version", versionNumber)
      .single();

    if (versionError || !versionRow) {
      return res.status(404).json({ error: "Versión no encontrada" });
    }
    const versionId = versionRow.id;

    // Obtener todos los ministerios
    const { data: ministerios, error: minError } = await supabase
      .from("ministerios")
      .select(
        `
        id,
        nombre,
        sitio_web,
        cargos (
          nombre_cargo,
          persona_id (
            nombres,
            apellidos,
            fecha_nacimiento,
            profesion,
            universidad,
            genero,
            partido_politico_id ( nombre )
          )
        ),
        subsecretarias (
          nombre,
          sitio_web,
          cargos (
            nombre_cargo,
            persona_id (
              nombres,
              apellidos,
              fecha_nacimiento,
              profesion,
              universidad,
              genero,
              partido_politico_id ( nombre )
            )
          )
        )
      `
      )
      .order("id", { ascending: true });

    if (minError) {
      return res.status(500).json({ error: minError.message });
    }

    // Construir la respuesta
    const result = ministerios.map((ministerio) => ({
      id: ministerio.id,
      nombre: ministerio.nombre,
      web: ministerio.sitio_web,
      titular: ministerio.cargos.length
        ? {
            nombres: ministerio.cargos[0].persona_id.nombres,
            apellidos: ministerio.cargos[0].persona_id.apellidos,
            cargo: ministerio.cargos[0].nombre_cargo,
            nacimiento: ministerio.cargos[0].persona_id.fecha_nacimiento,
            profesion: ministerio.cargos[0].persona_id.profesion,
            universidad: ministerio.cargos[0].persona_id.universidad,
            genero: ministerio.cargos[0].persona_id.genero,
            partido: ministerio.cargos[0].persona_id.partido_politico_id?.nombre || "",
          }
        : null,
      subsecretarias: ministerio.subsecretarias.map((sub) => ({
        nombre: sub.nombre,
        web: sub.sitio_web,
        titular: sub.cargos.length
          ? {
              nombres: sub.cargos[0].persona_id.nombres,
              apellidos: sub.cargos[0].persona_id.apellidos,
              cargo: sub.cargos[0].nombre_cargo,
              nacimiento: sub.cargos[0].persona_id.fecha_nacimiento,
              profesion: sub.cargos[0].persona_id.profesion,
              universidad: sub.cargos[0].persona_id.universidad,
              genero: sub.cargos[0].persona_id.genero,
              partido: sub.cargos[0].persona_id.partido_politico_id?.nombre || "",
            }
          : null,
      })),
    }));

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno" });
  }
};

// 2) Devuelve SOLO un ministerio en la versión
export const getMinisterioEspecifico = async (req, res) => {
  try {
    const { versionParam, slugMinisterio } = req.params;
    let versionNumber = versionParam.replace("v", ""); // "0", "1.0", etc.
    if (versionNumber === "1") versionNumber = "1.0";

    // Obtener la versión de la tabla "versiones"
    const { data: versionRow, error: versionError } = await supabase
      .from("versiones")
      .select("id, numero_version")
      .eq("numero_version", versionNumber)
      .single();

    if (versionError || !versionRow) {
      return res.status(404).json({ error: "Versión no encontrada" });
    }
    const versionId = versionRow.id;

    // Obtener el ministerio por slug
    const { data: ministerioRow, error: ministerioError } = await supabase
      .from("ministerios")
      .select(
        `
        id,
        nombre,
        sitio_web,
        cargos (
          nombre_cargo,
          persona_id (
            nombres,
            apellidos,
            fecha_nacimiento,
            profesion,
            universidad,
            genero,
            partido_politico_id ( nombre )
          )
        ),
        subsecretarias (
          nombre,
          sitio_web,
          cargos (
            nombre_cargo,
            persona_id (
              nombres,
              apellidos,
              fecha_nacimiento,
              profesion,
              universidad,
              genero,
              partido_politico_id ( nombre )
            )
          )
        )
      `
      )
      .eq("slug", slugMinisterio)
      .single();

    if (ministerioError || !ministerioRow) {
      return res.status(404).json({ error: "Ministerio no encontrado" });
    }

    // Construir respuesta
    const response = {
      id: ministerioRow.id,
      nombre: ministerioRow.nombre,
      web: ministerioRow.sitio_web,
      titular: ministerioRow.cargos.length
        ? {
            nombres: ministerioRow.cargos[0].persona_id.nombres,
            apellidos: ministerioRow.cargos[0].persona_id.apellidos,
            cargo: ministerioRow.cargos[0].nombre_cargo,
            nacimiento: ministerioRow.cargos[0].persona_id.fecha_nacimiento,
            profesion: ministerioRow.cargos[0].persona_id.profesion,
            universidad: ministerioRow.cargos[0].persona_id.universidad,
            genero: ministerioRow.cargos[0].persona_id.genero,
            partido: ministerioRow.cargos[0].persona_id.partido_politico_id?.nombre || "",
          }
        : null,
      subsecretarias: ministerioRow.subsecretarias.map((sub) => ({
        nombre: sub.nombre,
        web: sub.sitio_web,
        titular: sub.cargos.length
          ? {
              nombres: sub.cargos[0].persona_id.nombres,
              apellidos: sub.cargos[0].persona_id.apellidos,
              cargo: sub.cargos[0].nombre_cargo,
              nacimiento: sub.cargos[0].persona_id.fecha_nacimiento,
              profesion: sub.cargos[0].persona_id.profesion,
              universidad: sub.cargos[0].persona_id.universidad,
              genero: sub.cargos[0].persona_id.genero,
              partido: sub.cargos[0].persona_id.partido_politico_id?.nombre || "",
            }
          : null,
      })),
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno" });
  }
};
