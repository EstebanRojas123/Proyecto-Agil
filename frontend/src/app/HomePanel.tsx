"use client";
import { useAuth } from "@/hooks/useAuth";

export default function HomePanel() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold text-red-500">
          No estás logueado
        </h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Aside lateral izquierdo */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col justify-between p-6">
        <div>
          <h2 className="text-lg font-bold mb-6">Menú</h2>
          <nav className="space-y-4">
            <a href="#" className="block hover:text-gray-300">
              Malla Curricular
            </a>
            <a href="#" className="block hover:text-gray-300">
              Mi Trayectoria
            </a>
            <a href="#" className="block hover:text-gray-300">
              Mis Proyecciones
            </a>
          </nav>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
        >
          Salir →
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Malla Curricular
        </h1>
      </main>
    </div>
  );
}

