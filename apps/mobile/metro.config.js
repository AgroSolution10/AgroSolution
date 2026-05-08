const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Setup monorepo: Metro precisa "vigiar" a raiz do workspace e procurar deps
// nos dois node_modules (do app e do workspace, que recebe os pacotes hoisted).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// react-leaflet 4.x é ESM puro: faz `import './X.js'` com extensão explícita.
// O Metro do Expo SDK 51 tropeça nesses caminhos. Aqui interceptamos só
// imports vindos de dentro do react-leaflet e removemos o sufixo ".js",
// deixando o Metro resolver pelo nome base (que ele entende).
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromReactLeaflet =
    context.originModulePath && context.originModulePath.includes('react-leaflet');
  if (fromReactLeaflet && moduleName.startsWith('./') && moduleName.endsWith('.js')) {
    const semExtensao = moduleName.slice(0, -'.js'.length);
    return context.resolveRequest(context, semExtensao, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
