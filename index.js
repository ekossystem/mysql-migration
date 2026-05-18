/* eslint-disable no-console */
const envs = require("./envs/local.json");
const readline = require("readline");
const moment = require("moment");
const db = require("./libs/db.js");

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

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
  const migrasiCompany = ["01"];
  const migrasiCompanyMap = new Map([['01', 'INTERRA']]);
  const migrasiCompanyDest = Array.from(migrasiCompanyMap.values());
  const overWriteMode = await askQuestion("Apakah mau mengaktifkan OVERWRITE MODE? (y/n): ");
  console.log(`overWriteMode: ${overWriteMode == 'y' ? 'YES' : 'NO'}`);
  const dbSrc = db.instance("src");
  const namaDbSrc = db.databaseName("src");
  const dbDest = db.instance("dest");
  const namaDbDest = db.databaseName("dest");
  let arrTableDone = [
    "asset_status",
    "crew_statusmasuk",
    "crew_statusberhenti",
    "circulation_document_type",
    "customer_payment_form",
    "dfjurnal",
    "dimensiontrxdefault",
    "dimensiontrxspliter",
    "jurnal_kodekelompok",
    "log_pubsub",
    "log_socket",
    "log_socket_message",
    "menu",
    "menu_mobileapp",
    "menu_mobileapp_role",
    "modules",
    "mst_pubsub_config",
    "mysql_migration_done",
    "notification",
    "online_messages",
    "online_messages_receiver",
    "online_users",
    "paymentterm",
    "po_posting_type",
    "report",
    "report_kodekolom",
    "report_log",
    "sessions",
    "slot_reserve_kind",
    "sys_api",
    "sys_menu",
    "sys_message",
    "sys_role",
    "sys_role_menu",
    "sys_settings",
    "sys_shortcut",
    "sys_testing",
    "sys_user_info",
    "sys_user_reset_log",
    "sys_user_role",
    "sys_usergroup",
    "sys_validator",
    "taskassignment",
    "tasknotification",
    "tax_business_group",
    "tax_npwp",
    "tax_wh_jenis_penghasilan",
    "token",
    "vendor_business_category",
    "sales_line_type",
    "timesheet_variable",
    "po_line_type"
  ];
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

        const kolCompcode = strTbl.find((row) => row.column_name == "compcode" || row.COLUMN_NAME == "compcode");
        if (kolCompcode && overWriteMode == 'y') {
          await dbDest(dest).whereIn("compcode", migrasiCompanyDest).del();
        }

        for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
          const rec = isiTbl[idxrec];

          // Normalisasi key record source menjadi lowercase untuk pencocokan case-insensitive
          const recLower = {};
          Object.keys(rec).forEach((key) => {
            if (key.toLowerCase() == "compcode" && migrasiCompanyMap.has(rec[key])) {
              recLower[key.toLowerCase()] = migrasiCompanyMap.get(rec[key]);
            } else {
              recLower[key.toLowerCase()] = rec[key];
            }
          });

          // Helper untuk mengambil value dengan key case-insensitive
          const getVal = (key) => recLower[key.toLowerCase()];

          nomorRecord = idxrec + 1;
          const obj = {};
          strTbl.forEach((kol) => {
            const column_name = kol.column_name || kol.COLUMN_NAME;
            const is_nullable = kol.is_nullable || kol.IS_NULLABLE;
            const data_type = kol.data_type || kol.DATA_TYPE;

            const val = getVal(column_name);

            if (val !== undefined || is_nullable == "NO" || val === 0) {
              switch (data_type) {
                case "varchar":
                case "text":
                case "longtext":
                  obj[column_name] = val || "";
                  break;

                case "date":
                  obj[column_name] = val || null;
                  break;

                case "datetime":
                  obj[column_name] = val || new Date();
                  break;
                case "time":
                  obj[column_name] = val || null;
                  break;

                case "timestamp":
                  obj[column_name] = val || new Date();
                  break;

                default:
                  obj[column_name] = val || 0;
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
      // if (tableContraint.indexOf(dest) == -1 && arrTableDone.indexOf(dest) == -1) {
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
          if (kolCompcode && overWriteMode == 'y') {
            await dbDest(dest).whereIn("compcode", migrasiCompanyDest).del();
          }

          for (let idxrec = 0; idxrec < isiTbl.length; idxrec++) {
            const rec = isiTbl[idxrec];
            // Normalisasi key record source menjadi lowercase untuk pencocokan case-insensitive
            const recLower = {};
            Object.keys(rec).forEach((key) => {
              if (key.toLowerCase() == "compcode" && migrasiCompanyMap.has(rec[key])) {
                recLower[key.toLowerCase()] = migrasiCompanyMap.get(rec[key]);
              } else {
                recLower[key.toLowerCase()] = rec[key];
              }
            });

            // Helper untuk mengambil value dengan key case-insensitive
            const getVal = (key) => recLower[key.toLowerCase()];

            const srcCompcodeKey = Object.keys(rec).find((key) => key.toLowerCase() === "compcode");
            const srcCompcode = srcCompcodeKey ? rec[srcCompcodeKey] : undefined;

            nomorRecord = idxrec + 1;
            if (!kolCompcode || (kolCompcode && migrasiCompany.indexOf(srcCompcode) !== -1)) {

              const obj = {};
              strTbl.forEach((kol) => {
                const column_name = kol.column_name || kol.COLUMN_NAME;
                const is_nullable = kol.is_nullable || kol.IS_NULLABLE;
                const data_type = kol.data_type || kol.DATA_TYPE;

                const val = getVal(column_name);

                if (val !== undefined || is_nullable == "NO" || val === 0) {
                  if (column_name == "inven_catid") {
                    const kodeacc = getVal("kodeacc") || getVal("invKodeacc") || "";
                    const compcode = getVal("compcode") || "";
                    const isdeleted = getVal("isdeleted") || 0;
                    obj.inven_catid = `${kodeacc}${compcode}${isdeleted}`;
                  } else if (dest == "task_attachment" && column_name == "attchFile") {
                    obj.attchFile = getVal("attachmentKey") || "";
                    // table berikut ini PRIMARY KEY nya perlu ditambahkan `compcode`:
                    // aradjutypegroup
                    // arinvtt_oustanding_status
                    // arpotongan
                    // bank
                    // claim
                    // crewgolongan
                    // crewpangkat 
                    // crewleavekind
                    // komponengaji
                    // lookup_sales
                  } else {
                    switch (data_type) {
                      case "varchar":
                      case "text":
                      case "longtext":
                        obj[column_name] = val || "";
                        break;

                      case "date":
                        obj[column_name] = val || null;
                        break;

                      case "datetime":
                        obj[column_name] = val || new Date();
                        break;
                      case "time":
                        obj[column_name] = val || null;
                        break;

                      case "timestamp":
                        obj[column_name] = val || new Date();
                        break;

                      default:
                        obj[column_name] = val || 0;
                        break;
                    }
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
          }
          await dbDest("mysql_migration_done").insert({ tablename: dest });
          arrTableDone.push(dest);
        }
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
