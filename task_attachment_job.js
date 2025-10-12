/* eslint-disable no-console */
const envs = require("./envs/local.json");
// const readline = require('readline');
// const jwt = require('./libs/jwt');
// const uuid = require("node-uuid");
// const fs = require('fs');
// const path = require('node:path');
const moment = require("moment");
const { db, s3storage } = require("./libs");

Object.keys(envs).forEach((key) => {
  process.env[key] = envs[key];
});
console.log('PROCESS "ERP FILE ATTACHMENT" begins');
process.on("exit", function (code) {
  return console.log(
    `PROCESS "ERP FILE ATTACHMENT" Exit with code ${code} @ ${moment().format(
      "DD-MMM-YY HH:mm:ss"
    )}`
  );
});

async function main() {
  try {
    const ctx = db.instance("src");
    // const hariini = moment();
    console.log(
      `Start PROCESS "ERP FILE ATTACHMENT" @ ${moment().format(
        "DD-MMM-YY HH:mm:ss"
      )}`
    );
    const [strTbl, attchList] = await Promise.all([
      dbDest("information_schema.columns")
        .where({
          table_schema: "task_attachment",
          table_name: dest,
        })
        .select(["column_name", "data_type", "is_nullable"]),
      ctx("task_attachment")
        .where({ isdeleted: 0 })
        .whereRaw(`ifnull(attchFileNm,'')<>''`),
    ]);

    const kol = strTbl.find((k) => k.column_name == "attchFile");
    if (kol) {
      if (kol.data_type.includes("blob")) {
        console.log(`task_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
          const rw = attchList[index];
          await s3storage.uploadToS3(
            process.env.AWS_BUCKET,
            `${process.env.ATTACHMENT_PATH}erp${rw.attachmentKey}`,
            rw.attchFile,
            ""
          );
        }
      }
      console.log(
        `PROCESS "ERP FILE ATTACHMENT" Complete Successfully @ ${moment().format(
          "DD-MMM-YY HH:mm:ss"
        )} `
      );
    }

    process.exit(1);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

main();
