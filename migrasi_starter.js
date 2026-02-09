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

console.log(`node index.js >> ../migration.log 2>&1`);
console.log("pertama-tama kosongkan dulu table `mysql_migration_done` pada dbDest");
console.log('PROCESS "Migrasi data DB1 ke DB2" begins');
process.on("exit", function (code) {
  return console.log(`PROCESS "Migrasi data DB1 ke DB2" Exit with code ${code} @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
});

async function main() {
  // const overWriteCompcode = await askQuestion("Masukkan COMPCODE yang ingin di-OVERWRITE: ");
  // console.log("overWriteCompcode:", overWriteCompcode);
  const migrasiCompany = ["01", "cais", "ck-bakery", "PTAW", "PTAW_2024"];
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
      .select("table_name")
      .orderBy("table_name");
    const tableDbSrc = listAsal.map((table) => table.TABLE_NAME || table.table_name);
    // console.log("tableDbSrc: ", tableDbSrc.length);

    const tableDone = await dbDest("mysql_migration_done").select("tablename");
    for (let idxDone = 0; idxDone < tableDone.length; idxDone++) {
      const dn = tableDone[idxDone];
      if (arrTableDone.indexOf(dn.tablename) == -1) arrTableDone.push(dn.tablename);
    }

    const tblUtama = ["users", "sys_user", "company"];
    // const [tblUser, tblSysuser, tblCompany]
    const tblUtamaData = await Promise.all([
      dbSrc("users as t1").select("t1.*").innerJoin("sys_user as t2", "t1.id", "t2.user_id").whereIn("t2.compcode", migrasiCompany),

      dbSrc("sys_user").whereIn("compcode", migrasiCompany),

      dbSrc("company").whereIn("compcode", migrasiCompany),
    ]);

    for (let index = 0; index < tblUtama.length; index++) {
      const dest = tblUtama[index];
      nomorRecord = 0;
      if (arrTableDone.indexOf(dest) == -1) {
        console.log(`${index + 1}. (dbDest:${namaDbDest}): ${dest}  ,(dbSrc:${namaDbSrc}): ${dest}`);
        const isiTbl = tblUtamaData[index];
        const strTbl = await dbDest("information_schema.columns")
          .where({
            table_schema: namaDbDest,
            table_name: dest,
          })
          .select(["column_name", "data_type", "is_nullable"]);

        for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
          const rec = isiTbl[idxrec];
          const obj = {};
          strTbl.forEach((kol) => {
            const column_name = kol.column_name || kol.COLUMN_NAME;
            const is_nullable = kol.is_nullable || kol.IS_NULLABLE;
            const data_type = kol.data_type || kol.DATA_TYPE;
            if (rec[column_name] || is_nullable == "NO" || rec[column_name] === 0) {
              switch (data_type) {
                case "varchar":
                  obj[column_name] = rec[column_name] || "";
                  break;

                case "date":
                  obj[column_name] = rec[column_name] || null;
                  break;

                case "datetime":
                  obj[column_name] = rec[column_name] || new Date();
                  break;
                case "time":
                  obj[column_name] = rec[column_name] || null;
                  break;

                case "timestamp":
                  obj[column_name] = rec[column_name] || new Date();
                  break;

                default:
                  obj[column_name] = rec[column_name] || 0;
                  break;
              }
            }
          });

          try {
            await dbDest(dest).insert(obj);
          } catch (err) {
            if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
              console.log("Data duplikat ditemukan ");
            } else if (err.code === "ER_DATA_TOO_LONG" || err.errno === 1406) {
              console.warn(`${dest} row number = ${nomorRecord}, ${err.sqlMessage}`);
              if (err.sqlMessage.includes("logo")) {
                // Buat salinan row tanpa kolom logo
                const { logo, ...safeRow } = obj;
                try {
                  await dbDest(dest).insert(safeRow);
                } catch (salah) {
                  if (salah.code === "ER_DUP_ENTRY" || salah.errno === 1062) {
                    console.log("Data duplikat ditemukan ");
                  } else {
                    throw err;
                  }
                }
              }
            } else {
              throw err;
            }
          }
        }
        await dbDest("mysql_migration_done").insert({ tablename: dest });
        arrTableDone.push(dest);
      }
    }
    console.log("arrTableDone:", arrTableDone);

    const tables = await dbDest("information_schema.tables")
      .where({
        table_schema: namaDbDest,
        table_type: "BASE TABLE",
      })
      .select("table_name");

    const tableDbDest = tables.map((table) => table.TABLE_NAME || table.table_name);
    console.log("tableDbDest: ", tableDbDest.length);
    await dbDest.raw("SET FOREIGN_KEY_CHECKS = 0");

    for (let index = 0; index < tableDbDest.length; index++) {
      const dest = tableDbDest[index];
      nomorRecord = 0;
      if (arrTableDone.indexOf(dest) == -1) {
        const src = tableDbSrc.find((n) => n == dest);
        if (src) {
          console.log(`${index + 1}. (dbDest:${namaDbDest}): ${dest}  ,(dbSrc:${namaDbSrc}): ${src}`);
          const [strTbl, isiTbl] = await Promise.all([
            dbDest("information_schema.columns")
              .where({
                table_schema: namaDbDest,
                table_name: dest,
              })
              .select(["column_name", "data_type", "is_nullable"]),
            dbSrc(src).select([" * "]),
          ]);

          const kolCompcode = strTbl.find((row) => row.column_name == "compcode" || row.COLUMN_NAME == "compcode");
          //   if (kolCompcode && overWriteCompcode) {
          //     await dbDest(dest).where({ compcode: overWriteCompcode }).del();
          //   }

          for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
            const rec = isiTbl[idxrec];
            nomorRecord = idxrec + 1;
            if (!kolCompcode || (kolCompcode && migrasiCompany.indexOf(rec.compcode) !== -1)) {
              const obj = {};
              strTbl.forEach((kol) => {
                const column_name = kol.column_name || kol.COLUMN_NAME;
                const is_nullable = kol.is_nullable || kol.IS_NULLABLE;
                const data_type = kol.data_type || kol.DATA_TYPE;
                if (rec[column_name] || is_nullable == "NO" || rec[column_name] === 0) {
                  if (column_name == "inven_catid") {
                    if (dest == "inventory_category") obj.inven_catid = `${rec.kodeacc}${rec.compcode}${rec.isdeleted}`;
                    if (dest == "inventory_receipt") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                    if (dest == "inventory_issued_group_detail") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                  } else if (dest == "task_attachment" && column_name == "attchFile") {
                    obj.attchFile = obj.attachmentKey;
                  } else {
                    switch (data_type) {
                      case "varchar":
                        obj[column_name] = rec[column_name] || "";
                        break;

                      case "date":
                        obj[column_name] = rec[column_name] || null;
                        break;

                      case "datetime":
                        obj[column_name] = rec[column_name] || new Date();
                        break;
                      case "time":
                        obj[column_name] = rec[column_name] || null;
                        break;

                      case "timestamp":
                        obj[column_name] = rec[column_name] || new Date();
                        break;

                      default:
                        obj[column_name] = rec[column_name] || 0;
                        break;
                    }
                  }
                } else {
                  if (column_name == "inven_catid") {
                    if (dest == "inventory_category") obj.inven_catid = `${rec.kodeacc}${rec.compcode}${rec.isdeleted}`;
                    if (dest == "inventory_receipt") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                    if (dest == "inventory_issued_group_detail") obj.inven_catid = `${rec.invKodeacc}${rec.compcode}${rec.isdeleted}`;
                  } else if (column_name == "judul") {
                    obj.judul = "";
                  }
                }
              });

              try {
                await dbDest(dest).insert(obj);
              } catch (err) {
                if (err.code === "ER_DATA_TOO_LONG" || err.errno === 1406) {
                  console.warn(`${dest} row number = ${nomorRecord}, ${err.sqlMessage}`);
                  if (err.sqlMessage.includes("logo")) {
                    // Buat salinan row tanpa kolom logo
                    const { logo, ...safeRow } = obj;
                    await dbDest(dest).insert(safeRow);
                  }
                } else if (!(err.code === "ER_DUP_ENTRY" || err.errno === 1062)) {
                  //   console.log("Data duplikat ditemukan ");
                  // } else {
                  throw err;
                }
              }
            }
          }
        }
        await dbDest("mysql_migration_done").insert({ tablename: dest });
        arrTableDone.push(dest);
      }
    }

    console.log(`PROCESS "Migrasi data DB1 ke DB2" Complete Successfully @ ${moment().format("DD-MMM-YY HH:mm:ss")} `);
    process.exit(1);
  } catch (error) {
    console.log("====> NOMOR RECORD = ", nomorRecord);
    console.log(error);
    process.exit(1);
  } finally {
    await dbDest.raw("SET FOREIGN_KEY_CHECKS = 1");
    await Promise.all([dbSrc.destroyAll(), dbDest.destroyAll()]);
  }
}

main();
