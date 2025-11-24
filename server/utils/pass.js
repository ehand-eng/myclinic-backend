
const bcrypt = require("bcrypt");

async function run() {
  const saltRounds = 10;
  const hash = await bcrypt.hash("admin123", saltRounds);
  console.log(hash);
}

run();