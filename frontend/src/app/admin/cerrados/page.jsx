"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/utils/formatDate";
import { Eye, Trash2, ArchiveRestore, Search, X } from "lucide-react";
import Link from "next/link";

export default function TicketsCerradosPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const ticketsPorPagina = 3;

  const [modal, setModal] = useState({
    open: false,
    action: null,
    ticketId: null,
    message: "",
  });

  const fetchTickets = async () => {
    const res = await fetch(
      "http://localhost:3001/api/tickets/cerrados",
      { credentials: "include" }
    );

    const data = await res.json();
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* =========================
     ACCIONES
  ========================= */

  const eliminarTicket = async (id) => {
    await fetch(`http://localhost:3001/api/tickets/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const reabrirTicket = async (id) => {
    await fetch(`http://localhost:3001/api/tickets/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ estado: "En proceso" }),
    });

    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const vaciarTodos = async () => {
    await fetch(
      "http://localhost:3001/api/tickets/cerrados/all",
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    setTickets([]);
  };

  const abrirModal = (action, ticketId = null) => {
    let message = "";

    if (action === "eliminar")
      message = "¿Seguro que deseas eliminar este ticket permanentemente?";
    if (action === "reabrir")
      message = "¿Deseas reabrir este ticket?";
    if (action === "vaciar")
      message =
        "Esto eliminará TODOS los tickets cerrados. ¿Continuar?";

    setModal({ open: true, action, ticketId, message });
  };

  const confirmarAccion = async () => {
    const { action, ticketId } = modal;

    if (action === "eliminar") await eliminarTicket(ticketId);
    if (action === "reabrir") await reabrirTicket(ticketId);
    if (action === "vaciar") await vaciarTodos();

    setModal({ open: false, action: null, ticketId: null, message: "" });
  };

  const prioridadColor = (prioridad) => {
    if (prioridad === "Alta") return "bg-red-100 text-red-600";
    if (prioridad === "Media") return "bg-yellow-100 text-yellow-600";
    return "bg-green-100 text-green-600";
  };

  /* =========================
     FILTRADO
  ========================= */

  const ticketsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return tickets;

    const texto = busqueda.toLowerCase();

    return tickets.filter((t) => {
      return (
        String(t.id || "").toLowerCase().includes(texto) ||
        String(t.asunto || "").toLowerCase().includes(texto) ||
        String(t.prioridad || "").toLowerCase().includes(texto) ||
        String(t.departamento || "")
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [tickets, busqueda]);

  /* =========================
     PAGINACIÓN
  ========================= */

  const totalPaginas = Math.ceil(
    ticketsFiltrados.length / ticketsPorPagina
  );

  const indiceInicio =
    (paginaActual - 1) * ticketsPorPagina;

  const ticketsPagina = ticketsFiltrados.slice(
    indiceInicio,
    indiceInicio + ticketsPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando tickets...
      </div>
    );

  return (
    <div className="p-8">

      {/* BUSCADOR */}
      <div className="mb-10 max-w-lg">
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition"
          />

          <input
            type="text"
            placeholder="Buscar por ID, asunto, prioridad o departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white border border-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Tickets Cerrados
        </h1>

        {ticketsFiltrados.length > 0 && (
          <button
            onClick={() => abrirModal("vaciar")}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            Vaciar todos
          </button>
        )}
      </div>

      {/* LISTA */}
      {ticketsFiltrados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-20 text-gray-500"
        >
          <ArchiveRestore size={48} className="mx-auto mb-4 opacity-40" />
          No hay tickets cerrados
        </motion.div>
      ) : (
        <>
          <div className="grid gap-6">
            <AnimatePresence>
              {ticketsPagina.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {ticket.asunto}
                      </h2>
                      <p className="text-sm text-gray-500">
                        ID #{ticket.id}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${prioridadColor(
                        ticket.prioridad
                      )}`}
                    >
                      {ticket.prioridad}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Cerrado el {formatDate(ticket.fecha_cierre)}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition"
                    >
                      <Eye size={16} />
                      Ver
                    </Link>

                    <button
                      onClick={() => abrirModal("reabrir", ticket.id)}
                      className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition"
                    >
                      <ArchiveRestore size={16} />
                      Reabrir
                    </button>

                    <button
                      onClick={() => abrirModal("eliminar", ticket.id)}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPaginaActual(i + 1)}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    paginaActual === i + 1
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL */}
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
                    setModal({
                      open: false,
                      action: null,
                      ticketId: null,
                      message: "",
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmarAccion}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}