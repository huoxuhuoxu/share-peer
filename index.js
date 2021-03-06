/**
 * @description
 *  point
 * 
 */

const readline = require("readline");

const { KEYS_ADDRESS } = require("./config");
 
const {
    outputs: { error },
    tools: { end, create_keys, exists_keys }
} = require("./src/lib");

{

    const keys_path = exists_keys();
    if (keys_path){
        
        require("./src/main");
    
    } else {
    
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        const question_list = [
            "没有检测到可用的公私钥, 是否进行如下操作?\r\n",
            "1. 生成公私钥",
            "2. 导入公私钥",
            "3. 修改公私钥目录的路径",
            "请选择: "
        ];
        
        rl.question(question_list.join("\r\n"), answer => {

            let reply_list = [];

            try {

                switch (answer){
                    case "1":

                        try {
                            create_keys();
                            reply_list = [
                                `生成成功, 文件在 ${keys_path} 中, 请做好备份\r\n`,
                                `请再次运行, 启动节点`
                            ];
                        } catch(err){
                            reply_list = [
                                `${err.toString()}\r\n`,
                                `发生错误, 无法生成, 请检查\r\n`,
                                `\t1.是否支持openssl`,
                                `\t2.是否执行npm install, 安装运行所需模块`
                            ];
                            throw { message: reply_list };
                        }
                        
                    break;
                    case "2": 
                        reply_list = [
                            `1.请手动在目录下建立 ${KEYS_ADDRESS} 目录`,
                            `2.将公私钥复制进 ${KEYS_ADDRESS} 目录`
                        ];
                    break;
                    case "3": 
                        reply_list = [ "请手动修改目录下 config.js 的 KEYS_ADDRESS 字段, 此字段表示公私钥所在目录路径" ];
                    break;
                    default: 
                        throw Error("输入序号错误");
                }

            } catch (err){

                end(err.message, error);
            
            }
            
            end(reply_list);

        });
    }

}
