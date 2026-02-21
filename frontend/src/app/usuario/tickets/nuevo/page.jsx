"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NuevoTicketPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    asunto: "",
    descripcion: "",
    tipo: "Soporte General",
    prioridad_usuario: "Media",
    sistema_afectado: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/usuario/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al crear ticket");
        setLoading(false);
        return;
      }

      router.push("/usuario");
      router.refresh();
    } catch (err) {
      setError("Error del servidor");
    }

    setLoading(false);
  };

  const prioridadColor = {
    Baja: "bg-gray-500",
    Media: "bg-orange-500",
    Alta: "bg-red-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl"
      >
        <h1 className="text-3xl font-bold mb-8 text-slate-800">
          🎫 Crear Nuevo Ticket
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Asunto */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Asunto
            </label>
            <input
              type="text"
              name="asunto"
              placeholder="Describe brevemente el problema"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-slate-800"
              value={form.asunto}
              onChange={handleChange}
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              placeholder="Explica detalladamente la situación"
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-slate-800"
              value={form.descripcion}
              onChange={handleChange}
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de Solicitud
            </label>
            <select
              name="tipo"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-slate-800"
              value={form.tipo}
              onChange={handleChange}
            >
              <option>Soporte General</option>
              <option>Problema Técnico</option>
              <option>Consulta</option>
              <option>Sugerencia</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prioridad
            </label>

            <div className="flex gap-4">
              {["Baja", "Media", "Alta"].map((nivel) => (
                <button
                  type="button"
                  key={nivel}
                  onClick={() =>
                    setForm({ ...form, prioridad_usuario: nivel })
                  }
                  className={`flex-1 py-2 rounded-lg text-white font-semibold transition-all duration-300 ${form.prioridad_usuario === nivel
                      ? `${prioridadColor[nivel]} scale-105 shadow-lg`
                      : "bg-slate-300 text-slate-700"
                    }`}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </div>

          {/* Sistema afectado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Sistema Afectado (Opcional)
            </label>
            <input
              type="text"
              name="sistema_afectado"
              placeholder="Ej: Sistema de ventas"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-slate-800"
              value={form.sistema_afectado}
              onChange={handleChange}
            />
          </div>

          {/* Botón */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold shadow-md"
          >
            {loading ? "Creando ticket..." : "Crear Ticket"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}