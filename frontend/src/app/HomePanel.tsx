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
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
      <div className="bg-black p-8 rounded-2xl shadow-xl w-80 text-center">
        <h1 className="text-2xl font-bold mb-4">Bienvenido 🎉</h1>
        <p className="mb-6 text-black-800 font-semibold">
          Este es tu panel de usuario. Aquí puedes ver tu información:
        </p>

        <div className="bg-gray-200 p-4 rounded-lg mb-6 text-left font-mono text-sm break-all text-black">
          <p>
            <strong>RUT:</strong> {user.rut}
          </p>
          <p>
            <strong>Carreras:</strong>{" "}
            {user.carreras.map((c) => c.nombre).join(", ")}
          </p>
          <p>
            <strong>Token:</strong> {localStorage.getItem("token")}
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
