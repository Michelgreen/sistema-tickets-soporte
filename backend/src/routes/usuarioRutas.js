const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, requireDepartamento } = require("../middleware/authMiddleware");
const { analizarTicket } = require("../utils/analizadorIA");

router.post(
  "/tickets",
  verifyToken,
  requireDepartamento,
  async (req, res) => {
    try {
      const {
        asunto,
        descripcion,
        tipo,
        prioridad_usuario,
        sistema_afectado
      } = req.body;

      const departamento_id = req.usuario.id;

      // 🔥 Ejecutar IA
      const resultadoIA = analizarTicket({ asunto, descripcion });

      let prioridadFinal = prioridad_usuario;
      let urgencia = 0;

      if (resultadoIA.urgenciaDetectada) {
        prioridadFinal = "Alta";
        urgencia = 1;
      }

      // Insertar ticket
      const [result] = await pool.query(
        `INSERT INTO tickets
        (departamento_id, asunto, descripcion, tipo, prioridad_usuario, prioridad, sistema_afectado, urgencia_detectada)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          departamento_id,
          asunto,
          descripcion,
          tipo,
          prioridad_usuario,
          prioridadFinal,
          sistema_afectado,
          urgencia
        ]
      );

      const ticketId = result.insertId;

      // Guardar log IA
      await pool.query(
        `INSERT INTO log_ia
        (ticket_id, tipo_sugerido, prioridad_sugerida, urgencia_detectada, palabras_clave)
        VALUES (?, ?, ?, ?, ?)`,
        [
          ticketId,
          tipo,
          resultadoIA.prioridadSugerida,
          urgencia,
          resultadoIA.palabrasClave
        ]
      );

      res.status(201).json({
        message: "Ticket creado correctamente",
        ticketId
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear ticket" });
    }
  }
);

// ===============================
// Obtener mis tickets
// ===============================
router.get(
  "/mis-tickets",
  verifyToken,
  requireDepartamento,
  async (req, res) => {
    try {
      const departamento_id = req.usuario.id;

      const [tickets] = await pool.query(
        `
        SELECT 
          id,
          asunto,
          estado,
          prioridad_usuario,
          prioridad,
          urgencia_detectada,
          fecha_creacion,
          fecha_cierre
        FROM tickets
        WHERE departamento_id = ?
        ORDER BY fecha_creacion DESC
        `,
        [departamento_id]
      );

      res.json(tickets);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener tickets" });
    }
  }
);

// ===============================
// Obtener detalle de mi ticket
// ===============================
router.get(
  "/tickets/:id",
  verifyToken,
  requireDepartamento,
  async (req, res) => {
    try {
      const { id } = req.params;
      const departamento_id = req.usuario.id;

      const [[ticket]] = await pool.query(
        `
        SELECT *
        FROM tickets
        WHERE id = ? AND departamento_id = ?
        `,
        [id, departamento_id]
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
  }
);


// ===============================
// Responder ticket (Usuario)
// ===============================
router.post(
  "/tickets/:id/responder",
  verifyToken,
  requireDepartamento,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { contenido } = req.body;
      const departamento_id = req.usuario.id;

      if (!contenido || !contenido.trim()) {
        return res.status(400).json({ message: "Contenido vacío" });
      }

      const [[ticket]] = await pool.query(
        `
        SELECT estado 
        FROM tickets 
        WHERE id = ? AND departamento_id = ?
        `,
        [id, departamento_id]
      );

      if (!ticket) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }

      if (ticket.estado === "Cerrado") {
        return res.status(400).json({
          message: "No se puede responder un ticket cerrado"
        });
      }

      await pool.query(
        `
        INSERT INTO respuestas
        (ticket_id, autor, contenido, es_respuesta_ti)
        VALUES (?, 'Departamento', ?, FALSE)
        `,
        [id, contenido]
      );

      res.json({ message: "Respuesta enviada correctamente" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al responder" });
    }
  }
);


module.exports = router;
