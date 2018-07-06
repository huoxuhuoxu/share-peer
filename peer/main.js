/**
 * @description
 *  app - router 
 * 
 */


const fs = require("fs");
const path = require("path");
const os = require("os");

const { PORT, KEYS_ADDRESS, INIT_PUB_ADDRESS } = require("../config");
const { error } = require("../lib/outputs");
const { end } = require("../lib/tools");
const { rsa } = require("../lib/encryption");
const App = require("./app");
const Router = require("./router");


{

    const pub_key = fs.readFileSync(path.resolve(__dirname, "../", `${KEYS_ADDRESS}/keys.pub`));
    const keys = pub_key.toString().split(os.EOL);

    const app = new App(INIT_PUB_ADDRESS, keys.slice(1, keys.length-2).join(os.EOL) + os.EOL);

    try {
        rsa.decrypt(rsa.encrypt("self check", app.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    const router = new Router();

    router.set("connection/auth", (app, data) => {
        console.log(app);
        console.log(data);
    });

    // console.log(app, app.net.info.networks);

    app.use(router.route());
    app.listening(PORT);
    app.run();

}




