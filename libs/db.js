/* eslint-disable prefer-destructuring */
/* eslint-disable no-else-return */

const knex = require("knex");

const app = {};
const conn = {};

function parseMysqlUrl(connStringUrl) {
  const parsed = new URL(connStringUrl);
  return {
    host: parsed.hostname,
    port: parsed.port || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ""), // hapus leading "/"
    decimalNumbers: true, // <--- ini penting banget agar decimal tidak dijadikan STRING
    charset: process.env.DB_CHARSET || "utf8", // Match dengan server
    collation: process.env.DB_COLLATION || "utf8_general_ci", // Match dengan server
  };
}

function knexInstance(name) {
  const ctx = conn[name];
  // if (ctx && ctx.client && ctx.client.pool && !ctx.client.pool.destroyed) {
  // if (ctx && ctx.client && ctx.client.pool) {
  if (ctx && ctx.client && typeof ctx.destroy === "function") {
    return ctx;
  } else {
    const client = "mysql2";
    // const connection = process.env[`DB_${name.toUpperCase()}`];
    conn[name] = knex({
      client,
      connection: parseMysqlUrl(process.env[`DB_${name.toUpperCase()}`]),
      pool: {
        min: parseInt(process.env.MIN_POOL) || 1,
        max: parseInt(process.env.MAX_POOL) || 10,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        afterCreate: (conn, done) => {
          conn.query("SHOW STATUS LIKE 'Threads_connected'", (err, results) => {
            if (err) {
              console.log(
                "New DB connection created: Error checking Threads_connected:",
                err
              );
            } else {
              const threadsConnected = results[0]?.Value || "N/A";
              console.log(
                "New DB connection created: Total Connections(all clients):",
                threadsConnected
              );
            }
            done(null, conn); // wajib tetap panggil done()
          });
        },
      },
      debug: false,
    });
    return conn[name];
  }
}

app.instance = (option) => {
  let name = "proj";

  if (option) {
    switch (typeof option) {
      case "string":
        name = option;
        break;
      default:
        if (option.name) name = option.name;
        break;
    }
  }

  const ctx = knexInstance(name);
  if (!ctx.trans) {
    ctx.trans = () => {
      return new Promise((resolve) => {
        ctx.transaction((trx) => {
          resolve(trx);
        });
      });
    };
  }

  return ctx;
};

app.databaseName = (name) => {
  const objConn = parseMysqlUrl(process.env[`DB_${name.toUpperCase()}`]);

  return objConn.database;
};

app.destroyAll = async () => {
  await Promise.all(Object.values(conn).map((db) => db.destroy()));
};

app.resetKnex = async () => {
  for (const key in conn) {
    const dbInstance = conn[key]; // Dapatkan value (instance Knex) dari key
    if (dbInstance && typeof dbInstance.destroy === "function") {
      await dbInstance.destroy(); // Tunggu hingga destroy selesai
      delete conn[key]; // Hapus instance dari cache menggunakan key
    }
  }
};

module.exports = app;
