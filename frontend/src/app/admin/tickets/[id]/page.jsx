"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  getTicketById,
  updateEstado,
  responderTicket,
} from "@/services/ticketsService";
import { formatDate } from "@/utils/formatDate";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCcw, Trash2 } from "lucide-react";
import socket from "@/lib/socket";

export default function TicketDetailPage() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [loadingRespuesta, setLoadingRespuesta] = useState(false);
  const [respuesta, setRespuesta] = useState("");

  const [modal, setModal] = useState({
    open: false,
    action: null,
    data: null,
    message: "",
  });

  const chatRef = useRef(null);
  const firstLoadRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  /* =========================
     CARGA COMPLETA
  ========================= */
  const cargarTicket = async () => {
    try {
      const data = await getTicketById(id);
      setTicket(data.ticket);
      setRespuestas(data.respuestas);
      setNuevoEstado(data.ticket.estado);
    } catch { }
  };

  const cargarRespuestas = async () => {
    try {
      const data = await getTicketById(id);
      setRespuestas((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(data.respuestas)) {
          return data.respuestas;
        }
        return prev;
      });
    } catch { }
  };

  useEffect(() => {
    if (!id) return;
    cargarTicket();
  }, [id]);

  /* =========================
     SOCKET ROOM
  ========================= */
  useEffect(() => {
    if (!id) return;

    socket.emit("joinTicket", id);

    socket.on("nuevaRespuesta", (nueva) => {
      setRespuestas((prev) => {
        // evitar duplicados
        if (prev.some((r) => r.id === nueva.id)) return prev;
        return [...prev, nueva];
      });
    });

    socket.on("respuestaEliminada", (respuestaId) => {
      setRespuestas((prev) =>
        prev.filter((r) => r.id !== respuestaId)
      );
    });

    socket.on("estadoActualizado", (data) => {
      setTicket((prev) => ({
        ...prev,
        estado: data.nuevoEstado,
        fecha_cierre: data.fechaCierre
      }));
    });

    socket.on("ticketActualizadoGlobal", (updatedTicket) => {
      if (updatedTicket.id === Number(id)) {
        setTicket(updatedTicket);
      }
    });


    return () => {
      socket.off("nuevaRespuesta");
      socket.off("respuestaEliminada");
      socket.off("estadoActualizado");
      socket.off("ticketActualizadoGlobal");
    };
  }, [id]);

  /* =========================
     SCROLL INTELIGENTE
  ========================= */
  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 100;
      const isBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;

      setIsAtBottom(isBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    if (firstLoadRef.current) {
      container.scrollTop = container.scrollHeight;
      firstLoadRef.current = false;
      return;
    }

    if (isAtBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [respuestas, isAtBottom]);

  if (!ticket)
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando ticket...
      </div>
    );

  const isClosed = ticket.estado === "Cerrado";

  const estadoColor = {
    Abierto: "bg-green-100 text-green-700",
    "En proceso": "bg-yellow-100 text-yellow-700",
    Cerrado: "bg-gray-200 text-gray-700",
  };

  const prioridadColor = {
    Alta: "bg-red-100 text-red-600",
    Media: "bg-orange-100 text-orange-600",
    Baja: "bg-green-100 text-green-600",
  };

  const abrirModal = (action, data = null) => {
    let message = "";

    if (action === "estado") {
      if (nuevoEstado === ticket.estado) {
        setModal({
          open: true,
          action: "estadoDuplicado",
          data: null,
          message: `El ticket ya está en estado "${ticket.estado}".`,
        });
        return;
      }

      message = `¿Cambiar estado a "${nuevoEstado}"?`;
    }

    if (action === "eliminarRespuesta")
      message = "¿Eliminar esta respuesta?";

    setModal({ open: true, action, data, message });
  };

  const confirmarAccion = async () => {
    const { action, data } = modal;

    if (action === "estado") {
      try {
        setLoadingEstado(true);
        await updateEstado(id, nuevoEstado);
      } finally {
        setLoadingEstado(false);
      }
    }

    if (action === "eliminarRespuesta") {
      await fetch(
        `http://localhost:3001/api/tickets/respuestas/${data}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      await cargarRespuestas();
    }

    setModal({ open: false, action: null, data: null, message: "" });
  };

  const handleSendRespuesta = async () => {
    if (!respuesta.trim()) return;

    try {
      setLoadingRespuesta(true);
      await responderTicket(id, respuesta);
      setRespuesta("");
      // no cargamos manualmente, el socket lo hará
    } finally {
      setLoadingRespuesta(false);
    }
  };

  return (
    <div className="p-8 space-y-8">

      {/* ================= HEADER ================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-start gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Ticket #{ticket.id}
          </h1>

          <p className="text-gray-500 text-lg mt-1">
            {ticket.asunto}
          </p>

          {/* Departamento visible */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            🏢 {ticket.departamento}
          </div>

          {/* Descripción */}
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-semibold">
              Descripción
            </p>

            <p className="text-gray-700 whitespace-pre-line">
              {ticket.descripcion}
            </p>
          </div>

        </div>

        <div className="flex gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoColor[ticket.estado]}`}
          >
            {ticket.estado}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${prioridadColor[ticket.prioridad]}`}
          >
            {ticket.prioridad}
          </span>
        </div>
      </motion.div>

      {/* ================= CAMBIAR ESTADO ================= */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <select
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value)}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option>Abierto</option>
          <option>En proceso</option>
          <option>Cerrado</option>
        </select>

        <button
          onClick={() => abrirModal("estado")}
          disabled={loadingEstado}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all"
        >
          <RefreshCcw size={16} />
          {loadingEstado ? "Actualizando..." : "Actualizar estado"}
        </button>
      </div>

      {/* ================= CONVERSACIÓN ================= */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Conversación
        </h2>

        <div
          ref={chatRef}
          className="space-y-4 max-h-[400px] overflow-y-auto pr-2"
        >
          {respuestas.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${r.es_respuesta_ti ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`relative max-w-[70%] p-4 rounded-xl shadow-md border ${r.es_respuesta_ti
                  ? "bg-green-100 text-green-900 border-green-200"
                  : "bg-blue-50 text-blue-900 border-blue-200"
                  }`}
              >
                <p className="text-xs font-semibold mb-1">
                  {r.es_respuesta_ti ? "Soporte TI" : ticket.departamento}
                </p>

                <p className="text-sm">{r.contenido}</p>

                <p className="text-[10px] text-right mt-2 opacity-60">
                  {formatDate(r.fecha_respuesta)}
                </p>

                <button
                  onClick={() => abrirModal("eliminarRespuesta", r.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ================= RESPONDER ================= */}
      {!isClosed && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="bg-slate-100 rounded-2xl p-6 shadow-inner">
            <textarea
              className="w-full resize-none bg-white border-2 border-transparent rounded-xl p-4 shadow-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-400 transition-all"
              rows="4"
              placeholder="Respuesta de TI..."
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />

            <div className="flex justify-start mt-4">
              <button
                onClick={handleSendRespuesta}
                disabled={loadingRespuesta || !respuesta.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Send size={16} />
                {loadingRespuesta ? "Enviando..." : "Enviar respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full"
            >
              <h2 className="text-xl font-bold mb-4">
                Confirmar acción
              </h2>

              <p className="text-gray-600 mb-6">
                {modal.message}
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() =>
                    setModal({ open: false, action: null, data: null, message: "" })
                  }
                  className={`px-4 py-2 rounded-lg transition ${modal.action === "estadoDuplicado"
                      ? "bg-yellow-500 text-white hover:bg-yellow-600"
                      : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                  {modal.action === "estadoDuplicado" ? "Entendido" : "Cancelar"}
                </button>

                {modal.action !== "estadoDuplicado" && (
                  <button
                    onClick={confirmarAccion}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Confirmar
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}