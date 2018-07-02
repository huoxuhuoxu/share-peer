const fs = require("fs");
const crypto = require("crypto");

// 密语恢复 实验 ...
// 尝试将 私钥 转换成 12 个单词, 丢失私钥情况下, 通过单词找回私钥 .
// 结论: 这种方式不行, 加密出来的比明文更长, 无法做转换 ...

const txt = fs.readFileSync("./.keys/private.pem").toString();
const list = txt.split("/").map(s => s.replace(/---*.*---*\n/, ""));
console.log(list, list.length);

// console.log(crypto.getCiphers());

for (let s of list){
    const cipher = crypto.createCipher("aes-256-cbc", "qwer");
    let encrypted = cipher.update(s + "", "utf-8", "hex");
    encrypted += cipher.final("hex");
    console.log("[info] 加密结果: %s", encrypted);
}



// ... 不对
// const list2 = txt.split("\n").filter(s => (!/--*.*--*/.test(s)) && s);
// console.log(list2, list2.length);

