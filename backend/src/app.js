require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io")

const authRoutes = require("./routes/authRoutes");
const ticketsRoutes = require("./routes/ticketsRoutes");
const usuarioRutas = require("./routes/usuarioRutas");

const app = express();

// CORS BIEN CONFIGURADO
app.use(
  cors({
    origin: "http://localhost:3000", // frontend Next
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ========================
   SOCKET.IO
======================== */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

//  Guardamos io para usarlo en controladores
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("joinTicket", (ticketId) => {
    console.log("Usuario unido al room:", ticketId);
    socket.join(ticketId.toString());
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});


// Rutas
app.use("/api/auth", authRoutes);
//app.use("/admin/tickets", ticketsRoutes);
app.use("/api/tickets", ticketsRoutes);


app.use("/api/usuario", usuarioRutas);

app.get("/", (req, res) => {
  res.send(`
Yo estoy puesto pa ti y tú te me quitas
Diablo, qué piquete la chamaquita
  `);
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
