/**
 * @description
 *  rsa测试
 * 
 */
const assert = require("assert");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { ADDRESS } = require("../config");
const { rsa } = require("../lib/encryption");

const str = "testing";


describe("本地公私钥测试", () => {


    it ("公钥加密, 私钥解密", (done) => {
        const cipher = rsa.encrypt(str);
        const ret = rsa.decrypt(cipher);
        assert(str === ret, "解密结果与明文不一致");
        done();
    });

    it ("私钥加密, 公钥解密", (done) => {
        const cipher = rsa.privateEncrypt(str);
        const ret = rsa.publicDecrypt(cipher);
        assert(str === ret, "解密结果与明文不一致");
        done();
    });

});


describe("网络来源公私钥测试", () => {

    
    it ("私钥加密, 公钥验签", (done) => {

        const rl = readline.createInterface({
            input: fs.createReadStream(path.resolve(__dirname, "../", ADDRESS, "./keys.pub")),
            crlfDelay: Infinity
        });

        let pub_keys = '';

        rl.on("line", (line) => {
            if (line && !/--+.*--+/.test(line)){
                pub_keys += line + os.EOL;
            }
        }).on("close", () => {
            const cipher = rsa.privateEncrypt(str);
            rsa.publicDecrypt(cipher, pub_keys);
            done();
        })
    });

});

