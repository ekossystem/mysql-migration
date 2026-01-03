/* eslint-disable no-console */
const envs = require("./envs/local.json");
// const readline = require('readline');
const moment = require("moment");
const db = require("./libs/db.js");

Object.keys(envs).forEach((key) => {
  process.env[key] = envs[key];
});
console.log('PROCESS "Migrasi data DB1 ke DB2" begins');
process.on("exit", function (code) {
  return console.log(`PROCESS "Migrasi data DB1 ke DB2" Exit with code ${code} @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
});

async function main() {
  const dbSrc = db.instance("asal");
  const dbDest = db.instance("tujuan");
  const namaDbSrc = db.databaseName("asal");
  const namaDbDest = db.databaseName("tujuan");
  try {
    // const hariini = moment();
    console.log(`Start PROCESS "Migrasi data DB1 ke DB2" @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
    const builder1 = dbSrc("information_schema.tables")
      .where({
        table_schema: namaDbSrc,
        table_type: "BASE TABLE",
      })
      .select("table_name");
    console.log("#builder1 native: ", builder1.toSQL().toNative());
    const listTable = await builder1;

    const tableDbSrc = listTable.map((table) => table.TABLE_NAME || table.table_name);
    console.log("tableDbSrc: ", tableDbSrc);

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
      if (tableContraint.indexOf(dest) == -1) {
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
            const obj = {};
            // for (let idxSrc = 0; idxSrc < strTbl.length; idxSrc++) {
            //   const kol = strTbl[idxSrc];
            // }
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

            await dbDest(dest).insert(obj);
          }
        }
      }
    }

    for (let index = 0; index < tableContraint.length; index++) {
      const dest = tableContraint[index];
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

          await dbDest(dest).insert(obj);
        }
      }
    }

    console.log(`PROCESS "Migrasi data DB1 ke DB2" Complete Successfully @ ${moment().format("DD-MMM-YY HH:mm:ss")} `);
    process.exit(1);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await Promise.all([dbSrc.destroyAll(), dbDest.destroyAll()]);
  }
}

main();
