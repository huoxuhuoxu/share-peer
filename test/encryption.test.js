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


    it ("公钥加密, 私钥解密", done => {
        const cipher = rsa.encrypt(str);
        const ret = rsa.decrypt(cipher);
        assert(str === ret, "解密结果与明文不一致");
        done();
    });

    it ("私钥加密, 公钥解密", done => {
        const cipher = rsa.privateEncrypt(str);
        const ret = rsa.publicDecrypt(cipher);
        assert(str === ret, "解密结果与明文不一致");
        done();
    });

});


describe("网络来源公私钥测试", () => {

    
    it ("私钥加密, 公钥验签", done => {

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

describe("解决密文、明文过长", () => {
    // 预留接口 / 函数, 之后区块及交易层再做处理
    // 英文: 22, 中文: 按3字节算 7个字符, 需要确认 128 字符长度公钥匙, 一定编码出 88 位密文
    const big_str = new Array(3).fill("a").join("") + 1;

    it ("分段加密", done => {
        const cipher = rsa.encrypt(big_str);
        // console.log(cipher);
        done();
    });

    it ("分段加密2", done => {
        const big_str = new Array(7).fill("我").join("");
        const cipher = rsa.encrypt(big_str);
        // console.log(cipher);
        done();
    });

});


