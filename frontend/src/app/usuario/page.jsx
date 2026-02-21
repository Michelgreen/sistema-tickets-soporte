"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerMisTickets } from "@/services/ticketsService";
import { formatDate } from "@/utils/formatDate";
import { Search, Ticket, ticket } from "lucide-react";

export default function UsuarioPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const ticketsPorPagina = 3;

  /* =========================
     CARGA + POLLING
  ========================= */
  useEffect(() => {
    let interval;

    const cargarTickets = async () => {
      try {
        const data = await obtenerMisTickets();

        const activos = data
          .filter((t) => t.estado !== "Cerrado")
          .sort(
            (a, b) =>
              new Date(b.fecha_creacion) -
              new Date(a.fecha_creacion)
          );

        setTickets(activos);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarTickets();
    interval = setInterval(cargarTickets, 4000);

    return () => clearInterval(interval);
  }, []);

  /* =========================
     FILTRADO BUSCADOR
  ========================= */
  const normalizar = (texto) => {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

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
        Cargando tickets...
      </div>
    );

  return (
    <div className="space-y-6">

      {/* HEADER + BUSCADOR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Ticket className="text-blue-600" size={24} />
            Mis Tickets
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
            placeholder="Buscar ticket..."
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
          No se encontraron tickets.
        </div>
      ) : (
        <>
          <div className="space-y-5">
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
                    className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {ticket.asunto}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {ticket.descripcion}
                        </p>
                      </div>

                      <span
                        className={`px-4 py-1 rounded-full text-xs font-semibold ${ticket.estado === "Abierto"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {ticket.estado}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">
                      Creado el {formatDate(ticket.fecha_creacion)}
                    </p>

                    {ticket.urgencia_detectada === 1 && (
                      <motion.div
                        animate={{
                          opacity: [0.8, 1, 0.8],
                          boxShadow: [
                            "0 0 0px rgba(139,92,246,0.4)",
                            "0 0 18px rgba(139,92,246,0.8)",
                            "0 0 0px rgba(139,92,246,0.4)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="mt-4 inline-block px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold"
                      >
                        IA Elevó Prioridad
                      </motion.div>
                    )}
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