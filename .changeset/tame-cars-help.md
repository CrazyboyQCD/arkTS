---
"@arkts/language-plugin": patch
"@arkts/language-server": patch
"@arkts/shared": patch
"vscode-naily-ets": patch
---

fix: 替换不安全的`new Function()`, 改为 createRequire 加载 SDK 中的`sysResource.js`
