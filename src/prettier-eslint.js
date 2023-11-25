import * as path from 'path';
import vscode from 'vscode';

import { Worker } from "worker_threads";

const worker = new Worker(path.join(__dirname, 'worker.js'));

export class PrettierEslintVSCode {
  /**
   * @private
   * @type {{ resolve: (name: string) => void; reject: (err: Error) => void; } | null}
   */
  _importResolver = null;

  /**
   * @private
   * @type {{ id: number; resolve: (result: unknown) => void; reject: (err: Error) => void; }[]}}
   */
  _callMethodResolvers = [];

  /**
   * @private
   * @type {number}
   */
  _currentCallMethodId = 0;

  /**
   * @private
   * @type {string}
   */
  _modulePath = '';

  /**
   * @param {string} modulePath
   */
  constructor(modulePath) {
    const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
    const nodeModulesPath = workspaceDir ? path.join(workspaceDir, 'node_modules') : null;

    this._modulePath = nodeModulesPath ? path.join(nodeModulesPath, modulePath) : modulePath;

    worker.on('message', ({ type, payload }) => {
      switch (type) {
        case 'import':
          this._importResolver?.resolve(payload.name);
          break;

        case 'callMethod':
          const callMethodResolver = this._callMethodResolvers.find(({ id }) => id === payload.id);
          if (!callMethodResolver) break;

          if (payload.error)
            callMethodResolver.reject(new Error(payload.error));
          else
            callMethodResolver.resolve(payload.result);

          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    });
  }

  /**
   * @returns {Promise<string>}
   */
  async import() {
    const promise = new Promise((resolve, reject) => {
      this._importResolver = { resolve, reject };
    });

    worker.postMessage({
      type: 'import',
      payload: { modulePath: this._modulePath },
    });

    return promise;
  }

  /**
   * @param {unknown[]} methodArgs
   * @returns {Promise<any>}
   */
  callMethod(methodArgs) {
    const callMethodId = this._currentCallMethodId++;

    const promise = new Promise((resolve, reject) => {
      this._callMethodResolvers.push({ id: callMethodId, resolve, reject });
    });

    worker.postMessage({
      type: 'callMethod',
      payload: { modulePath: this._modulePath, methodArgs, id: callMethodId },
    });

    return promise;
  }
}