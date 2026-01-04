/* eslint-disable no-console */
const envs = require("./envs/local.json");
// const readline = require("readline");
const moment = require("moment");
const db = require("./libs/db.js");

// function askQuestion(query) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   return new Promise((resolve) =>
//     rl.question(query, (ans) => {
//       rl.close();
//       resolve(ans);
//     })
//   );
// }

Object.keys(envs).forEach((key) => {
  process.env[key] = envs[key];
});
// pertama-tama kosongkan dulu table `mysql_migration_done` pada dbDest
console.log("pertama-tama kosongkan dulu table `mysql_migration_done` pada dbDest");
console.log('PROCESS "Migrasi data DB1 ke DB2" begins');
process.on("exit", function (code) {
  return console.log(`PROCESS "Migrasi data DB1 ke DB2" Exit with code ${code} @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
});

async function main() {
  // const overWriteCompcode = await askQuestion("Masukkan COMPCODE yang ingin di-OVERWRITE: ");
  // console.log("overWriteCompcode:", overWriteCompcode);
  const dbSrc = db.instance("src");
  const namaDbSrc = db.databaseName("src");
  const dbDest = db.instance("dest");
  const namaDbDest = db.databaseName("dest");
  let arrTableDone = [];
  let nomorRecord = 0;
  try {
    // const hariini = moment();
    console.log(`Start PROCESS "Migrasi data DB1 ke DB2" @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
    const listAsal = await dbSrc("information_schema.tables")
      .where({
        table_schema: namaDbSrc,
        table_type: "BASE TABLE",
      })
      .select("table_name");
    const tableDbSrc = listAsal.map((table) => table.TABLE_NAME || table.table_name);
    console.log("tableDbSrc: ", tableDbSrc.length);

    const tableDone = await dbDest("mysql_migration_done").select("tablename");
    for (let idxDone = 0; idxDone < tableDone.length; idxDone++) {
      const dn = tableDone[idxDone];
      if (arrTableDone.indexOf(dn.tablename) == -1) arrTableDone.push(dn.tablename);
    }
    console.log("arrTableDone:", arrTableDone);

    const [tableWithFK] = await dbDest.raw(`SELECT kcu.table_name AS child_table, kcu.referenced_table_name AS master_table
     FROM information_schema.key_column_usage kcu WHERE kcu.constraint_schema = '${namaDbDest}' AND kcu.referenced_table_name IS NOT NULL`);
    const tableContraint = [];
    for (let idxFK = 0; idxFK < tableWithFK.length; idxFK++) {
      const fk = tableWithFK[idxFK];
      if (tableContraint.indexOf(fk.master_table) == -1) tableContraint.push(fk.master_table);
      if (tableContraint.indexOf(fk.child_table) == -1) tableContraint.push(fk.child_table);
    }
    console.log("tableContraint:", tableContraint);

    const tables = await dbDest("information_schema.tables")
      .where({
        table_schema: namaDbDest,
        table_type: "BASE TABLE",
      })
      .select("table_name");

    const tableDbDest = tables.map((table) => table.TABLE_NAME || table.table_name);
    console.log("tableDbDest: ", tableDbDest.length);

    for (let index = 0; index < tableDbDest.length; index++) {
      const dest = tableDbDest[index];
      nomorRecord = 0;
      if (tableContraint.indexOf(dest) == -1 && arrTableDone.indexOf(dest) == -1) {
        const src = tableDbSrc.find((n) => n == dest);
        if (src) {
          console.log(`${index + 1}. (dbDest): ${dest}  ,(dbSrc): ${src}`);
          const [strTbl, isiTbl] = await Promise.all([
            dbDest("information_schema.columns")
              .where({
                table_schema: namaDbDest,
                table_name: dest,
              })
              .select(["column_name", "data_type", "is_nullable"]),
            dbSrc(src).select([" * "]),
          ]);

          // const kolCompcode = strTbl.find((row) => row.column_name == "compcode");
          // if (kolCompcode && overWriteCompcode) {
          //   await dbDest(dest).where({ compcode: overWriteCompcode }).del();
          // }

          for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
            const rec = isiTbl[idxrec];
            nomorRecord = idxrec + 1;
            const obj = {};
            strTbl.forEach((kol) => {
              if (rec[kol.column_name] || kol.is_nullable == "NO" || rec[kol.column_name] === 0) {
                if (kol.column_name == "inven_catid") {
                  if (dest == "inventory_category") obj.inven_catid = `${rec.kodeacc}${rec.compcode}${rec.isdeleted}`;
                  if (dest == "inventory_receipt") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                  if (dest == "inventory_issued_group_detail") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                } else if (dest == "task_attachment" && kol.column_name == "attchFile") {
                  obj.attchFile = obj.attachmentKey;
                } else {
                  switch (kol.data_type) {
                    case "varchar":
                      obj[kol.column_name] = rec[kol.column_name] || "";
                      break;

                    case "date":
                      obj[kol.column_name] = rec[kol.column_name] || null;
                      break;

                    case "datetime":
                      obj[kol.column_name] = rec[kol.column_name] || new Date();
                      break;
                    case "time":
                      obj[kol.column_name] = rec[kol.column_name] || null;
                      break;

                    case "timestamp":
                      obj[kol.column_name] = rec[kol.column_name] || new Date();
                      break;

                    default:
                      obj[kol.column_name] = rec[kol.column_name] || 0;
                      break;
                  }
                }
              } else {
                if (kol.column_name == "inven_catid") {
                  if (dest == "inventory_category") obj.inven_catid = `${rec.kodeacc}${rec.compcode}${rec.isdeleted}`;
                  if (dest == "inventory_receipt") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                  if (dest == "inventory_issued_group_detail") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                }
              }
            });

            try {
              await dbDest(dest).insert(obj);
            } catch (err) {
              if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
                console.log("Data duplikat ditemukan");
              } else {
                throw err;
              }
            }
          }
        }
        await dbDest("mysql_migration_done").insert({ tablename: dest });
      }
    }

    for (let index = 0; index < tableContraint.length; index++) {
      const dest = tableContraint[index];
      nomorRecord = 0;
      if (arrTableDone.indexOf(dest) == -1) {
        const src = tableDbSrc.find((n) => n == dest);
        if (src) {
          console.log(`${index + 1}. (dbDest): ${dest}  ,(dbSrc): ${src}`);
          const [strTbl, isiTbl] = await Promise.all([
            dbDest("information_schema.columns")
              .where({
                table_schema: namaDbDest,
                table_name: dest,
              })
              .select(["column_name", "data_type", "is_nullable"]),
            dbSrc(src).select([" * "]),
          ]);

          for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
            const rec = isiTbl[idxrec];
            nomorRecord = idxrec + 1;
            const obj = {};
            strTbl.forEach((kol) => {
              if (rec[kol.column_name] || kol.is_nullable == "NO" || rec[kol.column_name] === 0) {
                switch (kol.data_type) {
                  case "varchar":
                    obj[kol.column_name] = rec[kol.column_name] || "";
                    break;

                  case "date":
                    obj[kol.column_name] = rec[kol.column_name] || null;
                    break;

                  case "datetime":
                    obj[kol.column_name] = rec[kol.column_name] || new Date();
                    break;
                  case "time":
                    obj[kol.column_name] = rec[kol.column_name] || null;
                    break;

                  case "timestamp":
                    obj[kol.column_name] = rec[kol.column_name] || null;
                    break;

                  default:
                    obj[kol.column_name] = rec[kol.column_name] || 0;
                    break;
                }
              }
            });

            try {
              await dbDest(dest).insert(obj);
            } catch (error) {
              if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
                console.log("Data duplikat ditemukan");
              } else if (error.code === "ER_DATA_TOO_LONG" && error.sqlMessage.includes("logo")) {
                console.warn(`Skip field logo untuk row id=${row.id}`);
                // Buat salinan row tanpa kolom logo
                const { logo, ...safeRow } = obj;
                await dbDest(dest).insert(safeRow);
              } else {
                throw error;
              }
            }
          }
        }
        await dbDest("mysql_migration_done").insert({ tablename: dest });
      }
    }

    console.log(`PROCESS "Migrasi data DB1 ke DB2" Complete Successfully @ ${moment().format("DD-MMM-YY HH:mm:ss")} `);
    process.exit(1);
  } catch (error) {
    console.log("====> NOMOR RECORD = ", nomorRecord);
    console.log(error);
    process.exit(1);
  } finally {
    await Promise.all([dbSrc.destroyAll(), dbDest.destroyAll()]);
  }
}

main();
