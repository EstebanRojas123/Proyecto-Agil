export async function loginService(email: string, password: string) {
  const answer = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  console.log("Respuesta fetch:", answer);

  if (!answer.ok) throw new Error("Credenciales incorrectas!");
  return answer.json();
}
