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
  const { modulePath } = payload;

  let instance = moduleCache.get(modulePath);

  if (!instance) {
    instance = loadNodeModule(modulePath);
    moduleCache.set(modulePath, instance);
  }

  parentPort?.postMessage({
    type: 'import',
    payload: { name: instance.name },
  });
}

/**
 *
 * @param {*} payload
 */
function onCallMethod(payload) {
  const { modulePath, methodArgs, id } = payload;

  try {
    const instance = moduleCache.get(modulePath);

    if (!instance) {
      throw new Error(`No instance found for module path: ${modulePath}`);
    }

    const result = instance(...methodArgs);

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
 */
function loadNodeModule(modulePath) {
  return typeof require(modulePath) === 'function'
    ? require(modulePath)
    : require(modulePath).default;
}