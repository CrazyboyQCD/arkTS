# ArkTS File Icons Theme

> A comprehensive file icon theme for ArkTS projects and modern web development

## 📋 Summary

Successfully expanded the **ArkTS Icons** theme to support comprehensive web development file types. The theme provides distinctive icons for ArkTS-specific files **and** all common files found in React, Next.js, and modern web projects.

---

## 🎨 What's New

### JavaScript & React
- `.js`, `.mjs`, `.cjs` → 🟡 Yellow JavaScript icon
- `.jsx`, `.tsx` → 🔵 Cyan React icon  
- `.ts` → 🔵 Blue TypeScript icon

### Styling
- `.css`, `.less` → 🔵 Blue CSS icon
- `.scss`, `.sass` → 🔴 Pink SCSS icon

### Markup & Documentation
- `.html`, `.htm` → 🟠 Orange HTML icon
- `.md`, `.mdx`, `.markdown` → 🔵 Blue Markdown icon
- `.txt` → ⚪ Gray text icon

### Configuration Files
- `.gitignore`, `.gitattributes`, `.gitmodules` → 🟠 Orange Git icon
- `.env`, `.env.local`, `.env.*` → 🟢 Green environment icon
- `.eslintrc*`, `.prettierrc*`, `.babelrc*` → ⚪ Gray config icon
- `next.config.js`, `vite.config.*`, `webpack.config.js` → ⚪ Gray config icon
- `tailwind.config.*`, `postcss.config.js` → ⚪ Gray config icon
- `vitest.config.*`, `jest.config.*` → ⚪ Gray config icon
- `pnpm-lock.yaml`, `.npmrc` → ⚪ Gray config icon

### Package Files
- `package.json`, `package-lock.json` → 🟡 Yellow JSON icon
- `tsconfig.json`, `tsconfig.*.json` → 🟡 Yellow JSON icon

### Common Folders
- `node_modules`, `.git`, `.vscode`
- `dist`, `build`, `public`, `src`
- `components`, `pages`, `app`
- `styles`, `assets`, `utils`, `lib`
- `hooks`, `context`, `api`

---

## 📊 Complete File Support

### By Extension

| Extension | Icon Type | Color |
|-----------|-----------|-------|
| `.ets` | TypeScript | 🔵 Blue |
| `.ts` | TypeScript | 🔵 Blue |
| `.tsx` | React | 🔵 Cyan |
| `.js`, `.mjs`, `.cjs` | JavaScript | 🟡 Yellow |
| `.jsx` | React | 🔵 Cyan |
| `.json`, `.json5` | JSON | 🟡 Yellow |
| `.md`, `.mdx` | Markdown | 🔵 Blue |
| `.css`, `.less` | CSS | 🔵 Blue |
| `.scss`, `.sass` | SCSS | 🔴 Pink |
| `.html`, `.htm` | HTML | 🟠 Orange |
| `.txt` | Text | ⚪ Gray |
| `.env` | Environment | 🟢 Green |

### By Filename

**ArkTS Config:**
- `module.json5`, `oh-package.json5`, `build-profile.json5`
- `hvigor-config.json5`, `code-linter.json5`

**Web Dev Config:**
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `tsconfig.json`, `tsconfig.*.json`, `jsconfig.json`
- `.eslintrc*`, `eslint.config.*`
- `.prettierrc*`, `.babelrc*`
- `next.config.*`, `vite.config.*`, `vitest.config.*`
- `webpack.config.js`, `tailwind.config.*`, `postcss.config.js`
- `jest.config.*`

**Git Files:**
- `.gitignore`, `.gitattributes`, `.gitmodules`

**Environment:**
- `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`

**Documentation:**
- `README.md`, `CHANGELOG.md`, `LICENSE`, `LICENSE.md`, `LICENSE.txt`

---

## 🎯 Icon Assets

**Total: 22 icon files**

### Base Icons (12)
- Folders: dark/light, collapsed/expanded, root variants
- Documents: dark/light generic files

### File Type Icons (10)
- `typescript-file.svg` - Blue with "TS"
- `javascript-file.svg` - Yellow with "JS"
- `react-file.svg` - Cyan with "JSX"
- `json-file.svg` - Yellow with "{}"
- `markdown-file.svg` - Blue with "MD"
- `css-file.svg` - Blue with "CSS"
- `scss-file.svg` - Pink with "SCSS"
- `html-file.svg` - Orange with "HTML"
- `config-file.svg` - Gray with "."
- `git-file.svg` - Orange with "GIT"
- `env-file.svg` - Green with "ENV"
- `text-file.svg` - Gray with "TXT"

---

## 🚀 How to Use

### Installation

1. **Build the extension:**
   ```bash
   cd packages/vscode
   pnpm run build
   ```

2. **Package the extension:**
   ```bash
   pnpm run pack
   ```

3. **Install in VS Code:**
   - Open Extensions view (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - Click "..." → "Install from VSIX"
   - Select the generated `.vsix` file

4. **Activate the theme:**
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type: "Preferences: File Icon Theme"
   - Select "ArkTS Icons"

### Workspace-Specific (Nx Monorepo)

Create `.vscode/settings.json` in your project:

```json
{
  "workbench.iconTheme": "arkts-icons"
}
```

---

## 👀 What You'll See

### ArkTS Projects
- `.ets` files → 🔵 Blue TypeScript icon
- `module.json5` → 🟡 Yellow JSON icon
- ArkTS folders → Standard folder icons

### React/Next.js Projects
- `.jsx`/`.tsx` files → 🔵 Cyan React icon
- `.js` files → 🟡 Yellow JavaScript icon
- `.css`/`.scss` files → 🔵 Blue / 🔴 Pink styling icons
- `package.json` → 🟡 Yellow JSON icon
- `.env` files → 🟢 Green environment icon
- `.gitignore` → 🟠 Orange Git icon
- `next.config.js` → ⚪ Gray config icon

### Mixed Projects (Nx Monorepo)
All file types work together seamlessly! 🎉

---

## ✨ Benefits

✅ **Comprehensive Coverage** - Supports ArkTS + React/Next.js + general web dev files  
✅ **Visual Distinction** - Easy to identify file types at a glance  
✅ **Consistent Design** - Color-coded icons with clear labels  
✅ **Light/Dark Support** - Works in both VS Code themes  
✅ **Monorepo Ready** - Perfect for Nx workspaces with mixed projects  
✅ **No Conflicts** - Extends VS Code's minimal theme, doesn't override defaults

---

## 🛠️ Customization

To add more file types, edit `icons/arkts-icon-theme.json`:

### 1. Add icon definition:
```json
"iconDefinitions": {
  "_your_file": {
    "iconPath": "./images/your-file.svg"
  }
}
```

### 2. Map file extension:
```json
"fileExtensions": {
  "ext": "_your_file"
}
```

### 3. Or map specific filename:
```json
"fileNames": {
  "specific-file.ext": "_your_file"
}
```

> **Note:** Don't forget to update the same mappings in the `"light"` section for light theme support!

---

## 📝 Quick Reference

**Theme extends VS Code's minimal theme** - All standard files (`.ts`, `.json`, `.js`, etc.) show their default icons. Only ArkTS-specific and web development files get custom icons.

**Perfect for:**
- ArkTS/OpenHarmony projects
- React/Next.js applications
- Nx monorepos with mixed projects
- Modern web development workflows