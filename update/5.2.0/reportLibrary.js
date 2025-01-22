import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import * as path from 'node:path';
import { default as klawSync } from 'klaw-sync';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let pluginStudioWindow;

const initJsonPackage = (folder) => {
  return new Promise(async (resolve) => {
    if (fs.existsSync(path.resolve(folder, 'package.json'))) return resolve(true);

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `cd ${folder} && npm.cmd init -y --json && npm.cmd install --save` : `cd ${folder} && npm init -y --json && npm install --save`;
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
        error(L.get(["infos.standardError", 'init', stderr]));
        return resolve(false);
      }

      try {
        let packageJSON = fs.readJsonSync(path.resolve(folder, 'package.json'), {throws: true });
        delete packageJSON.main;
        packageJSON.type = "module";
        packageJSON.license = "mit";
        fs.writeJsonSync(path.resolve(folder, 'package.json'), packageJSON);
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


function runAudit (folder, option) {
  return new Promise(async (resolve) => {

      if (!await initJsonPackage(folder)) return resolve(false);

      const isWindows = process.platform === 'win32';
      const command = isWindows ? `cd ${folder} && npm.cmd ${option} --json` : `cd ${folder} && npm ${option} --json`;
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


function auditPlugin(win){

  pluginStudioWindow = win;   

  const filterFn = item => fs.existsSync(path.resolve(item.path, 'node_modules'));
  const directories = klawSync(path.resolve(__dirname, 'core', 'plugins'), {nofile: true, depthLimit: 0, filter: filterFn})

  let auditInfo = [], outdatedInfo = [];
  runAuditPlugin (directories, 0, auditInfo, outdatedInfo, () => {
    pluginStudioWindow.webContents.send('getAudit', {audit: auditInfo, outdated: outdatedInfo});
  })
}


function getCurrentPackageVersion (key) {
  return new Promise(async (resolve) => {

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `npm.cmd show ${key} version --json` : `npm show ${key} version --json`;
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
          error(L.get(["infos.standardError", option, stderr]));
          return resolve({});
      }

      try {
          const result = JSON.parse(stdout);
          if (result.version)
            resolve (result.version);
          else 
            resolve();
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


function getInfoPackage (arg) {
    return new Promise(async (resolve) => {
      if ( arg.plugin) pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.getCurrentPackageVersion", arg.package, arg.plugin]));
      const currentPackageVersion = await getCurrentPackageVersion(arg.package);
      if ( arg.plugin) pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.getUsedPackageVersion", arg.package, arg.plugin]));
      const usedPackageVersion = await getUsedPackageVersion(arg);
      resolve ({package: arg.package, used: usedPackageVersion, current: currentPackageVersion })
    })
}


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


async function runUpdatePackage (packages, count, fixInfo, next) {

    if (count === packages.length) return next();
    
    pluginStudioWindow.webContents.send('auditLabel', L.get(["pluginStudio.updateProgressLabel", packages[count][1], packages[count][0], packages[count][3]]));
    
    const folder = path.resolve(__dirname, 'core', 'plugins', packages[count][0])
    const fix = await runUpdate(folder, packages[count][1], packages[count][3]);
    fixInfo.push({plugin: packages[count][0], package: packages[count][1], result: fix});
    runUpdatePackage (packages, ++count, fixInfo, next);
}


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


function pluginUpdatePackage (packages) {
    let fixInfo = [];
    runUpdatePackage(packages, 0, fixInfo, () => {
      pluginStudioWindow.webContents.send('getUpdatePackageResult', fixInfo);
    });
}
  

function pluginVulnerabilityFix(packages){
    let fixInfo = [];
    packages = _.filter(packages, num => { return num[4] === `<span style="color:green">${L.get("infos.true")}</span>`; });
    runVulnerabilityFix (packages, 0, fixInfo, () => {
      pluginStudioWindow.webContents.send('getFixResult', fixInfo);
    });
  }
  
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


async function init() {
    return {
        'pluginVulnerabilityFix': pluginVulnerabilityFix,
        'pluginUpdatePackage': pluginUpdatePackage,
        'getInfoPackage': getInfoPackage,
        'auditPlugin': auditPlugin,
        'runAudit': runAudit
    }
}
  
// Exports
export { init };