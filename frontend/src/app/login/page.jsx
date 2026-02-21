"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Error al iniciar sesión");
      setLoading(false);
      return;
    }

    if (data.usuario.rol === "ADMIN_TI") {
      router.replace("/admin");
    } else {
      router.replace("/usuario");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">

      {/* 🔥 Fondo animado tipo Apple Music */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, #1e3a8a, transparent 50%)",
            "radial-gradient(circle at 80% 70%, #7c3aed, transparent 50%)",
            "radial-gradient(circle at 40% 80%, #0ea5e9, transparent 50%)",
            "radial-gradient(circle at 20% 30%, #1e3a8a, transparent 50%)"
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 opacity-40 blur-3xl"
      />

      {/* Glow adicional */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[180px] animate-pulse" />

      {/* Card */}
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onSubmit={handleSubmit}
        className="relative z-10 w-[380px] p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
      >
        <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-wide">
          Iniciar sesión
        </h1>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Email */}
        <div className="relative mb-5">
          <Mail className="absolute left-4 top-3 text-white/40" size={18} />
          <input
            type="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="relative mb-6">
          <Lock className="absolute left-4 top-3 text-white/40" size={18} />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:scale-[1.03] active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-900/40"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        <p className="text-center text-white/30 text-xs mt-6 tracking-wide">
          Sistema de Gestión de Tickets
        </p>
      </motion.form>
    </div>
  );
}