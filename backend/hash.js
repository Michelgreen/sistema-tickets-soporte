const bcrypt = require("bcryptjs");

const password = "Skrillex"; // la que tú quieras

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
