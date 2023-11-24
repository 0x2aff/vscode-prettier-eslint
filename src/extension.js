/**
 * @param {import('vscode').ExtensionContext} context - The context.
 */
async function activate(context) {
  (await import('./register.mjs')).activate(context);
}

module.exports.activate = activate;