import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import * as path from 'node:path';
import { default as klawSync } from 'klaw-sync';
import * as url from 'url';
import _ from 'underscore';

/**
 * The directory name of the current module.
 * This is equivalent to the `__dirname` variable in CommonJS modules.
 * It is derived from the URL of the current module using `import.meta.url`.
 */
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * A reference to the plugin studio window.
 * @type {Object}
 */
let pluginStudioWindow;


/**
 * Installs npm modules in the specified folder if a package.json file exists.
 * 
 * @param {string} folder - The path to the folder containing the package.json file.
 * @returns {Promise<boolean|string>} - A promise that resolves to true if the installation is successful, 
 * or an error message if there is an error during the process.
 */
const installPluginModules = (folder) => {

  return new Promise(async (resolve) => {
    if (fs.existsSync(path.resolve(folder, 'package.json'))) {
      
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `cd ${folder} && npm.cmd install --json` : `cd ${folder} && npm install --json`;
      const shell = isWindows ? 'cmd' : 'sh';
      const shellFlag = isWindows ? '/c' : '-c';
      
      const auditProcess = spawn(shell, [shellFlag, command]);
      let stdout = '', stderr = '';

      auditProcess.stdout.on('data', (data) => {
          stdout += data.toString();
      });

      auditProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      auditProcess.on('close', () => {
        if (stderr && stderr.indexOf('deprecated') === -1) {
            return resolve(L.get(["infos.standardError", 'init', stderr]));
        }

        try {
          let packageJSON = fs.readJsonSync(path.resolve(folder, 'package.json'), {throws: true });
          delete packageJSON.main;
          packageJSON.type = "module";
          packageJSON.license = "MIT";
          fs.writeJsonSync(path.resolve(folder, 'package.json'), packageJSON);
          resolve (true);
        } catch (parseError) {
          return resolve(L.get(["infos.parsingError", 'init', parseError.message]));
        }

        auditProcess.on('error', (err) => {
          return resolve(L.get(["infos.parsingCmd", 'init', err.message]));
        });
      });
    } else {
        resolve(true);
    }
  })
}


/**
 * Initializes a JSON package in the specified folder.
 * 
 * This function checks if `package.json` and `package-lock.json` exist in the given folder.
 * If they do not exist, it initializes a new npm package and installs dependencies.
 * 
 * @param {string} folder - The path to the folder where the package should be initialized.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the initialization was successful, or `false` if there was an error.
 */
const initJsonPackage = (folder) => {
  return new Promise(async (resolve) => {
    if (fs.existsSync(path.resolve(folder, 'package.json')) && fs.existsSync(path.resolve(folder, 'package-lock.json'))) return resolve(true);

    const isWindows = process.platform === 'win32';
    let command, type;
    if (!fs.existsSync(path.resolve(folder, 'package.json'))) {
      command = isWindows ? `cd ${folder} && npm.cmd init -y --json && npm.cmd install --save` : `cd ${folder} && npm init -y --json && npm install --save`;
      type = true;
    } else {
      command = isWindows ? `cd ${folder} && npm.cmd i --package-lock-only` : `cd ${folder} && npm i --package-lock-only`;
    }
    const shell = isWindows ? 'cmd' : 'sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const auditProcess = spawn(shell, [shellFlag, command]);
    let stdout = '', stderr = '';

    auditProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    }); 
    
    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    auditProcess.on('close', () => {
      if (stderr && stderr.indexOf('deprecated') === -1) {
        error(L.get(["infos.standardError", 'init', stderr]));
        return resolve(false);
      }

      try {
        if (type) {
          let packageJSON = fs.readJsonSync(path.resolve(folder, 'package.json'), {throws: true });
          delete packageJSON.main;
          packageJSON.type = "module";
          packageJSON.license = "MIT";
          fs.writeJsonSync(path.resolve(folder, 'package.json'), packageJSON);
        }
        resolve (true);
      } catch (parseError) {
        error(L.get(["infos.parsingError", 'init', parseError.message]));
        return resolve(false);
      }

      auditProcess.on('error', (err) => {
        error(L.get(["infos.parsingCmd", 'init', err.message]));
        return resolve(false);
      });
    });
  })
}


/**
 * Runs an audit or other npm command in the specified folder.
 *
 * @param {string} folder - The path to the folder where the npm command should be run.
 * @param {string} option - The npm command to run (e.g., 'audit', 'install').
 * @returns {Promise<Object|boolean>} - A promise that resolves to the result of the npm command in JSON format,
 *                                      or an empty object if there was an error, or false if the initialization failed.
 */
function runAudit (folder, option) {
  return new Promise(async (resolve) => {
      if (!await initJsonPackage(folder)) return resolve(false);
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `cd ${folder} && npm.cmd ${option} --json` : `cd ${folder} && npm ${option} --json`;
      const shell = isWindows ? 'cmd' : 'sh';
      const shellFlag = isWindows ? '/c' : '-c';

      const auditProcess = spawn(shell, [shellFlag, command]);
      let stdout = '', stderr = '';

      auditProcess.stdout.on('data', (data) => {
          stdout += data.toString();
      }); 
      
      auditProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      auditProcess.on('close', () => {
        if (stderr) {
            error(L.get(["infos.standardError", option, stderr]));
            return resolve({});
        }

        try {
            const result = JSON.parse(stdout);
            if (option === 'audit') {
              resolve (result.vulnerabilities ? result.vulnerabilities : {});
            } else {
              resolve (result ? result : {});
            }
        } catch (parseError) {
            error(L.get(["infos.parsingError", option, parseError.message]));
            return resolve({});
        }

        auditProcess.on('error', (err) => {
          error(L.get(["infos.parsingCmd", option, err.message]));
          return resolve({});
        });
      });
  })
}


/**
 * Runs an audit plugin on a list of directories.
 *
 * @param {Array} directories - An array of directory objects to be audited.
 * @param {number} count - The current count of directories processed.
 * @param {Array} auditInfo - An array to store audit information for each directory.
 * @param {Array} outdatedInfo - An array to store outdated information for each directory.
 * @param {Function} next - A callback function to be called when all directories have been processed.
 * @returns {Promise<void>} - A promise that resolves when the audit process is complete.
 */
async function runAuditPlugin (directories, count, auditInfo, outdatedInfo, next) {

  if (count === directories.length) return next();

  pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.auditProgressLabel", path.basename(directories[count].path)]));
  const audit = await runAudit(directories[count].path, 'audit');
  if (audit === false) {
    error(L.get(["infos.noJsonPackage", path.basename(directories[count].path)]));
    runAuditPlugin (directories, ++count, auditInfo, outdatedInfo, next);
    return;
  }
  if (Object.keys(audit).length > 0) auditInfo.push({plugin: path.basename(directories[count].path), 'audit': audit});
  pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.obsolescenceProgressLabel", path.basename(directories[count].path)]));
  const outdated = await runAudit(directories[count].path, 'outdated');
  if (Object.keys(outdated).length > 0) outdatedInfo.push({plugin: path.basename(directories[count].path), 'outdated': outdated})
  runAuditPlugin (directories, ++count, auditInfo, outdatedInfo, next);
}


/**
 * Audits the plugins in the specified window.
 *
 * This function scans the 'core/plugins' directory for subdirectories containing 'node_modules'.
 * It then runs an audit on these directories and sends the audit results to the specified window.
 *
 * @param {Object} win - The window object to which the audit results will be sent.
 */
function auditPlugin(win){

  pluginStudioWindow = win;   

  const filterFn = item => fs.existsSync(path.resolve(item.path, 'node_modules'));
  const directories = klawSync(path.resolve(__dirname, 'core', 'plugins'), {nofile: true, depthLimit: 0, filter: filterFn})

  let auditInfo = [], outdatedInfo = [];
  runAuditPlugin (directories, 0, auditInfo, outdatedInfo, () => {
    pluginStudioWindow.webContents.send('getAudit', {audit: auditInfo, outdated: outdatedInfo});
  })
}


/**
 * Retrieves the current version of an npm package.
 *
 * @param {string} key - The name of the npm package.
 * @returns {Promise<string>} A promise that resolves to the version of the npm package.
 */
function getCurrentPackageVersion (key) {
  return new Promise(async (resolve) => {

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `npm.cmd show ${key} version --json` : `npm show ${key} version --json`;
    const shell = isWindows ? 'cmd' : 'sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const auditProcess = spawn(shell, [shellFlag, command]);
    let stdout = '', stderr = '';

    auditProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    }); 
    
    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    auditProcess.on('close', () => {
      if (stderr) {
          error(L.get(["infos.standardError", option, stderr]));
          return resolve({});
      }

      try {
          const result = JSON.parse(stdout);
          resolve (result);
      } catch (parseError) {
          error(L.get(["infos.parsingError", option, parseError.message]));
          return resolve();
      }

      auditProcess.on('error', (err) => {
        error(L.get(["infos.parsingCmd", option, err.message]));
        return resolve();
      });
    });
  })
}


/**
 * Retrieves the version of a specified package used by a plugin or project.
 *
 * @param {Object} arg - The argument object.
 * @param {string} arg.plugin - The name of the plugin (if applicable).
 * @param {string} arg.usedBy - The name of the package that uses the specified package.
 * @param {string} arg.package - The name of the package whose version is to be retrieved.
 * @param {string} arg.key - The key to be used in the npm list command.
 * @returns {Promise<string|undefined>} A promise that resolves to the version of the package, or undefined if not found.
 */
function getUsedPackageVersion (arg) {
  return new Promise(async (resolve) => {

    let folder;
    if (arg.plugin) {
      folder = arg.plugin !== arg.usedBy
      ? path.resolve(__dirname, 'core', 'plugins', arg.plugin, 'node_modules', arg.usedBy, 'node_modules', arg.package)
      : path.resolve(__dirname, 'core', 'plugins', arg.plugin, 'node_modules', arg.package);
    } else {
      folder = arg.package !== arg.usedBy
      ? path.resolve(__dirname, 'node_modules', arg.usedBy, 'node_modules', arg.package)
      : path.resolve(__dirname, 'node_modules', arg.package);
    }

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `cd ${folder} && npm.cmd list ${arg.key} --json` : `cd ${folder} && npm list ${arg.key} --json`;
    const shell = isWindows ? 'cmd' : 'sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const auditProcess = spawn(shell, [shellFlag, command]);
    let stdout = '', stderr = '';

    auditProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    }); 
    
    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    auditProcess.on('close', () => {
      if (stderr) {
          error(L.get(["infos.standardError", 'list', stderr]));
          return resolve();
      }

      try {
          const result = JSON.parse(stdout);
          if (result.version)
            resolve (result.version);
          else 
            resolve();
      } catch (parseError) {
          error(L.get(["infos.parsingError", 'list', parseError.message]));
          return resolve();
      }

      auditProcess.on('error', (err) => {
        error(L.get(["infos.parsingCmd", 'list', err.message]));
        return resolve();
      });
    });
  })
}


/**
 * Retrieves information about the current and used versions of a package.
 *
 * @param {Object} arg - The argument object.
 * @param {string} arg.package - The name of the package.
 * @param {string} [arg.plugin] - The name of the plugin (optional).
 * @returns {Promise<Object>} A promise that resolves to an object containing the package name, used version, and current version.
 * @property {string} package - The name of the package.
 * @property {string} used - The used version of the package.
 * @property {string} current - The current version of the package.
 */
function getInfoPackage (arg) {
    return new Promise(async (resolve) => {
      if ( arg.plugin) pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.getCurrentPackageVersion", arg.package, arg.plugin]));
      const currentPackageVersion = await getCurrentPackageVersion(arg.package);
      if ( arg.plugin) pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.getUsedPackageVersion", arg.package, arg.plugin]));
      const usedPackageVersion = await getUsedPackageVersion(arg);
      resolve ({package: arg.package, used: usedPackageVersion, current: currentPackageVersion })
    })
}


/**
 * Runs an update by installing a specified package version in a given folder.
 *
 * @param {string} folder - The folder where the package should be installed.
 * @param {string} pack - The name of the package to install.
 * @param {string} version - The version of the package to install.
 * @returns {Promise<boolean|object>} - A promise that resolves to the result of the installation. 
 *                                      It resolves to `true` if the installation was successful and no changes were detected,
 *                                      or an object containing the changes if there were any. 
 *                                      It resolves to `false` if there was an error during the installation.
 */
const runUpdate = (folder, pack, version) => {
  return new Promise(async (resolve) => {
     
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `cd ${folder} && npm.cmd install ${pack}@${version} --json` : `cd ${folder} && npm install ${pack}@${version} --json`;
    const shell = isWindows ? 'cmd' : 'sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const auditProcess = spawn(shell, [shellFlag, command]);
    let stdout = '';
    let stderr = '';

    auditProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    }); 
    
    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    auditProcess.on('close', () => {
      if (stderr) {
          error(L.get(["infos.standardError", "install", stderr]));
          return resolve(false);
      }

      try {
        const result = JSON.parse(stdout);
        resolve (result.changed || true);
      } catch (parseError) {
          error(L.get(["infos.parsingError", "install", parseError.message]));
          return resolve(false);
      }

      auditProcess.on('error', (err) => {
        error(L.get(["infos.parsingCmd", "install", err.message]));
        return resolve(false);
      });
    });
  })
}


/**
 * Asynchronously runs the update process for a list of packages.
 *
 * @param {Array} packages - An array of packages to be updated. Each package is represented as an array with the following elements:
 *   [0] {string} - The name of the package.
 *   [1] {string} - The version of the package.
 *   [2] {string} - Unused in this function.
 *   [3] {string} - Additional information about the package.
 * @param {number} count - The current index of the package being processed.
 * @param {Array} fixInfo - An array to store the results of the update process for each package.
 * @param {Function} next - A callback function to be called when all packages have been processed.
 * @returns {void}
 */
async function runUpdatePackage (packages, count, fixInfo, next) {

    if (count === packages.length) return next();
    
    pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.updateProgressLabel", packages[count][1], packages[count][0], packages[count][3]]));
    
    const folder = path.resolve(__dirname, 'core', 'plugins', packages[count][0])
    const fix = await runUpdate(folder, packages[count][1], packages[count][3]);
    fixInfo.push({plugin: packages[count][0], package: packages[count][1], result: fix});
    runUpdatePackage (packages, ++count, fixInfo, next);
}


/**
 * Runs a fix by installing the specified npm package in the given folder.
 *
 * @param {string} folder - The folder where the npm package should be installed.
 * @param {string} pack - The name of the npm package to install.
 * @returns {Promise<boolean|object>} - A promise that resolves to the result of the installation.
 *                                      If the installation is successful, it resolves to the parsed JSON result or true.
 *                                      If there is an error, it resolves to false.
 */
const runFix = (folder, pack) => {
  return new Promise(async (resolve) => {
     
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `cd ${folder} && npm.cmd install ${pack}@latest --json` : `cd ${folder} && npm install ${pack}@latest --json`;
    const shell = isWindows ? 'cmd' : 'sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const auditProcess = spawn(shell, [shellFlag, command]);
    let stdout = '';
    let stderr = '';

    auditProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    }); 
    
    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    auditProcess.on('close', () => {
      if (stderr) {
          error(L.get(["infos.standardError", "install", stderr]));
          return resolve(false);
      }

      try {
        const result = JSON.parse(stdout);
        resolve (result.changed || true);
      } catch (parseError) {
          error(L.get(["infos.parsingError", "install", parseError.message]));
          return resolve(false);
      }

      auditProcess.on('error', (err) => {
        error(L.get(["infos.parsingCmd", "install", err.message]));
        return resolve(false);
      });
    });
  })
}


/**
 * Updates the plugin packages and sends the result to the plugin studio window.
 *
 * @param {Array} packages - An array of packages to be updated.
 */
function pluginUpdatePackage (packages) {
    let fixInfo = [];
    runUpdatePackage(packages, 0, fixInfo, () => {
      pluginStudioWindow.webContents.send('getUpdatePackageResult', fixInfo);
    });
}
  

/**
 * Fixes vulnerabilities in the given list of packages.
 *
 * This function filters the provided packages to include only those that have a specific
 * vulnerability status indicated by a green-colored span element. It then runs a vulnerability
 * fix process on the filtered packages and sends the fix results to the plugin studio window.
 *
 * @param {Array} packages - The list of packages to check and fix vulnerabilities for.
 */
function pluginVulnerabilityFix(packages){
    let fixInfo = [];
    packages = _.filter(packages, num => { return num[4] === `<span style="color:green">${L.get("infos.true")}</span>`; });
    runVulnerabilityFix (packages, 0, fixInfo, () => {
      pluginStudioWindow.webContents.send('getFixResult', fixInfo);
    });
}
  

/**
 * Recursively runs vulnerability fixes on a list of packages.
 *
 * @async
 * @function runVulnerabilityFix
 * @param {Array} packages - An array of package information arrays. Each inner array contains the package name, version, and dependency name.
 * @param {number} count - The current index in the packages array.
 * @param {Array} fixInfo - An array to store the results of the fixes.
 * @param {Function} next - A callback function to be called when all fixes are complete.
 * @returns {void}
 */
  async function runVulnerabilityFix (packages, count, fixInfo, next) {
  
    if (count === packages.length) return next();
    
    pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.fixProgressLabel", packages[count][1], packages[count][0]]));
    
    const folder = packages[count][0] === packages[count][2]
    ? path.resolve(__dirname, 'core', 'plugins', packages[count][0])
    : path.resolve(__dirname, 'core', 'plugins', packages[count][0], 'node_modules', packages[count][2]);
  
    const fix = await runFix(folder, packages[count][1]);
    fixInfo.push({plugin: packages[count][0], package: packages[count][1], result: fix});
    runVulnerabilityFix (packages, ++count, fixInfo, next);
}


/**
 * Initializes and returns an object containing various plugin-related functions.
 *
 * @returns {Promise<Object>} A promise that resolves to an object with the following properties:
 * - pluginVulnerabilityFix: Function to fix plugin vulnerabilities.
 * - pluginUpdatePackage: Function to update plugin packages.
 * - getInfoPackage: Function to get information about a package.
 * - auditPlugin: Function to audit a plugin.
 * - runAudit: Function to run an audit.
 */
async function init() {
    return {
        'pluginVulnerabilityFix': pluginVulnerabilityFix,
        'pluginUpdatePackage': pluginUpdatePackage,
        'getInfoPackage': getInfoPackage,
        'auditPlugin': auditPlugin,
        'runAudit': runAudit,
        'installPluginModules': installPluginModules
    }
}
  

/**
 * Initializes the report library.
 */
export { init };