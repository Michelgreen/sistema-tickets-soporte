const jwt = require("jsonwebtoken");

// 1️⃣ Solo verifica token
exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// 2️⃣ Solo Admin TI
exports.requireAdmin = (req, res, next) => {
  if (req.usuario.rol !== "ADMIN_TI") {
    return res.status(403).json({ message: "Acceso solo para Admin TI" });
  }
  next();
};

// 3️⃣ Solo Departamento
exports.requireDepartamento = (req, res, next) => {
  if (req.usuario.rol !== "DEPARTAMENTO") {
    return res.status(403).json({ message: "Acceso solo para Departamentos" });
  }
  next();
};
