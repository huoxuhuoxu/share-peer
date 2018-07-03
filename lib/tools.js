/**
 * @description
 *  通用函数
 * 
 */

const child_Process = require("child_process");
const path = require("path");
const fs = require("fs");

const rimraf = require("rimraf");

const { info } = require("./outputs");
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

exports.end = (a_msg, fn_output = info, b_exit = true) => {
    if (Object.prototype.toString.call(a_msg) !== "[object Array]"){
        a_msg = [ a_msg ];
    }
    a_msg.unshift("");
    a_msg.forEach( s => {
        if (typeof s !== "string") s = s.toString();
        fn_output(s);
    });
    b_exit && process.exit(0);
};

