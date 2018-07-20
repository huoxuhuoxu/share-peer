/**
 * @description
 *  通用函数
 * 
 * @method
 *  exists_keys     检查公私钥文件是否存在
 *  create_keys     创建公私钥
 *  end             显示错误并退出进程
 *  test            检验数据类型
 *  save_file       存储文件 
 *  loaded_file     加载文件
 * 
 * 
 * 
 */

const child_Process = require("child_process");
const path = require("path");
const fs = require("fs");

const rimraf = require("rimraf");

const { ROOT_PATH, KEYS_ADDRESS, INIT_ADDRESS, DATA_ADDRESS } = require("../../config");
const { info, log } = require("./outputs");

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
    
    child_Process.execFileSync(path.resolve(ROOT_PATH, INIT_ADDRESS, "create_keys.sh"), [ keys_path ], option);

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

exports.test = (() => {

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

exports.save_file = (file_path, data) => {
    const real_path = path.resolve(ROOT_PATH, DATA_ADDRESS, file_path);
    const dir_path = path.dirname(real_path);
    if (!fs.existsSync(DATA_ADDRESS)){
        fs.mkdirSync(DATA_ADDRESS);
    }
    if (!fs.existsSync(dir_path)){
        fs.mkdirSync(dir_path);
    }
    fs.writeFileSync(real_path, JSON.stringify(data, null, "\t"));
};

exports.loaded_file = (file_path, type = "JSON") => {
    const real_path = path.resolve(ROOT_PATH, DATA_ADDRESS, file_path);
    if (fs.existsSync(real_path)){
        let data;
        switch (type){
            case "JSON": data = require(real_path);
            break;
            default:
                log("未处理文件类型: ", type);
        }
        return data;
    }
};

