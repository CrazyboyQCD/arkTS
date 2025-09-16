---
"@arkts/language-server": patch
"vscode-naily-ets": patch
---

refactor: 删除旧版格式化逻辑，使用`language-service`替代并删除用于格式化的 languageService，大幅提高性能
