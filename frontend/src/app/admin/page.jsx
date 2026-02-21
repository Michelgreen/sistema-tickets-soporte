"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllTickets } from "@/services/ticketsService";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/formatDate";
import { Search, Filter } from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [prioridadFiltro, setPrioridadFiltro] = useState("Todas");
  const [soloUrgentes, setSoloUrgentes] = useState(false);

useEffect(() => {
  let interval;

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets();

      // Ordenar por más reciente primero
      const ordenados = data.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );

      setTickets(ordenados);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar tickets");
      setLoading(false);
      router.replace("/login");
    }
  };

  fetchTickets();

  // Polling cada 5 segundos
  interval = setInterval(fetchTickets, 5000);

  return () => clearInterval(interval);
}, []);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      if (estadoFiltro !== "Todos" && t.estado !== estadoFiltro)
        return false;

      if (prioridadFiltro !== "Todas" && t.prioridad !== prioridadFiltro)
        return false;

      if (soloUrgentes && !t.urgencia_detectada)
        return false;

      if (busqueda.trim() !== "") {
        const texto = busqueda.toLowerCase();
        const coincide =
          String(t.id || "").toLowerCase().includes(texto) ||
          String(t.asunto || "").toLowerCase().includes(texto) ||
          String(t.departamento || "").toLowerCase().includes(texto) ||
          String(t.estado || "").toLowerCase().includes(texto) ||
          String(t.prioridad || "").toLowerCase().includes(texto);

        if (!coincide) return false;
      }

      return true;
    });
  }, [tickets, estadoFiltro, prioridadFiltro, soloUrgentes, busqueda]);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando tickets...
      </div>
    );

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* =======================
          MÉTRICAS COMPACTAS
      ======================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-800">
              {tickets.length}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Abiertos</p>
            <p className="text-xl font-bold text-green-600">
              {tickets.filter(t => t.estado === "Abierto").length}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">En proceso</p>
            <p className="text-xl font-bold text-yellow-600">
              {tickets.filter(t => t.estado === "En proceso").length}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs opacity-80">Urgentes</p>
            <p className="text-xl font-bold">
              {tickets.filter(t => t.urgencia_detectada).length}
            </p>
          </div>
        </motion.div>

      </div>

      {/* =======================
          HEADER
      ======================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Tickets Activos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {ticketsFiltrados.length} tickets encontrados
          </p>
        </div>

        <div className="relative w-full md:w-[380px] group">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-md group-focus-within:shadow-lg transition-all duration-300">

            <Search
              size={16}
              className="ml-4 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300"
            />

            <input
              type="text"
              placeholder="Buscar por ID, asunto o departamento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setBusqueda("");
              }}
              className="w-full bg-transparent px-3 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />

            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="mr-3 p-1 rounded-full hover:bg-gray-100 transition text-sm"
              >
                ✕
              </button>
            )}

          </div>
        </div>
      </motion.div>

      {/* =======================
    FILTROS COMPACTOS INLINE
======================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6"
      >

        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
          <Filter size={14} />
          Filtros:
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Estado */}
          <select
            className="px-3 py-2 text-sm rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-gray-300 transition"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option>Todos</option>
            <option>Abierto</option>
            <option>En proceso</option>
          </select>

          {/* Prioridad */}
          <select
            className="px-3 py-2 text-sm rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-gray-300 transition"
            value={prioridadFiltro}
            onChange={(e) => setPrioridadFiltro(e.target.value)}
          >
            <option>Todas</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>

          {/* Solo urgentes */}
          <label className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition">
            <input
              type="checkbox"
              checked={soloUrgentes}
              onChange={(e) => setSoloUrgentes(e.target.checked)}
            />
            Urgentes 🚨
          </label>

        </div>

      </motion.div>

      {/* =======================
          TABLA
      ======================= */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <table className="w-full text-gray-700 text-sm">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Departamento</th>
              <th className="p-3 text-left">Asunto</th>
              <th className="p-3 text-left hidden md:table-cell">Estado</th>
              <th className="p-3 text-left hidden sm:table-cell">Prioridad</th>
              <th className="p-3 text-left hidden lg:table-cell">Creado</th>
              <th className="p-3 text-left hidden lg:table-cell">Urgente</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence>
              {ticketsFiltrados.map((t) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-t hover:bg-blue-50 transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                >
                  <td className="p-3 font-medium">{t.id}</td>

                  <td className="p-3">
                    {t.departamento}
                  </td>

                  <td className="p-3 max-w-[250px] truncate">
                    {t.asunto}
                  </td>

                  <td className="p-3 hidden md:table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${t.estado === "Abierto"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {t.estado}
                    </span>
                  </td>

                  <td className="p-3 hidden sm:table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${t.prioridad === "Alta"
                          ? "bg-red-100 text-red-600"
                          : t.prioridad === "Media"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-green-100 text-green-600"
                        }`}
                    >
                      {t.prioridad}
                    </span>
                  </td>

                  <td className="p-3 text-xs hidden lg:table-cell">
                    {formatDate(t.fecha_creacion)}
                  </td>

                  <td className="p-3 hidden lg:table-cell">
                    {t.urgencia_detectada ? "🚨 Sí" : "—"}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {ticketsFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay tickets que coincidan con los filtros
          </div>
        )}
      </div>

    </div>
  );
}