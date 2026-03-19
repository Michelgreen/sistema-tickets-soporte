"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerMisTickets } from "@/services/ticketsService";
import { formatDate } from "@/utils/formatDate";
import { Search, Archive } from "lucide-react";
import socket from "@/lib/socket";

export default function TicketsCerradosPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [paginaActual, setPaginaActual] = useState(1);

    const ticketsPorPagina = 5;

useEffect(() => {
  const cargarTickets = async () => {
    try {
      const data = await obtenerMisTickets();

      const cerrados = data
        .filter((t) => t.estado === "Cerrado")
        .sort(
          (a, b) =>
            new Date(b.fecha_cierre) -
            new Date(a.fecha_cierre)
        );

      setTickets(cerrados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  cargarTickets();
}, []);

useEffect(() => {
  socket.on("ticketActualizadoGlobal", (ticket) => {
    setTickets((prev) => {
      // Si ya no está cerrado → quitarlo
      if (ticket.estado !== "Cerrado") {
        return prev.filter((t) => t.id !== ticket.id);
      }

      // Si ahora está cerrado → actualizar o agregar
      const existe = prev.some((t) => t.id === ticket.id);

      if (existe) {
        return prev.map((t) =>
          t.id === ticket.id ? ticket : t
        );
      }

      return [ticket, ...prev];
    });
  });

  socket.on("ticketEliminado", (id) => {
    setTickets((prev) =>
      prev.filter((t) => t.id !== Number(id))
    );
  });

  socket.on("ticketsCerradosVaciados", () => {
    setTickets([]);
  });

  return () => {
    socket.off("ticketActualizadoGlobal");
    socket.off("ticketEliminado");
    socket.off("ticketsCerradosVaciados");
  };
}, []);

    /* =========================
       NORMALIZAR TEXTO (sin acentos)
    ========================= */
    const normalizar = (texto) => {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    };

    /* =========================
       FILTRADO
    ========================= */
    const ticketsFiltrados = useMemo(() => {
        const texto = normalizar(busqueda.trim());

        if (!texto) return tickets;

        return tickets.filter((t) => {
            const asunto = normalizar(String(t.asunto || ""));
            const descripcion = normalizar(String(t.descripcion || ""));

            return (
                asunto.includes(texto) ||
                descripcion.includes(texto)
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

    if (loading)
        return (
            <div className="text-gray-500 animate-pulse">
                Cargando tickets cerrados...
            </div>
        );

    return (
        <div className="space-y-6">

            {/* HEADER + BUSCADOR */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                        <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                            <Archive size={20} />
                        </div>
                        Tickets Cerrados
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {ticketsFiltrados.length} resultado(s)
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search
                        size={16}
                        className="absolute left-4 top-3 text-gray-400 group-focus-within:text-blue-600 transition"
                    />
                    <input
                        type="text"
                        placeholder="Buscar ticket cerrado..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            setPaginaActual(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>
            </div>

            {/* LISTA */}
            {ticketsFiltrados.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
                    No se encontraron tickets cerrados.
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            {ticketsPagina.map((ticket, index) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={`/usuario/tickets/${ticket.id}`}
                                        className="block bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition border border-gray-100 opacity-90 hover:opacity-100"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-800">
                                                {ticket.asunto}
                                            </h3>

                                            <span className="px-4 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                                                Cerrado
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                                            {ticket.descripcion}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            Cerrado el {formatDate(ticket.fecha_cierre)}
                                        </p>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* PAGINACIÓN */}
                    {totalPaginas > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-8">
                            {Array.from({ length: totalPaginas }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPaginaActual(i + 1)}
                                    className={`w-9 h-9 rounded-lg font-semibold transition ${paginaActual === i + 1
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
        </div>
    );
}