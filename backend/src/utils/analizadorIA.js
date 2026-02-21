const palabrasCriticas = [
  "caído",
  "caido",
  "servidor",
  "nadie puede",
  "no funciona",
  "urgente",
  "producción",
  "produccion",
  "sistema detenido",
  "error crítico",
  "error critico"
];

function analizarTicket({ asunto, descripcion }) {
  const texto = (asunto + " " + descripcion).toLowerCase();

  let urgenciaDetectada = false;
  let prioridadSugerida = null;
  let palabrasEncontradas = [];

  palabrasCriticas.forEach(palabra => {
    if (texto.includes(palabra)) {
      urgenciaDetectada = true;
      prioridadSugerida = "Alta";
      palabrasEncontradas.push(palabra);
    }
  });

  return {
    prioridadSugerida,
    urgenciaDetectada,
    palabrasClave: palabrasEncontradas.join(",")
  };
}

module.exports = { analizarTicket };
