"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  obtenerDetalleTicket,
  responderTicketUsuario,
} from "@/services/ticketsService";
import { formatDate } from "@/utils/formatDate";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

export default function DetalleTicket() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  const chatRef = useRef(null);
  const firstLoadRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const cargarTicket = async () => {
    try {
      const data = await obtenerDetalleTicket(id);
      setTicket(data.ticket);
      setRespuestas(data.respuestas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cargarRespuestas = async () => {
    try {
      const data = await obtenerDetalleTicket(id);

      setRespuestas((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(data.respuestas)) {
          return data.respuestas;
        }
        return prev;
      });

      setTicket(data.ticket);
    } catch {}
  };

  useEffect(() => {
    if (!id) return;
    cargarTicket();
  }, [id]);

  // 🔥 Polling inteligente
useEffect(() => {
  if (!id) return;

  const interval = setInterval(async () => {
    try {
      const data = await obtenerDetalleTicket(id);

      // 🔥 Si cambió el estado, actualizarlo
      if (ticket && data.ticket.estado !== ticket.estado) {
        setTicket(data.ticket);
      }

      // 🔥 Si cambiaron respuestas, actualizar
      setRespuestas((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(data.respuestas)) {
          return data.respuestas;
        }
        return prev;
      });

    } catch {}
  }, 5000);

  return () => clearInterval(interval);
}, [id, ticket]);

  // 🔥 Detectar si está abajo
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

  // 🔥 Scroll inteligente
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

  const enviarRespuesta = async () => {
    if (!mensaje.trim()) return;

    await responderTicketUsuario(id, mensaje);
    setMensaje("");
    await cargarRespuestas();
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case "Abierto":
        return "bg-red-100 text-red-700";
      case "En proceso":
        return "bg-yellow-100 text-yellow-700";
      case "Cerrado":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const prioridadColor = (prioridad) => {
    switch (prioridad) {
      case "Alta":
        return "bg-red-600 text-white";
      case "Media":
        return "bg-orange-500 text-white";
      case "Baja":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {ticket.asunto}
            </h1>
            <p className="text-slate-500 mt-2">
              {ticket.descripcion}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <span
              className={`text-xs px-3 py-1 rounded-full ${estadoColor(
                ticket.estado
              )}`}
            >
              {ticket.estado}
            </span>

            <span
              className={`text-xs px-3 py-1 rounded-full ${prioridadColor(
                ticket.prioridad
              )}`}
            >
              Prioridad {ticket.prioridad}
            </span>

            {ticket.urgencia_detectada === 1 && (
              <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full animate-pulse">
                IA Elevó Prioridad
              </span>
            )}
          </div>
        </div>

        <hr className="mb-6" />

        {/* Conversación */}
        <h2 className="text-lg font-semibold mb-4 text-slate-700">
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
              transition={{ duration: 0.2 }}
              className={`flex ${
                r.es_respuesta_ti ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-xl shadow-md transition-all duration-300 ${
                  r.es_respuesta_ti
                    ? "bg-blue-100 text-blue-900"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                <p className="text-xs font-semibold mb-1">
                  {r.es_respuesta_ti ? "Soporte TI" : "Departamento"}
                </p>

                <p className="text-sm">{r.contenido}</p>

                <p className="text-[10px] text-right mt-2 opacity-60">
                  {formatDate(r.fecha_respuesta)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

{/* Área de Respuesta estilo TI */}
{ticket.estado !== "Cerrado" && (
  <div className="mt-6 bg-slate-100 rounded-2xl p-6 shadow-inner text-black">

    <textarea
      value={mensaje}
      onChange={(e) => setMensaje(e.target.value)}
      placeholder="Respuesta..."
      className="
        w-full
        resize-none
        bg-white
        border-2 border-transparent
        rounded-xl
        p-4
        shadow-sm
        focus:outline-none
        focus:border-green-500
        focus:ring-2 focus:ring-green-400
        transition-all duration-200
      "
      rows="4"
    />

    <div className="flex justify-start mt-4">
      <button
        onClick={enviarRespuesta}
        className="
          flex items-center gap-2
          bg-green-600 hover:bg-green-700
          text-white
          px-6 py-3
          rounded-xl
          shadow-md
          transition-all duration-300
          hover:scale-105 active:scale-95
        "
      >
        <Send size={16} />
        Enviar respuesta
      </button>
    </div>

  </div>
)}

        {ticket.estado === "Cerrado" && (
          <div className="mt-6 text-center text-green-600 font-semibold">
            Este ticket está cerrado.
          </div>
        )}
      </div>
    </div>
  );
}