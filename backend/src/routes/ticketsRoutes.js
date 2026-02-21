const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const ticketsController = require("../controllers/ticketsController");

// Obtener todos los tickets (Admin TI)
router.get("/", verifyToken, requireAdmin, ticketsController.getAllTickets);

// Obtener tickets cerrados
router.get("/cerrados",verifyToken,requireAdmin,ticketsController.getTicketsCerrados);

// Vaciar todos los cerrados
router.delete("/cerrados/all",verifyToken,requireAdmin,ticketsController.deleteAllCerrados);

// Obtener ticket por ID + respuestas
router.get("/:id", verifyToken, requireAdmin, ticketsController.getTicketById);

// Cambiar estado del ticket
router.patch("/:id/estado", verifyToken, requireAdmin, ticketsController.updateEstado);

// Responder ticket (TI)
router.post("/:id/responder", verifyToken, requireAdmin, ticketsController.responderTicket);

// Eliminar ticket cerrado individual
router.delete("/:id",verifyToken,requireAdmin,ticketsController.deleteTicketCerrado);

// Historial de estados (auditoría)
router.get("/:id/historial",verifyToken, requireAdmin, ticketsController.getHistorialEstados);

//borrar respuestas de los tickets solo admin
router.delete("/respuestas/:id",verifyToken,requireAdmin,ticketsController.deleteRespuesta);




module.exports = router;
