---
"@arkts/language-server": patch
"vscode-naily-ets": patch
---

fix(language-server): 添加`ets/onDidChangeTextDocument`事件，修复`onDidChangeTextDocument`钩子不能在 lsp 启动时监听导致 volar 提示服务冲突的问题

volar 内部貌似用了 onDidChangeTextDocument 钩子，该钩子似乎只运行在 Initialize 时监听一次，不允许多次监听，所以应该实现一个自定义的事件来解决监听 TextDocuments 的问题。目前已经添加了一个`ets/onDidChangeTextDocument`事件用于监听，vscode 侧已经添加了相应的监听逻辑。
