import requireRelative from 'require-relative';
import { parentPort } from 'worker_threads';

const moduleCache = new Map();

parentPort?.on('message', onParentPortMessage);

/**
 *
 * @param {{type: 'import' | 'callMethod'; payload: *}} params
 */
function onParentPortMessage({ type, payload }) {
  switch (type) {
    case 'import':
      onImport(payload);
      break;

    case 'callMethod':
      onCallMethod(payload);
      break;
  }
}

/**
 *
 * @param {*} payload
 */
function onImport(payload) {
  const { filePath, modulePath } = payload;
  try {
    let instance = moduleCache.get(modulePath);

    if (!instance) {
      instance = loadNodeModule(modulePath, filePath);

      if (!instance)
        throw new Error(`No instance found for module path: ${modulePath}`);

      moduleCache.set(modulePath, instance);
    }

    parentPort?.postMessage({
      type: 'import',
      payload: { name: instance.name },
    });
  } catch (/** @type { any } */ err) {
    parentPort?.postMessage({
      type: 'import',
      payload: { error: err.message },
    });
  }
}

/**
 *
 * @param {*} payload
 */
function onCallMethod(payload) {
  const { modulePath, text, filePath, id } = payload;

  try {
    const instance = moduleCache.get(modulePath);

    if (!instance) {
      throw new Error(`No instance found for module path: ${modulePath}`);
    }

    const arg = { text, filePath };
    const result = instance(arg);

    if (result instanceof Promise) {
      result.then(
        (/** @type { any } */ result) => {
          parentPort?.postMessage({
            type: 'callMethod',
            payload: { id, result },
          });
        },
        (/** @type { any } */ err) => {
          parentPort?.postMessage({
            type: 'callMethod',
            payload: { id, error: err.message },
          });
        },
      );
      return;
    }

    parentPort?.postMessage({
      type: 'callMethod',
      payload: { id, result },
    });
  } catch (/** @type { any } */ err) {
    parentPort?.postMessage({
      type: 'callMethod',
      payload: { id, error: err.message },
    });
  }
}

/**
 * @param {string} modulePath
 * @param {string} filePath
 */
function loadNodeModule(modulePath, filePath) {
  return requireRelative(modulePath, filePath);
}