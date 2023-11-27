import * as path from 'path';

import { Worker } from "worker_threads";

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

  _worker = new Worker(path.resolve(__dirname, 'worker.js'));

  /**
   * @param {string} modulePath
   */
  constructor(modulePath) {
    this._modulePath = modulePath;

    this._worker.on('message', ({ type, payload }) => {
      switch (type) {
        case 'import':
          if (payload.error)
            this._importResolver?.reject(new Error(payload.error));
          else
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
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async import(filePath) {
    const promise = new Promise((resolve, reject) => {
      this._importResolver = { resolve, reject };
    });

    this._worker.postMessage({
      type: 'import',
      payload: { filePath, modulePath: this._modulePath },
    });

    return promise;
  }

  /**
   * @param {string} text
   * @param {string} filePath
   * @returns {Promise<any>}
   */
  callMethod(text, filePath) {
    const callMethodId = this._currentCallMethodId++;

    const promise = new Promise((resolve, reject) => {
      this._callMethodResolvers.push({ id: callMethodId, resolve, reject });
    });

    this._worker.postMessage({
      type: 'callMethod',
      payload: { modulePath: this._modulePath, text, filePath, id: callMethodId },
    });

    return promise;
  }

  reload() {
    this._worker = new Worker(path.resolve(__dirname, 'worker.js'));
  }
}