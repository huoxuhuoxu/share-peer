/**
 * @description
 *  公私钥
 *  
 * 
 */

const child_Process = require("child_process");
const path = require("path");
const fs = require("fs");

const rimraf = require("rimraf");

const { ADDRESS } = require("../config");

exports.create_keys = () => {

    const keys_path = path.resolve(__dirname, "../", ADDRESS);
    if (fs.existsSync(keys_path)){
        rimraf.sync(keys_path);
    }
    fs.mkdirSync(keys_path);    

    const option = {
        stdio: "ignore"
    };
    
    child_Process.execFileSync(path.resolve(__dirname, "../.init/create_keys.sh"), [ keys_path ], option);

};
