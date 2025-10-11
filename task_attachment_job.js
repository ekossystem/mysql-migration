/* eslint-disable no-console */
const envs = require('./envs/local.json');
// const readline = require('readline');
// const jwt = require('./libs/jwt');
const uuid = require('node-uuid');
// const fs = require('fs');
// const path = require('node:path'); 
const s3storage = require('../services/s3storageService');
const moment = require('moment');
const { db } = require('./core/index');

Object.keys(envs).forEach(key => {
    process.env[key] = envs[key];
});
console.log('PROCESS "ERP AMG Attachment Files" begins');
process.on('exit', function (code) {
    return console.log(`PROCESS "ERP AMG Attachment Files" Exit with code ${code}`);
});


async function main () {
    try {
        const ctx = db.instance('PROJ');
        // const hariini = moment();
        console.log(`Start PROCESS "ERP AMG Attachment Files" @ ${moment().format("DD-MMM-YY HH:mm:ss")}`);
        let attchList = await ctx('amg_channel_agreement_status_record').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_agreement_status_record attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw._id, tableName: 'amg_channel_agreement_status_record'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw._id,
                    tableName: 'amg_channel_agreement_status_record',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_agreement').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_agreement attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw._id, tableName: 'amg_channel_agreement'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw._id,
                    tableName: 'amg_channel_agreement',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }


        attchList = await ctx('amg_channel_venue_visit_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_venue_visit_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_venue_visit_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_venue_visit_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_kendala_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_kendala_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_kendala_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_kendala_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_technical_meeting_history_progress').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_technical_meeting_history_progress attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw._id, tableName: 'amg_technical_meeting_history_progress'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw._id,
                    tableName: 'amg_technical_meeting_history_progress',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_technical_meeting').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_technical_meeting attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw._id, tableName: 'amg_technical_meeting'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw._id,
                    tableName: 'amg_technical_meeting',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_p2l_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_p2l_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_p2l_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_p2l_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_ppkm_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_ppkm_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_ppkm_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_ppkm_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_pl2_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_pl2_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_pl2_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_pl2_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_kendala_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_kendala_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.attachmentKey, tableName: 'amg_channel_kendala_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.attachmentKey,
                    tableName: 'amg_channel_kendala_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }


        attchList = await ctx('amg_work_order').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_work_order attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.woHdrKey, tableName: 'amg_work_order'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.woHdrKey,
                    tableName: 'amg_work_order',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }
        attchList = await ctx('amg_work_order_line_doc_attachment').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_work_order_line_doc_attachment attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw.docKey, tableName: 'amg_work_order_line_doc_attachment'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw.docKey,
                    tableName: 'amg_work_order_line_doc_attachment',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }

        attchList = await ctx('amg_channel_venue_media_history_task').where({isdeleted:0}).whereRaw(`ifnull(attchFileNm,'')<>''`);
        console.log(`amg_channel_venue_media_history_task attchList: ${attchList.length} records`);
        for (let index = 0; index < attchList.length; index++) {
            const rw = attchList[index];
            const ada = await ctx('amg_attachment').where({tablekey: rw._id, tableName: 'amg_channel_venue_media_history_task'}).first();
            if (!(ada)) {
                const obj = {
                    attachmentKey: uuid.v1().toUpperCase(),
                    tablekey: rw._id,
                    tableName: 'amg_channel_venue_media_history_task',
                    attchFileNm: rw.attchFileNm,
                    compcode: rw.compcode,
                    createby: rw.createby || '',
                    isdeleted: 0,
                    isSaved: 1,
                    modified: rw.modified
                };
                obj.attchFile= obj.attachmentKey;
                await Promise.all([
                    ctx('task_attachment').insert(obj),
                    s3storage.uploadToS3(process.env.AWS_BUCKET, `${process.env.ATTACHMENT_PATH}erp${obj.attchFile}`, rw.attchFile, '')
                ])
            }
        }



        console.log(`PROCESS "ERP AMG Attachment Files" Complete Successfully @ ${moment().format("DD-MMM-YY HH:mm:ss")} `);
        process.exit(1);

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

main();
