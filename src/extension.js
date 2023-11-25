import fs from 'fs';
import path from 'path';
import nodeIgnore from 'ignore';

import vscode from 'vscode';
import { findUpSync } from 'find-up';

import { PrettierEslintVSCode } from './prettier-eslint';

/**
 * The output channel used for logging and displaying messages.
 * @type {vscode.OutputChannel}
 */
let outputChannel;

/**
 * @type {PrettierEslintVSCode}
 */
let prettierEslint;

const supportedLanguages = [
  "css",
  "scss",
  "less",
  "json",
  "jsonc",
  "html",
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
]

/**
 * Gets the ignore line instance.
 * @param {string} filename - The filename
 */
function getIsIgnored(filename) {
  const ignoreLines = fs.readFileSync(filename, 'utf8')
    .split(/(\r|\n|\r\n)/)
    .filter((line) => Boolean(line.trim()));

    const instance = nodeIgnore();
    instance.add(ignoreLines);

    return instance.ignores.bind(instance);
}

/**
 * Checks if the given file path is matched by an ESLint ignore file.
 * @param {string} filePath - The file path.
 * @param {string | undefined} workspaceDirectory - The workspace directory.
 * @param {string} ignoreFileName - The name of the ignore file.
 */
function isFilePathMatchedByIgnore(filePath, workspaceDirectory, ignoreFileName) {

  /**
   * @type {{ cwd: string; stopAt?: string; }}
   */
  const options = { cwd: path.dirname(filePath) };

  if (workspaceDirectory) {
    options.stopAt = workspaceDirectory;
  }

  const ignoreFilePath = findUpSync(ignoreFileName, options);

  if (!ignoreFilePath) {
    return false;
  }

  const ignoreFileDir = path.dirname(ignoreFilePath);
  const filePathRelativeToIgnoreFileDir = path.relative(ignoreFileDir, filePath);

  const isIgnored = getIsIgnored(ignoreFilePath);
  return isIgnored(filePathRelativeToIgnoreFileDir);
}

/**
 * Formats the given text.
 * @param {{ text: string; filePath: string; extensionConfig: { prettierLast: boolean; }; }} params - The parameters.
 * @returns {Promise<string>} The formatted text.
 */
async function formatText({ text, filePath, extensionConfig }) {
  try {
    const name = await prettierEslint.import();

    if (!name) {
      outputChannel.appendLine('No prettier-eslint found.');
      throw new Error('No prettier-eslint found.');
    }

    const result = await prettierEslint
      .callMethod([{ text, filePath, prettierLast: extensionConfig.prettierLast }]);

    return result;
  } catch (/** @type { any } */ err) {
    outputChannel.appendLine(`Error: ${err.message} \n ${err.stack}`);
    outputChannel.show();
  }

  return text;
}

/**
 * This method is called as our formatting provider.
 * @param {import('vscode').TextDocument} document - The document.
 */
async function formatter(document) {
  const documentPath = path.dirname(document.fileName);

  const workspaceDirectory = vscode.workspace?.workspaceFolders?.find(
    (/** @type {{ uri: { path: string; }; }} */ folder) =>
      documentPath.startsWith(folder.uri.path)
  );

  try {
    const workspaceDirPath = workspaceDirectory?.uri?.path;

    if (isFilePathMatchedByIgnore(document.fileName, workspaceDirPath, '.eslintignore')) {
      outputChannel.appendLine(`File ${document.fileName} is ignored by ESLint.`);
      return;
    }

    if (isFilePathMatchedByIgnore(document.fileName, workspaceDirPath, '.prettierignore')) {
      outputChannel.appendLine(`File ${document.fileName} is ignored by Prettier.`);
      return;
    }

    const startLine = document.lineAt(0);
    const endLine = document.lineAt(document.lineCount - 1);

    const range = new vscode.Range(startLine.range.start, endLine.range.end);

    const text = document.getText(range);

    const extensionConfig = vscode.workspace.getConfiguration('vscode-prettier-eslint');
    const formatted = await formatText({ text, filePath: document.fileName, extensionConfig });

    return [vscode.TextEdit.replace(range, formatted)];
  } catch (/** @type { any } */ err) {
    outputChannel.appendLine(`Error: ${err.message} \n ${err.stack}`);
    outputChannel.show();
  }
}

/**
 * This method is called when your extension is activated, which
 * happens the very first time the command is executed.
 * @param {import('vscode').ExtensionContext} context - The context.
 */
export function activate(context) {
  outputChannel = vscode.window.createOutputChannel('VSCode Prettier ESLint');
  prettierEslint = new PrettierEslintVSCode('prettier-eslint');

  supportedLanguages.forEach((language) => {
    const disposable = vscode.languages.registerDocumentRangeFormattingEditProvider(language, {
      provideDocumentRangeFormattingEdits: formatter,
    });

    context.subscriptions.push(disposable);
  });
}