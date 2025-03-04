import { default as octonode } from './lib/octonode/octonode.js';
import fs from 'fs-extra';
import _ from 'underscore';
import {download} from 'electron-dl';
import * as path from 'node:path';
import moment from 'moment';
import {default as extract} from 'extract-zip';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// internal
let safeStorage;

function applyParameters(arg) {
    return new Promise(async (resolve) => {
        try {
            if (arg.isRemember === false && fs.existsSync(path.resolve (__dirname, 'lib/github/github.json')))
                fs.removeSync(path.resolve(__dirname, 'lib/github/github.json'));

            if (arg.contributors.length > 0) {
                fs.writeJsonSync(path.resolve (__dirname, 'lib/github/contributors.json'), arg.contributors)
            } else {
                fs.removeSync(path.resolve(__dirname, 'lib/github/contributors.json'));
            }
            resolve(true)
        } catch(err) {
            resolve(false)
        }
    })
}


function isRememberMe() {
    return new Promise(function (resolve) {
        let remember =  fs.readJsonSync(path.resolve (__dirname, 'lib/github/github.json'), { throws: false })
        resolve (remember ? true : false)
    })
}


function getSelectedContributors() {
    return new Promise(function (resolve) {
        let contributors =  fs.readJsonSync(path.resolve (__dirname, 'lib/github/contributors.json'), { throws: false });
        resolve (contributors);
    })
}


function getlogin() {
    return new Promise(function (resolve) {
        const login =  fs.readJsonSync(path.resolve (__dirname, 'lib/github/github.json'), { throws: false })
        if (login) {
             var decrypted;
             if (safeStorage.isEncryptionAvailable() && login.encrypted === true) {
                const encrypted = Buffer.from(login.password);
                decrypted = safeStorage.decryptString(encrypted);
             } else {
                decrypted = login.password;
             }
            resolve ({username: login.username, password: decrypted});
        } else {
            resolve ();
        }
    })
}


function savelogin(arg) {
    return new Promise(function (resolve) {
        var encrypted
        if (arg.encrypted === true) {
            if (!safeStorage.isEncryptionAvailable()) return resolve (false)
            encrypted = safeStorage.encryptString(arg.password)
            encrypted = encrypted.toJSON()
        } else {
            encrypted = {data: arg.password}
        }

        const login = {username: arg.username, password: encrypted.data, encrypted: arg.encrypted};
        const file = path.resolve(__dirname, 'lib/github/github.json');
        fs.ensureDirSync(path.resolve(__dirname, 'lib', 'github'));
        fs.writeJsonSync(file, login);
        resolve (true);
    })
}


function getContributors(login, client, win) {

    return new Promise(function (resolve) {

        let users = [login.username];
        let repo = client.repo(Config.repository);

        repo.contents('assets/contributors.json', async (err, data) => {

            if (err || !data) resolve (users)

            let outputZip = path.resolve(__dirname, 'tmp/download')
            fs.ensureDirSync(outputZip)
            try {
                await download(win, data.download_url, {
                    directory: outputZip,
                    showBadge: false,
                    showProgressBar: false,
                    filename: 'contributors.json',
                    overwrite: true
                })

                let contributorsFile = path.resolve(__dirname, 'tmp/download/contributors.json');
                let projects = fs.readJsonSync(contributorsFile, { throws: false });
                fs.removeSync(contributorsFile);
                
                _.each(projects.contributors, (contributor) => {
                    if (contributor.toLowerCase() !== login.username.toLowerCase()) 
                        users.push(contributor);
                });

                if (fs.existsSync(path.resolve(__dirname, 'lib/github/contributors.json'))) {
                    let contribs = fs.readJsonSync(path.resolve(__dirname, 'lib/github/contributors.json'), { throws: false });
                    users = _.difference(users, contribs);
                }
                return resolve(users);

            } catch (err) {
                error(L.get(["github.getcontributorError", err]))
                return resolve(users)
            }
        })
    })
}


function getContributorsInfoRepos (client, repos, win) {
    return new Promise(function (resolve) {
        getInfoRepos(client, repos, 0, win, (repos) => {
            resolve(repos)
        })
    })
}


function getInfoRepos(client, repos, pos, win, callback) {
    if (pos == repos.length) return callback(repos)
    getInfoRepo(client, repos, repos[pos].login, repos[pos].repos, pos, 0, win, callback)
}


function getPluginVersion(repo, projets, count, win) {
    return new Promise(function (resolve) {
        const plugin = projets[count].name.replace('A.V.A.T.A.R-plugin-','');
        repo.contents(plugin+`/${plugin}.prop`, async (err, data) => {
            if (err || !data) {
                resolve(false);
            }

            const outputZip = path.resolve(__dirname, 'tmp/download');
            fs.ensureDirSync(outputZip);
            try {
                await download(win, data.download_url, {
                    directory: outputZip,
                    showBadge: false,
                    showProgressBar: false,
                    filename: `${plugin}.prop`,
                    overwrite: true
                })

                const infoFile = path.resolve(__dirname, `tmp/download/${plugin}.prop`)
                let version;
                if (fs.existsSync(infoFile)) {
                    const pluginProp = fs.readJsonSync(infoFile, { throws: true });
                    version = pluginProp.modules[plugin].version || false;
                    fs.removeSync(infoFile)
                } else {
                    version = false;
                }
                resolve(version);

            } catch (err) {
                resolve(false);
            }
        })
    })    
}


function getInfoRepo(client, repos, user, projets, pos, count, win, callback) {

    if (count == projets.length) return getInfoRepos(client, repos, ++pos, win, callback)
  
    const repo = client.repo(user+'/'+projets[count].name);
    repo.contents(projets[count].name.replace('A.V.A.T.A.R-plugin-','')+'/assets/github/info.txt', async (err, data) => {

        projets[count].version = await getPluginVersion(repo, projets, count, win)
   
        if (err || !data) {
            projets[count].info = L.get("github.noDescription")
            return getInfoRepo(client, repos, user, projets, pos, ++count, win, callback)
        }
        
        const outputZip = path.resolve(__dirname, 'tmp/download');
        fs.ensureDirSync(outputZip);
        try {
            await download(win, data.download_url, {
                directory: outputZip,
                showBadge: false,
                showProgressBar: false,
                filename: 'info.txt',
                overwrite: true
            })

            const infoFile = path.resolve(__dirname, 'tmp/download/info.txt')
            if (fs.existsSync(infoFile)) {
                let text = fs.readFileSync(infoFile, 'utf8')
                text = text.replace(/\n|\r/g,"<br>")
                projets[count].info = text
                projets[count].noInfo = false
                fs.removeSync(infoFile)
            } else {
                projets[count].info = L.get("github.noDescription")
                projets[count].noInfo = true
            }

            return getInfoRepo(client, repos, user, projets, pos, ++count, win, callback)

        } catch (err) {
            error(L.get(["github.searchInfoPages", err]))
            getInfoRepo(client, repos, user, projets, pos, ++count, win, callback)
        }
    })
}


function getContributorsRepos (client, contributors, pos, repos) {

    return new Promise(function (resolve) {
        getRepos (client, contributors, pos, repos, (repos) => {
            resolve(repos)
        })
    })

}


function getRepos (client, contributors, pos, repos, callback) {

    if (pos === contributors.length) return callback(repos)
  
    client.get('/users/'+contributors[pos], {}, function (err, status, body) {
  
        if (err || status !== 200) {
          error(L.get(["github.searchUser", contributors[pos], err]))
          return getRepos (client, contributors, ++pos, repos, callback)
        }
  
        let infos = {
          "login": body.login,
          "name": body.name || body.login,
          "avatar": body.avatar_url,
          "member_since": (Config.language === 'fr' ? moment(body.created_at).format("DD-MM-YYYY") : moment(body.created_at).format("YYYY-MM-DD")),
          "last_commit": (Config.language === 'fr' ? moment(body.updated_at).format("DD-MM-YYYY") : moment(body.updated_at).format("YYYY-MM-DD")),
          "url": body.url,
          "repos" : [],
          "index" : repos.length || 0
        };
  
        let ghuser = client.user(body.login)
        ghuser.repos(async function(err, data, headers) {
            if (data && data.length > 0) {
                let flagRepo = false
                for (var i=0; i < data.length; i++) {
                  if (data[i].name.indexOf('A.V.A.T.A.R-plugin-') !== -1 && !data[i].name.private) {
                    if (!flagRepo) {
                        repos.push(infos)
                        flagRepo = true
                    }

                    let image_name = data[i].name.substring(19);
                    image_name = 'https://raw.githubusercontent.com/'+body.login+'/'+data[i].name+'/master/'+image_name+'/assets/images/'+image_name+'.png';
                   
                    const plugin = path.resolve(__dirname, 'core/plugins', data[i].name.replace('A.V.A.T.A.R-plugin-',''));
                    const pluginProp = plugin+`/${data[i].name.replace('A.V.A.T.A.R-plugin-','')}.prop`
                    let pluginVersion = false;
                    if (fs.existsSync(pluginProp)) {
                        const pluginProperty = fs.readJsonSync(pluginProp, { throws: false });
                        if (pluginProperty) {
                            pluginVersion = pluginProperty.modules[data[i].name.replace('A.V.A.T.A.R-plugin-','')].version || false;
                        }
                    }

                    infos.repos.push({
                      "login": body.login,
                      "name": data[i].name,
                      "real_name": data[i].name.replace('A.V.A.T.A.R-plugin-',''),
                      "description": data[i].description || "",
                      "exists": fs.existsSync(plugin),
                      "created_at": data[i].created_at,
                      "updated_at" : (Config.language === 'fr' ? moment(data[i].updated_at).format("DD-MM-YYYY") : moment(data[i].updated_at).format("YYYY-MM-DD")),
                      "download_url": data[i].downloads_url,
                      "image_url": image_name,
                      "currentVersion": pluginVersion,
                      "stargazers": data[i].stargazers_count || 0
                    })
                  }
                  if ((i+1) === data.length) getRepos(client, contributors, ++pos, repos, callback)
                }
            } else {
                getRepos(client, contributors, ++pos, repos, callback)
            }
        })
    })
}


async function getConnexion(login) {
    return new Promise(async (resolve) => { 
        let client = octonode.client({
            username: login.username,
            password: login.password
        })
        resolve (client ? client : null)
    })
}


function testConnexion(login) {
    return new Promise(async (resolve) => { 
        let client = await getConnexion(login)
        if (client) {
            client.get('/user', {}, function (err, status, body, headers) {
                resolve (body ? true : false)
            })
        } else {
            resolve (false)
        }
    })
}


function downloadArchive(win, plugin) {
    return new Promise(async (resolve) => { 
        let url = 'https:/github.com/'+plugin.login+'/'+plugin.name+'/archive/master.zip'
        let outputZip = path.resolve(__dirname, 'tmp/download')
        fs.ensureDirSync(outputZip);
        fs.removeSync(path.resolve (outputZip, plugin.name+"-master.zip"))
        try {
            await download(win, url, {directory: outputZip})
            resolve(true)
        } catch(err) { 
            error(L.get(["github.downloadPluginError", err]))
            resolve(false)
        }
    })
}


function unzipArchive(plugin) {
    return new Promise(async (resolve) => { 
        let outputZip = path.resolve(__dirname, 'tmp/download')
        let zipfileMaster = path.resolve(outputZip, plugin.name+"-master.zip")
        let zipfileMain = path.resolve(outputZip, plugin.name+"-main.zip")
        let zipfile = fs.existsSync(zipfileMaster) ? zipfileMaster : fs.existsSync(zipfileMain) ? zipfileMain : null;

        if (!zipfile) {
            error(L.get("github.unzipFileError"));
            return resolve(false)
        }
 
        let target = path.resolve(outputZip, plugin.real_name)
        fs.removeSync(target)
        try {
            await extract(zipfile, {dir: target})
            fs.removeSync(zipfile)
            resolve(true)
        } catch(err) {
            error(L.get("github.unzipFileError")+" "+err)
            resolve(false)
        }
    })
}


async function saveExistingPlugin(plugin) {
    return new Promise(async (resolve) => { 
        try {
            const date = Config.language === 'fr' ? moment().format("DD.MM.YYYY-HH.mm.ss") : moment().format("YYYY.MM.DD-HH.mm.ss");
            fs.ensureDirSync(path.resolve(__dirname, 'save'));
            fs.copySync(path.resolve(__dirname, 'core/plugins', plugin.real_name), path.resolve(__dirname, 'save', plugin.real_name+'-'+date))
            resolve(true);
        } catch(err) {
            error(L.get(["github.savePluginError", err]))
            resolve(false)
        }
    })
}



/**
 * Merges properties from the source object into the target object.
 * 
 * - If a property is an array in either the target or source, the source property will replace the target property.
 * - If both properties are objects, they will be merged recursively.
 * - Primitive types in the source will replace those in the target.
 * - The "version" property in the source will be ignored.
 * 
 * @param {Object} target - The target object to merge properties into.
 * @param {Object} source - The source object from which properties are merged.
 */
function mergeObjects(target, source) {
    for (const key in source) {
      if (key === "version") continue;
  
      if (target.hasOwnProperty(key)) {
        // Si l'une des valeurs est un tableau, on remplace la valeur
        if (Array.isArray(target[key]) || Array.isArray(source[key])) {
          target[key] = source[key];
        }
        // Si les deux valeurs sont des objets, on fusionne récursivement
        else if (
          typeof target[key] === "object" && target[key] !== null &&
          typeof source[key] === "object" && source[key] !== null
        ) {
          mergeObjects(target[key], source[key]);
        }
        // Sinon, on remplace simplement la valeur (pour des types primitifs, par exemple)
        else {
          target[key] = source[key];
        }
      } 
      // Si la clé n'existe pas dans target
      else {
        // on ajoute la clé à target.
        target[key] = source[key];
      }
    }
}



/**
 * Merges properties from a source file into a target file at a specified level.
 *
 * @param {string} targetFile - The path to the target file.
 * @param {string} sourceFile - The path to the source file.
 * @param {string} plugin - The name of the plugin whose properties are to be merged.
 * @returns {Promise<void>} A promise that resolves when the merge is complete.
 */
function mergeAtLevel(targetFile, sourceFile, plugin) {

    return new Promise(async (resolve) => { 

        if (fs.existsSync(path.resolve(sourceFile, `${plugin}.prop`)) && 
            fs.existsSync(path.resolve(targetFile, `${plugin}.prop`))) {

            let target =  fs.readJsonSync(path.resolve(targetFile, `${plugin}.prop`), { throws: false });
            const source =  fs.readJsonSync(path.resolve(sourceFile, `${plugin}.prop`), { throws: false });
        
            if (!target || !source) {
                resolve();
                return;
            }
            // Merge Objects
            mergeObjects(target, source);
            // Sauvegarde du fichier fusionné
            fs.writeJsonSync(path.resolve(targetFile, `${plugin}.prop`), target, { spaces: 2 });
        }

        resolve();
    })
}


/**
 * Installs a plugin by extracting and copying its files to the target directory.
 *
 * @param {Object} plugin - The plugin object containing details about the plugin.
 * @param {string} plugin.real_name - The real name of the plugin.
 * @param {string} plugin.name - The name of the plugin.
 * @returns {Promise<boolean>} - A promise that resolves to true if the plugin was successfully installed, otherwise false.
 */
function installPlugin (plugin) {
    return new Promise(async (resolve) => { 
  
        const zipfileMaster = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-master');
        const zipfileMain = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-main');
        let zipfile = fs.existsSync(zipfileMaster) ? zipfileMaster : fs.existsSync(zipfileMain) ? zipfileMain : null;
        if (!zipfile) {
            error(L.get("github.unzipFolderError"));
            return resolve(false)
        }

        zipfile = path.resolve(zipfile,  plugin.real_name);
        const target = path.resolve(__dirname, 'core/plugins', plugin.real_name);

        // unzipped files with zip file
        if (fs.existsSync(zipfile+'.zip')) {
            try {
                await extract(zipfile+'.zip', {dir: zipfile});
                fs.removeSync(zipfile+'.zip');

                await mergeAtLevel(zipfile, target, plugin.real_name);
                fs.removeSync(target);

                fs.copySync(zipfile, target);
                return resolve(true);
            } catch(err) {
                error(L.get("github.unzipInstallError"))
                return resolve(false);
            }
        } 

        // unzipped plugin folder exists
        if (fs.existsSync(zipfile)) { 
            await mergeAtLevel(zipfile, target, plugin.real_name);
            fs.removeSync(target);
            fs.copySync(zipfile, target);
            fs.removeSync(zipfile);
            return resolve(true);
        } 

        // unzipped files without folder
        if (fs.existsSync(zipfile+'.js')) { 
            zipfile = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-master');
            await mergeAtLevel(zipfile, target, plugin.real_name);
            fs.removeSync(target);
            fs.copySync(zipfile, target);
            fs.removeSync(zipfile);
            return resolve(true);
        } 

        resolve(false);
        
    })
}


/**
 * Compares the current version with a list of new versions and resolves with the first new version that is greater than the current version.
 *
 * @param {string} currentVersion - The current version in the format 'x.x.x'.
 * @param {string[]} newVersions - An array of new versions to compare against the current version.
 * @returns {Promise<string|boolean>} - A promise that resolves with the first new version that is greater than the current version, or false if no new version is greater.
 */
const checkUpdateVersions = (currentVersion, newVersions) => {
    return new Promise((resolve) => {
        newVersions.some(newVersion => {
            let splitNewVersion = newVersion.split('.').map(Number);
            let splitCurrentVersion = currentVersion.map(Number);

            for (let i = 0; i < splitNewVersion.length; i++) {
                if (splitCurrentVersion[i] < splitNewVersion[i]) {
                    return resolve(newVersion.trim());
                } else if (splitCurrentVersion[i] > splitNewVersion[i]) {
                    break;
                }
            }
        });

        return resolve(false);
    });
}


/**
 * Checks for updates by comparing the current version with the version available in the repository.
 *
 * @param {Object} win - The window object.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether an update is available.
 */
const checkUpdate = win => {
    return new Promise(async (resolve) => { 

        const client = octonode.client();
        if (!client) return resolve(false);
        const repo = client.repo(Config.repository);
        if (!repo) return resolve(false);

        repo.contents('update/updateVersion.json', async (err, data) => {

            if (err || !data || !data.download_url) return resolve(false);

            const outputZip = path.resolve(__dirname, 'tmp/download');
            fs.ensureDirSync(outputZip);

            try {
                await download(win, data.download_url, {
                    directory: outputZip,
                    showBadge: false,
                    showProgressBar: false,
                    filename: 'updateVersion.json',
                    overwrite: true
                })
    
                const newVersionFile = path.resolve(__dirname, 'tmp/download/updateVersion.json');
                const newVersion = fs.readJsonSync(newVersionFile, { throws: true });
                const currentVersion = Config.version.split('.');
                resolve (await checkUpdateVersions (currentVersion, newVersion.versions));
            } catch (err) {
                error(L.get(["github.newVersion", err]));
                resolve(false);
            }   
        })
    })
}


/**
 * Initializes the safeStorage variable with the provided argument.
 *
 * @param {*} arg - The value to be assigned to safeStorage.
 */
function initVar (arg) {
    safeStorage = arg;
}


/**
 * Initializes and returns an object containing various functions related to GitHub repository management.
 *
 * @returns {Promise<Object>} A promise that resolves to an object with the following properties:
 * - getlogin: Function to get login information.
 * - getConnexion: Function to get connection details.
 * - getContributors: Function to get contributors of a repository.
 * - getContributorsRepos: Function to get repositories of contributors.
 * - getContributorsInfoRepos: Function to get detailed information about contributors' repositories.
 * - savelogin: Function to save login information.
 * - testConnexion: Function to test the connection.
 * - downloadArchive: Function to download an archive from a repository.
 * - unzipArchive: Function to unzip a downloaded archive.
 * - saveExistingPlugin: Function to save an existing plugin.
 * - installPlugin: Function to install a plugin.
 * - getSelectedContributors: Function to get selected contributors.
 * - isRememberMe: Function to check if the "Remember Me" option is enabled.
 * - applyParameters: Function to apply parameters.
 * - checkUpdate: Function to check for updates.
 * - initVar: Function to initialize variables.
 */
async function init() {
    return {
        'getlogin': getlogin,
        'getConnexion': getConnexion,
        'getContributors': getContributors,
        'getContributorsRepos': getContributorsRepos,
        'getContributorsInfoRepos': getContributorsInfoRepos,
        'savelogin': savelogin,
        'testConnexion': testConnexion,
        'downloadArchive': downloadArchive,
        'unzipArchive': unzipArchive,
        'saveExistingPlugin': saveExistingPlugin,
        'installPlugin': installPlugin,
        'getSelectedContributors': getSelectedContributors,
        'isRememberMe': isRememberMe,
        'applyParameters': applyParameters,
        'checkUpdate': checkUpdate,
        'initVar': initVar
    }
}
  
// Exports
export { init };