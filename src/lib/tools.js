/**
 * @description
 *  通用函数
 * 
 */

const child_Process = require("child_process");
const path = require("path");
const fs = require("fs");

const rimraf = require("rimraf");

const { ROOT_PATH, KEYS_ADDRESS } = require("../../config");
const { info } = require("./outputs");

exports.exists_keys = () => {
    const keys_path = path.resolve(ROOT_PATH, KEYS_ADDRESS);
    if (fs.existsSync(keys_path) && 
        fs.existsSync(path.resolve(keys_path, "./private.pem")) && 
        fs.existsSync(path.resolve(keys_path, "./keys.pub"))
    ) 
        return keys_path;
    else 
        return false;
};

exports.create_keys = () => {
    
    const keys_path = path.resolve(ROOT_PATH, KEYS_ADDRESS);

    if (fs.existsSync(keys_path)){
        rimraf.sync(keys_path);
    }
    fs.mkdirSync(keys_path);    

    const option = {
        stdio: "ignore"
    };
    
    child_Process.execFileSync(path.resolve(ROOT_PATH, ".init/create_keys.sh"), [ keys_path ], option);

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

module.exports.test = (() => {

    const type_arr = [
        "Function",
        "Object",
        "Array",
        "Symbol",
        "Set",
        "Map",
        "WeakSet",
        "WeakMap",
        "String",
        "Number",
        "Boolean"
    ];

    const tmp = {};

    for ( const type_name of type_arr){
        tmp[`is${type_name}`] = (v) => {
            return Object.prototype.toString.call(v) === `[object ${type_name}]`;
        };
    }

    // isNumber 方法 - 追加条件
    const tmp_number = tmp["isNumber"];
    tmp["isNumber"] = (v) => tmp_number(v) && !Number.isNaN(v);

    return tmp;

})();

