"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, PlusCircle, LogOut, Archive } from "lucide-react";

export default function UsuarioLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await fetch("http://localhost:3001/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });

        router.push("/login");
    };

    const NavItem = ({ href, icon: Icon, label }) => {
        const active = pathname === href;

        return (
            <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${active
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
            >
                <Icon size={18} />
                {label}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 text-black">

            {/* Overlay móvil */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white p-6 z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold tracking-wide">
                        Panel Usuario
                    </h2>

                    <button
                        className="md:hidden"
                        onClick={() => setOpen(false)}
                    >
                        <X size={22} />
                    </button>
                </div>

                <nav className="space-y-2">
                    <NavItem
                        href="/usuario"
                        icon={LayoutDashboard}
                        label="Mis Tickets"
                    />

                    <NavItem
                        href="/usuario/tickets/nuevo"
                        icon={PlusCircle}
                        label="Crear Ticket"
                    />

                    <NavItem
                        href="/usuario/cerrados"
                        icon={Archive}
                        label="Tickets Cerrados"
                    />

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200 mt-6"
                    >
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </nav>
            </aside>

            {/* Contenido */}
            <div className="md:ml-64 flex flex-col min-h-screen">

                {/* Topbar móvil */}
                <header className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
                    <button onClick={() => setOpen(true)}>
                        <Menu size={22} />
                    </button>

                    <h1 className="font-semibold">Usuario</h1>
                </header>

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}