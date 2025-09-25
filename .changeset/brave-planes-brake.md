---
"@arkts/typescript-plugin": patch
"@arkts/language-service": patch
"@arkts/language-plugin": patch
"@arkts/language-server": patch
"@arkts/shared": patch
"vscode-naily-ets": patch
---

perf: 移除`chokidar`监听器，改用 vscode 自带的 FileWatcher (e8ad061898edba6df7fb61be1557586ded9073f4)
