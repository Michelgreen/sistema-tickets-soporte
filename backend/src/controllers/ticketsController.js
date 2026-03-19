const pool = require("../config/db");

// ===============================
// Obtener todos los tickets (admin)
// ===============================
exports.getAllTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `
      SELECT 
        t.*,
        d.nombre AS departamento
      FROM tickets t
      JOIN departamentos d ON t.departamento_id = d.id
      WHERE t.estado IN ('Abierto', 'En proceso')
      ORDER BY 
        CASE 
          WHEN t.urgencia_detectada = 1 THEN 0
          WHEN t.prioridad = 'Alta' THEN 1
          WHEN t.prioridad = 'Media' THEN 2
          WHEN t.prioridad = 'Baja' THEN 3
        END,
        t.fecha_creacion DESC
      `
    );

    res.json(tickets);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tickets" });
  }
};


// ===============================
// Obtener ticket por ID
// ===============================
exports.getTicketById = async (req, res) => {
  const { id } = req.params;

  try {
    const [[ticket]] = await pool.query(
      `
      SELECT 
        t.*,
        d.nombre AS departamento
      FROM tickets t
      JOIN departamentos d ON t.departamento_id = d.id
      WHERE t.id = ?
      `,
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }

    const [respuestas] = await pool.query(
      `
  SELECT id, autor, contenido, es_respuesta_ti, fecha_respuesta
  FROM respuestas
  WHERE ticket_id = ?
  ORDER BY fecha_respuesta ASC
  `,
      [id]
    );


    res.json({ ticket, respuestas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener ticket" });
  }
};

// ===============================
// Actualizar estado del ticket
// ===============================
exports.updateEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ message: "Estado requerido" });
  }

  try {
    const [[ticket]] = await pool.query(
      "SELECT estado FROM tickets WHERE id = ?",
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }

    if (ticket.estado === estado) {
      return res.status(400).json({
        message: "El ticket ya tiene ese estado",
      });
    }

    let fechaCierre = null;

    if (estado === "Cerrado") {
      fechaCierre = new Date();
    }

    // 🔥 1. Actualizar ticket
    await pool.query(
      `
      UPDATE tickets 
      SET estado = ?, fecha_cierre = ?
      WHERE id = ?
      `,
      [estado, fechaCierre, id]
    );

    // 🔥 2. Guardar historial
    await pool.query(
      `
      INSERT INTO historial_estados 
      (ticket_id, estado_anterior, estado_nuevo, cambiado_por)
      VALUES (?, ?, ?, 'TI Administrador')
      `,
      [id, ticket.estado, estado]
    );

    // 🔥 3. Obtener ticket actualizado
    const [[ticketCompleto]] = await pool.query(
      `
      SELECT 
        t.*,
        d.nombre AS departamento
      FROM tickets t
      JOIN departamentos d ON t.departamento_id = d.id
      WHERE t.id = ?
      `,
      [id]
    );

    // 🔥 4. Obtener instancia de socket
    const io = req.app.get("io");

    // 🔥 5. Emitir evento detalle
    io.to(id.toString()).emit("estadoActualizado", {
      ticketId: id,
      nuevoEstado: estado,
      fechaCierre
    });

    // 🔥 6. Emitir evento global SIEMPRE
    io.emit("ticketActualizadoGlobal", ticketCompleto);

    res.json({ message: "Estado actualizado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cambiar estado" });
  }
};
// ===============================
// Responder ticket (TI) - REALTIME
// ===============================
exports.responderTicket = async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body;

  if (!contenido || !contenido.trim()) {
    return res
      .status(400)
      .json({ message: "El contenido no puede estar vacío" });
  }

  try {
    const [[ticket]] = await pool.query(
      "SELECT estado FROM tickets WHERE id = ?",
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }

    if (ticket.estado === "Cerrado") {
      return res
        .status(400)
        .json({ message: "No se puede responder un ticket cerrado" });
    }

    // 1️⃣ Insertamos respuesta
    const [result] = await pool.query(
      `
      INSERT INTO respuestas 
      (ticket_id, autor, contenido, es_respuesta_ti)
      VALUES (?, 'TI', ?, TRUE)
      `,
      [id, contenido]
    );

    // 2️⃣ Obtenemos la respuesta recién creada
    const [[nuevaRespuesta]] = await pool.query(
      `
      SELECT id, autor, contenido, es_respuesta_ti, fecha_respuesta
      FROM respuestas
      WHERE id = ?
      `,
      [result.insertId]
    );

    // 3️⃣ Emitimos por socket al room del ticket
    const io = req.app.get("io");
    io.to(id.toString()).emit("nuevaRespuesta", nuevaRespuesta);

    // 4️⃣ Respondemos HTTP normal
    res.json({ message: "Respuesta enviada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al responder ticket" });
  }
};
// ===============================
// Historial de estados (PRO)
// ===============================
exports.getHistorialEstados = async (req, res) => {
  const { id } = req.params;

  try {
    const [historial] = await pool.query(
      `
      SELECT estado_anterior, estado_nuevo, cambiado_por, fecha_cambio
      FROM historial_estados
      WHERE ticket_id = ?
      ORDER BY fecha_cambio ASC
      `,
      [id]
    );

    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};

exports.getTicketsCerrados = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `SELECT *
       FROM tickets
       WHERE estado = 'Cerrado'
       ORDER BY fecha_cierre DESC`
    );

    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tickets cerrados" });
  }
};

exports.deleteTicketCerrado = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM tickets
       WHERE id = ? AND estado = 'Cerrado'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Solo se pueden eliminar tickets cerrados"
      });
    }
    const io = req.app.get("io");
    io.emit("ticketEliminado", id);

    res.json({ message: "Ticket eliminado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar ticket" });
  }
};

exports.deleteAllCerrados = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM tickets
       WHERE estado = 'Cerrado'`
    );

    const io = req.app.get("io");
    io.emit("ticketsCerradosVaciados");

    res.json({
      message: `${result.affectedRows} tickets cerrados eliminados`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al vaciar tickets cerrados" });
  }
};

exports.deleteRespuesta = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // 🔥 Obtener ticket_id antes de eliminar
    const [[respuesta]] = await pool.query(
      `SELECT ticket_id FROM respuestas WHERE id = ?`,
      [id]
    );

    if (!respuesta) {
      return res.status(404).json({
        message: "Respuesta no encontrada"
      });
    }

    const ticketId = respuesta.ticket_id;

    // 🔥 Eliminar respuesta
    await pool.query(
      `DELETE FROM respuestas WHERE id = ?`,
      [id]
    );

    // 🔥 Emitir evento
    const io = req.app.get("io");
    console.log("Emitir respuestaEliminada al ticket:", ticketId);
    io.to(ticketId.toString()).emit("respuestaEliminada", id);

    res.json({ message: "Respuesta eliminada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar respuesta" });
  }
};


