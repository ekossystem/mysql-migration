/* eslint-disable no-console */
const envs = require("./envs/local.json");
// const readline = require('readline');
const moment = require("moment");
const { db } = require("./libs");

Object.keys(envs).forEach((key) => {
  process.env[key] = envs[key];
});
console.log('PROCESS "Migrasi data DB1 ke DB2" begins');
process.on("exit", function (code) {
  return console.log(
    `PROCESS "Migrasi data DB1 ke DB2" Exit with code ${code}`
  );
});

async function main() {
  const dbSrc = db.instance("src");
  const dbDest = db.instance("dest");
  try {
    // const hariini = moment();
    console.log(
      `Start PROCESS "Migrasi data DB1 ke DB2" @ ${moment().format(
        "DD-MMM-YY HH:mm:ss"
      )}`
    );
    const builder1 = dbDest("information_schema.tables")
      .where({
        table_schema: db.databaseName("dest"),
        table_type: "BASE TABLE",
      }) // Ganti dengan nama database Anda
      .select("table_name");
    console.log("#builder1 native: ", builder1.toSQL().toNative());
    let tables = await builder1;

    const tableDbDest = tables.map(
      (table) => table.TABLE_NAME || table.table_name
    );

    const builder2 = dbSrc("information_schema.tables")
      .where({
        table_schema: db.databaseName("src"),
        table_type: "BASE TABLE",
      }) // Ganti dengan nama database Anda
      .select("table_name");
    console.log("#builder2 native: ", builder2.toSQL().toNative());
    tables = await builder2;

    const tableDbSrc = tables.map(
      (table) => table.TABLE_NAME || table.table_name
    );
    console.log("tableDbDest: ", tableDbDest.length);
    console.log("tableDbSrc: ", tableDbSrc.length);

    for (let index = 0; index < tableDbDest.length; index++) {
      const dest = tableDbDest[index];
      const src = tableDbSrc.find((n) => n == dest);
      console.log(`${index + 1}. (dbDest): ${dest}  ,(dbSrc): ${src}`);
    }

    console.log(
      `PROCESS "Migrasi data DB1 ke DB2" Complete Successfully @ ${moment().format(
        "DD-MMM-YY HH:mm:ss"
      )} `
    );
    process.exit(1);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await Promise.all([dbSrc.destroyAll(), dbDest.destroyAll()]);
  }
}

main();
