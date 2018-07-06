/**
 * @description
 *  UDP 
 * 
 */


const fs = require("fs");
const path = require("path");
const os = require("os");

const { PORT, ADDRESS, INIT_PUB_ADDRESS } = require("../config");
const { error, log } = require("../lib/outputs");
const { end } = require("../lib/tools");
const { rsa } = require("../lib/encryption");
const App = require("./app");
const Router = require("./router");


{

    const pub_key = fs.readFileSync(path.resolve(__dirname, "../", `${ADDRESS}/keys.pub`));
    const keys = pub_key.toString().split(os.EOL);

    const router = new Router();
    const app = new App(keys.slice(1, keys.length-2).join(os.EOL) + os.EOL);

    router.set("connection/auth", (app, data) => {
        console.log(app);
        console.log(data);
    });

    try {
        rsa.decrypt(rsa.encrypt("self check", app.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    // console.log(app, app.net.info.networks);

    app.use(router.route());
    app.listening(PORT);

    if (!app.argv.c){
        const message = Buffer.from(JSON.stringify({
            name: "connection/auth",
            data: {
                test: "xxx"
            }
        }));
        const [ ip, port ] = INIT_PUB_ADDRESS.split(":");
        app.send(message, +port, ip, (err) => {
            if (err) throw err;
            log("发送成功");
        });
    }

}




