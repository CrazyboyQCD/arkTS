# ArkTS 文件图标主题

> 为ArkTS项目和现代Web开发提供的综合文件图标主题

## 📋 概述

成功扩展了 **ArkTS Icons** 主题，支持全面的Web开发文件类型。该主题为ArkTS特定文件**和**React、Next.js及现代Web项目中的所有常见文件提供独特的图标。

---

## 🎨 新增内容

### JavaScript 和 React
- `.js`、`.mjs`、`.cjs` → 🟡 黄色 JavaScript 图标
- `.jsx`、`.tsx` → 🔵 青色 React 图标  
- `.ts` → 🔵 蓝色 TypeScript 图标

### 样式文件
- `.css`、`.less` → 🔵 蓝色 CSS 图标
- `.scss`、`.sass` → 🔴 粉色 SCSS 图标

### 标记和文档
- `.html`、`.htm` → 🟠 橙色 HTML 图标
- `.md`、`.mdx`、`.markdown` → 🔵 蓝色 Markdown 图标
- `.txt` → ⚪ 灰色文本图标

### 配置文件
- `.gitignore`、`.gitattributes`、`.gitmodules` → 🟠 橙色 Git 图标
- `.env`、`.env.local`、`.env.*` → 🟢 绿色环境变量图标
- `.eslintrc*`、`.prettierrc*`、`.babelrc*` → ⚪ 灰色配置图标
- `next.config.js`、`vite.config.*`、`webpack.config.js` → ⚪ 灰色配置图标
- `tailwind.config.*`、`postcss.config.js` → ⚪ 灰色配置图标
- `vitest.config.*`、`jest.config.*` → ⚪ 灰色配置图标
- `pnpm-lock.yaml`、`.npmrc` → ⚪ 灰色配置图标

### 包管理文件
- `package.json`、`package-lock.json` → 🟡 黄色 JSON 图标
- `tsconfig.json`、`tsconfig.*.json` → 🟡 黄色 JSON 图标

### 常见文件夹
- `node_modules`、`.git`、`.vscode`
- `dist`、`build`、`public`、`src`
- `components`、`pages`、`app`
- `styles`、`assets`、`utils`、`lib`
- `hooks`、`context`、`api`

---

## 📊 完整文件支持

### 按扩展名

| 扩展名 | 图标类型 | 颜色 |
|--------|---------|------|
| `.ets` | TypeScript | 🔵 蓝色 |
| `.ts` | TypeScript | 🔵 蓝色 |
| `.tsx` | React | 🔵 青色 |
| `.js`、`.mjs`、`.cjs` | JavaScript | 🟡 黄色 |
| `.jsx` | React | 🔵 青色 |
| `.json`、`.json5` | JSON | 🟡 黄色 |
| `.md`、`.mdx` | Markdown | 🔵 蓝色 |
| `.css`、`.less` | CSS | 🔵 蓝色 |
| `.scss`、`.sass` | SCSS | 🔴 粉色 |
| `.html`、`.htm` | HTML | 🟠 橙色 |
| `.txt` | 文本 | ⚪ 灰色 |
| `.env` | 环境变量 | 🟢 绿色 |

### 按文件名

**ArkTS 配置文件：**
- `module.json5`、`oh-package.json5`、`build-profile.json5`
- `hvigor-config.json5`、`code-linter.json5`

**Web 开发配置：**
- `package.json`、`package-lock.json`、`pnpm-lock.yaml`
- `tsconfig.json`、`tsconfig.*.json`、`jsconfig.json`
- `.eslintrc*`、`eslint.config.*`
- `.prettierrc*`、`.babelrc*`
- `next.config.*`、`vite.config.*`、`vitest.config.*`
- `webpack.config.js`、`tailwind.config.*`、`postcss.config.js`
- `jest.config.*`

**Git 文件：**
- `.gitignore`、`.gitattributes`、`.gitmodules`

**环境变量：**
- `.env`、`.env.local`、`.env.development`、`.env.production`、`.env.test`

**文档：**
- `README.md`、`CHANGELOG.md`、`LICENSE`、`LICENSE.md`、`LICENSE.txt`

---

## 🎯 图标资源

**总计：22 个图标文件**

### 基础图标（12个）
- 文件夹：深色/浅色、折叠/展开、根目录变体
- 文档：深色/浅色通用文件

### 文件类型图标（10个）
- `typescript-file.svg` - 蓝色带"TS"
- `javascript-file.svg` - 黄色带"JS"
- `react-file.svg` - 青色带"JSX"
- `json-file.svg` - 黄色带"{}"
- `markdown-file.svg` - 蓝色带"MD"
- `css-file.svg` - 蓝色带"CSS"
- `scss-file.svg` - 粉色带"SCSS"
- `html-file.svg` - 橙色带"HTML"
- `config-file.svg` - 灰色带"."
- `git-file.svg` - 橙色带"GIT"
- `env-file.svg` - 绿色带"ENV"
- `text-file.svg` - 灰色带"TXT"

---

## 🚀 使用方法

### 安装步骤

1. **构建扩展：**
   ```bash
   cd packages/vscode
   pnpm run build
   ```

2. **打包扩展：**
   ```bash
   pnpm run pack
   ```

3. **在 VS Code 中安装：**
   - 打开扩展视图（`Cmd+Shift+X` / `Ctrl+Shift+X`）
   - 点击"..." → "从 VSIX 安装"
   - 选择生成的 `.vsix` 文件

4. **激活主题：**
   - 按 `Cmd+Shift+P` / `Ctrl+Shift+P`
   - 输入："Preferences: File Icon Theme"
   - 选择"ArkTS Icons"

### 工作区特定配置（Nx Monorepo）

在项目中创建 `.vscode/settings.json`：

```json
{
  "workbench.iconTheme": "arkts-icons"
}
```

---

## 👀 效果展示

### ArkTS 项目
- `.ets` 文件 → 🔵 蓝色 TypeScript 图标
- `module.json5` → 🟡 黄色 JSON 图标
- ArkTS 文件夹 → 标准文件夹图标

### React/Next.js 项目
- `.jsx`/`.tsx` 文件 → 🔵 青色 React 图标
- `.js` 文件 → 🟡 黄色 JavaScript 图标
- `.css`/`.scss` 文件 → 🔵 蓝色 / 🔴 粉色样式图标
- `package.json` → 🟡 黄色 JSON 图标
- `.env` 文件 → 🟢 绿色环境变量图标
- `.gitignore` → 🟠 橙色 Git 图标
- `next.config.js` → ⚪ 灰色配置图标

### 混合项目（Nx Monorepo）
所有文件类型无缝协作！🎉

---

## ✨ 优势特点

✅ **全面覆盖** - 支持 ArkTS + React/Next.js + 通用 Web 开发文件  
✅ **视觉区分** - 一目了然地识别文件类型  
✅ **一致设计** - 颜色编码图标，标签清晰  
✅ **明暗支持** - 在 VS Code 的明暗主题中均可使用  
✅ **Monorepo 就绪** - 完美适配 Nx 工作区的混合项目  
✅ **无冲突** - 扩展 VS Code 的最小主题，不覆盖默认设置

---

## 🛠️ 自定义配置

要添加更多文件类型，请编辑 `icons/arkts-icon-theme.json`：

### 1. 添加图标定义：
```json
"iconDefinitions": {
  "_your_file": {
    "iconPath": "./images/your-file.svg"
  }
}
```

### 2. 映射文件扩展名：
```json
"fileExtensions": {
  "ext": "_your_file"
}
```

### 3. 或映射特定文件名：
```json
"fileNames": {
  "specific-file.ext": "_your_file"
}
```

> **注意：** 别忘了在 `"light"` 部分更新相同的映射以支持浅色主题！

---

## 📝 快速参考

**主题扩展了 VS Code 的最小主题** - 所有标准文件（`.ts`、`.json`、`.js` 等）显示其默认图标。只有 ArkTS 特定文件和 Web 开发文件获得自定义图标。

**适用于：**
- ArkTS/OpenHarmony 项目
- React/Next.js 应用程序
- Nx monorepo 混合项目
- 现代 Web 开发工作流