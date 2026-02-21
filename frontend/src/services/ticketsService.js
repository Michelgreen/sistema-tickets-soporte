const API_URL = "http://localhost:3001/api";

/* ===============================
   ADMIN TI
=============================== */

// Obtener todos los tickets
export async function getAllTickets() {
  const res = await fetch(`${API_URL}/tickets`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar los tickets");
  }

  return res.json();
}

// Obtener ticket por ID
export async function getTicketById(id) {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al cargar el ticket");
  }

  return res.json();
}

// Actualizar estado del ticket
export async function updateEstado(id, estado) {
  const res = await fetch(`${API_URL}/tickets/${id}/estado`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });

  if (!res.ok) {
    throw new Error("Error al actualizar el estado del ticket");
  }

  return res.json();
}

// Responder ticket (TI)
export async function responderTicket(id, contenido) {
  const res = await fetch(`${API_URL}/tickets/${id}/responder`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contenido }),
  });

  if (!res.ok) {
    throw new Error("Error al enviar la respuesta");
  }

  return res.json();
}

// Historial de estados
export async function getHistorialEstados(id) {
  const res = await fetch(`${API_URL}/tickets/${id}/historial`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al cargar historial");
  }

  return res.json();
}

/* ===============================
   USUARIO / DEPARTAMENTO
=============================== */

// Obtener mis tickets
export async function obtenerMisTickets() {
  const res = await fetch(`${API_URL}/usuario/mis-tickets`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener tickets");
  }

  return res.json();
}

// Obtener detalle de mi ticket
export async function obtenerDetalleTicket(id) {
  const res = await fetch(`${API_URL}/usuario/tickets/${id}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener detalle");
  }

  return res.json();
}

// Responder ticket (Usuario)
export async function responderTicketUsuario(id, contenido) {
  const res = await fetch(
    `${API_URL}/usuario/tickets/${id}/responder`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contenido }),
    }
  );

  if (!res.ok) {
    throw new Error("Error al responder");
  }

  return res.json();
}