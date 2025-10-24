# @arkts/language-service

## 1.1.1

### Patch Changes

- a69a6d3: perf: 移除`chokidar`监听器，改用 vscode 自带的 FileWatcher (e8ad061898edba6df7fb61be1557586ded9073f4)
- 702f67a: fix: 修复项目分析器缓存系统使其正常工作; 添加文件系统抽象层，使 language-service 可以在浏览器正常工作 (03340761354d2aff82d9ac461409a05084d46a4b)
- c401902: feat: 添加`@arkts/language-service`包，将公共服务抽离进该包 (aba71f4a7be11623dbeb07732d80ae1db1089af8) (#157)
- df97ae7: feat: 添加 OpenHarmonyModule 层级，支持检测 main、ohosTest 等多子模块的情况 (d5c78a3efe217358bf5f7a64960e175bf066a3a3)
- dfda7e8: feat: 添加 json 基础跳转源码检查 (48b47a9ce31fde88aaacd50adb95a8bd631c89a8)
- 828387a: feat: 添加媒体文件夹检查，重构多个 project detector 方法 (442c94f81659c2861d61dd103258f838e6073762)
- e6089b0: feat: 重构使用 @arkts/project-detector 查找资源 (#164)
- 8a29c5a: feat: 调整文件结构，区分文件、文件夹、子模块、模块级项目、工作区级项目、抽象项目等 (38c09f4db569d48f7df032fc160564e37e9cbacb)
- fc4c7b8: feat: 迁移 resource diagnostics 和 definition 到重构后的新服务，并添加 json 为 documentSelector (8740d298767070ca5c0a7af8ff662817f7fe3c6e)
- 19a8a75: 1c8ea58: feat: 添加 string/color 等 element file 在 module.json5 中的跳转功能 (1c8ea586d42547ed98c8b29851af5504d2e02041)
- Updated dependencies [a69a6d3]
- Updated dependencies [c401902]
- Updated dependencies [dfda7e8]
- Updated dependencies [828387a]
- Updated dependencies [e6089b0]
- Updated dependencies [fc4c7b8]
- Updated dependencies [19a8a75]
  - @arkts/shared@1.0.8
  - @arkts/types@1.1.1
