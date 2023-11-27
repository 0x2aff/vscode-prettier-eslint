# VS Code Prettier ESLint

- [Prerequisites](#prerequisites)
- [Notes](#notes)
- [Configuration](#configuration)

## Prerequisites

To use this VSCode extension for formatting JavaScript and TypeScript with [prettier-eslint](https://github.com/prettier/prettier-eslint), ensure the following packages are installed, either locally or globally:

- `prettier@^3`
- `eslint@^8`
- `prettier-eslint@^16`
- `@typescript-eslint/parser@^6` and `typescript@^5` **(Only for TypeScript projects)**

## Notes
The [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) are not required, but having the ESLint extension is recommended to display lint errors while editing.

### Install Dependencies

Install `prettier`, `eslint` and `prettier-eslint` as dev dependencies in your project. Use the appropriate command based on your project requirements. The commands below use `pnpm` but you can also use `npm`. Replace `pnpm add` with `npm i` if needed.

#### Minimum Requirements

```bash
pnpm add -D prettier@^3 eslint@^8 prettier-eslint@^16
```

#### TypeScript Projects

```bash
pnpm add -D prettier@3 eslint@^8 prettier-eslint@^16 @typescript-eslint/parser@^6 typescript@^5
```

### Project Settings

Configure your project by creating or updating a settings.json file at the project's root. If you already have a `.vscode/settings.json` file, skip the first two steps.

1. Open the command palette in VSCode:
   - `CTRL + SHIFT + P` (Windows)
   - `CMD + SHIFT + P` (Mac OS)

2. Type `Preferences: Open Workspace Settings (JSON)`.

3. In the `.vscode/settings.json` file, copy and paste the following settings:

   ```jsonc
   {
     "editor.defaultFormatter": "exceptionptr.vscode-prettier-eslint",
     "editor.formatOnType": false, // required
     "editor.formatOnPaste": true, // optional
     "editor.formatOnSave": true, // optional
     "editor.formatOnSaveMode": "file", // required to format on save
     "files.autoSave": "onFocusChange", // optional but recommended
     "vscode-prettier-eslint.prettierLast": false // set as "true" to run 'prettier' last not first
   }
   ```

4. **Restart VS Code**

Your project is now set up to automatically format code upon saving.

## Configuration

The extension uses ESLint and Prettier configuration files. These files are resolved from the file being formatted, searching up the file tree.

### ESLint Configuration File

Refer to [ESLint configuration](https://eslint.org/docs/user-guide/configuring)
Use `.eslintrc.*` or an `eslintConfig` field in `package.json`.

### Prettier Configuration File

Refer to [Prettier configuration](https://prettier.io/docs/en/configuration.html)
> - `prettier` field in `package.json`
> - `.prettierrc` file (JSON or YAML)
> - `.prettierrc.js` or `.prettier.config.js` file
> - `.prettierrc.toml` file

## Special Thanks to idahogurl
A big shoutout to [idahogurl](https://github.com/idahogurl) for her fantastic work on [vs-code-prettier-eslint](https://github.com/idahogurl/vs-code-prettier-eslint), which forms the backbone of this project. Thank you for your dedication to the developer community! 👏🚀