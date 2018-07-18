/**
 * @description
 *  加密, 解密
 *  
 * 
 */


const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");

const ursa = require("ursa");

const { KEYS_ADDRESS, ROOT_PATH } = require("../../config");
const keys_path = path.resolve(ROOT_PATH, KEYS_ADDRESS);
const private_key = fs.readFileSync(path.resolve(keys_path, "private.pem"));
const public_key = fs.readFileSync(path.resolve(keys_path, "keys.pub"));


// hash
exports.SHA256 = (str) => {
    const sha256 = crypto.createHash("sha256");
    sha256.update(str);
    return sha256.digest("hex");
};


// rsa 
const complete_pub_key = (pub_key) => {
    if (!/-BEGIN PUBLIC KEY-/.test(pub_key)){
        pub_key = "-----BEGIN PUBLIC KEY-----" + os.EOL + pub_key;
    }
    if (!/-END PUBLIC KEY-/.test(pub_key)){
        pub_key += "-----END PUBLIC KEY-----";
    }
    return pub_key;
};

const publicDecrypt = (ciphertext, pub_key = public_key, enconding = "base64", output_encoding = "utf8") => {
    pub_key = complete_pub_key(pub_key);
    const crt = ursa.coercePublicKey(pub_key);
    return crt.publicDecrypt(ciphertext, enconding, output_encoding);
};
const encrypt = (msg, pub_key = public_key, enconding = "utf8", output_encoding = "base64") => {
    pub_key = complete_pub_key(pub_key);
    const crt = ursa.coercePublicKey(pub_key);
    return crt.encrypt(msg, enconding, output_encoding);
};
const decrypt = (ciphertext, pri_key = private_key, enconding = "base64", output_encoding = "utf8") => {
    const key = ursa.createPrivateKey(pri_key);
    return key.decrypt(ciphertext, enconding, output_encoding);
};
const privateEncrypt = (msg, pri_key = private_key, enconding = "utf8", output_encoding = "base64") => {
    const key = ursa.createPrivateKey(pri_key);
    return key.privateEncrypt(msg, enconding, output_encoding);
};


exports.rsa = {
    publicDecrypt,
    encrypt,
    decrypt,
    privateEncrypt
};


