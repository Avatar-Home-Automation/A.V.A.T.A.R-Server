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


function getInfoRepo(client, repos, user, projets, pos, count, win, callback) {

    if (count == projets.length) return getInfoRepos(client, repos, ++pos, win, callback)
  
    const repo = client.repo(user+'/'+projets[count].name);
    repo.contents(projets[count].name.replace('A.V.A.T.A.R-plugin-','')+'/assets/github/info.txt', async (err, data) => {
   
        if (err || !data) {
            projets[count].info = L.get("github.noDescription")
            return getInfoRepo(client, repos, user, projets, pos, ++count, win, callback)
        }
         
        const outputZip = path.resolve(__dirname, 'tmp/download')
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

                    let image_name = data[i].name.substring(14);
                    image_name = 'https://raw.githubusercontent.com/'+body.login+'/'+data[i].name+'/master/'+image_name+'/assets/images/'+image_name+'.png';
                   
                    infos.repos.push({
                      "login": body.login,
                      "name": data[i].name,
                      "real_name": data[i].name.replace('A.V.A.T.A.R-plugin-',''),
                      "description": data[i].description || "",
                      "exists": fs.existsSync(path.resolve(__dirname, 'core/plugins', data[i].name.replace('A.V.A.T.A.R-plugin-',''))),
                      "created_at": data[i].created_at,
                      "updated_at" : (Config.language === 'fr' ? moment(data[i].updated_at).format("DD-MM-YYYY") : moment(data[i].updated_at).format("YYYY-MM-DD")),
                      "download_url": data[i].downloads_url,
                      "image_url": image_name,
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
            fs.removeSync(path.resolve(__dirname, 'core/plugins', plugin.real_name));
            resolve(true)
        } catch(err) {
            error(L.get(["github.savePluginError", err]))
            resolve(false)
        }
    })
}


function installPlugin (plugin) {
    return new Promise(async (resolve) => { 
  
        let zipfileMaster = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-master')
        let zipfileMain = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-main')
        let zipfile = fs.existsSync(zipfileMaster) ? zipfileMaster : fs.existsSync(zipfileMain) ? zipfileMain : null;
        if (!zipfile) {
            error(L.get("github.unzipFolderError"));
            return resolve(false)
        }

        zipfile = path.resolve(zipfile,  plugin.real_name);
        let target = path.resolve(__dirname, 'core/plugins', plugin.real_name)

        // unzipped files with zip file
        if (fs.existsSync(zipfile+'.zip')) {
            try {
                await extract(zipfile+'.zip', {dir: zipfile});
                fs.removeSync(zipfile+'.zip');
                fs.copySync(zipfile, target)
                return resolve(true)
            } catch(err) {
                error(L.get("github.unzipInstallError"))
                return resolve(false)
            }
        } 

        // unzipped plugin folder exists
        if (fs.existsSync(zipfile)) { 
            fs.copySync(zipfile, target)
            fs.removeSync(zipfile);
            return resolve(true)
        } 

        // unzipped files without folder
        if (fs.existsSync(zipfile+'.js')) { 
            zipfile = path.resolve(__dirname, 'tmp/download', plugin.real_name, plugin.name+'-master');
            fs.copySync(zipfile, target)
            fs.removeSync(zipfile);
            return resolve(true)
        } 

        resolve(false);
        
    })
}


const checkUpdate = (win) => {

    return new Promise(async (resolve) => { 

        const client = octonode.client();
        if (!client) return resolve(false);
        const repo = client.repo(Config.repository);
        if (!repo) return resolve(false);

        repo.contents('update/newVersion.txt', async (err, data) => {

            if (err || !data || !data.download_url) return resolve(false);

            const outputZip = path.resolve(__dirname, 'tmp/download');
            fs.ensureDirSync(outputZip);

            try {
                await download(win, data.download_url, {
                    directory: outputZip,
                    showBadge: false,
                    showProgressBar: false,
                    filename: 'newVersion.txt',
                    overwrite: true
                })

                const newVersionFile = path.resolve(__dirname, 'tmp/download/newVersion.txt');
                const newVersion = fs.readFileSync(newVersionFile, 'utf8');
                fs.removeSync(newVersionFile);

                let newSplitVersion = newVersion.split('.');
                const currentVersion = Config.version.split('.');

                if (parseInt(currentVersion[0]) < parseInt(newSplitVersion[0])) {
                    return resolve(newVersion.trim());
                } else if (parseInt(currentVersion[0]) <= parseInt(newSplitVersion[0]) && parseInt(currentVersion[1]) < parseInt(newSplitVersion[1])) {
                    return resolve(newVersion.trim());
                } else if (parseInt(currentVersion[0]) <= parseInt(newSplitVersion[0]) && parseInt(currentVersion[1]) <= parseInt(newSplitVersion[1]) && parseInt(currentVersion[2]) < parseInt(newSplitVersion[2])) {
                    return resolve(newVersion.trim());
                }

                resolve(false);
                
            } catch (err) {
                error(L.get(["github.newVersion", err]));
                resolve(false);
            }
        })
    })
}

function initVar (arg) {
    safeStorage = arg;
}

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