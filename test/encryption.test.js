/**
 * @description
 *  rsa测试
 * 
 */
const assert = require("assert");

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

    const pub_keys = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDsSYRt15IzjmTq85sfFv3mxonN" + "\n" +
    "hhG/celBAfvy/iUfXYdBqy5HcT0gOEas+ZxJkjRscVQB34XWl4dTq/87LHe59fH7" + "\n" +
    "s5NebL4IgVBeebJWvpA8WT7w085r90oHK5zten4X3umDSZDm8slHK435ewHYe2sx" + "\n" +
    "AmxG+TEHz3/TXERf+QIDAQAB" + "\n";
   

    it ("私钥加密, 公钥验签", (done) => {
        const cipher = rsa.privateEncrypt(str);
        rsa.publicDecrypt(cipher, pub_keys);
        done();
    });

});

