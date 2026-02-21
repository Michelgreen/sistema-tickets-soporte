require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
