'use babel'

import { Emitter } from 'atom';
import os from 'os';
import cp from 'child_process';
import {GitProcess} from 'dugite';
import request from 'request';

const ValidBranchNamePattern = /^[a-zA-Z0-9\ -]+$/
const BranchNameReplacementPattern = /[^a-zA-Z0-9-]/g
const DashDedupPattern = /(-){2,}/g
const BranchSuffixPattern = /-(wip|published|archived)-([0-9]+)$/;
const LoginPattern = 'could not read Username';

const Env = {
  Local: 'local',
  Prod: 'prod'
}

const State = {
  Wip: 'wip',
  Published: 'published',
  Archived: 'archived'
}

const out = function (res) {
  return res.stdout + res.stderr;
}

const debug = function () {
  if (true) console.log.apply(console, arguments)
}

/**
 *
 */
export default class GitClient {

  /**
   *
   */
  static initialize () {
    try {
      const execPath = cp.execSync('git --exec-path', {encoding: 'utf8'}).trim();
      process.env.GIT_EXEC_PATH = execPath;

      debug('Setting GIT_EXEC_PATH', execPath);

      return true;
    } catch (e) {
      debug('Error during initialization', e)
      return false;
    }
  }

  /**
   *
   */
  static isValidBranchName (name) {
    return name.match(ValidBranchNamePattern) != null;
  }

  /**
   *
   */
  static suffix (state) {
    return `-${state}-${Date.now()}`;
  }

  /**
   *
   */
  static stateChange (name, state) {
    return name.replace(BranchSuffixPattern, '') + GitClient.suffix(state);
  }

  /**
   *
   */
  static normalize (name) {
    return (
      name
        .replace(BranchNameReplacementPattern, '-')
        .replace(DashDedupPattern, '-'));
  }

  /**
   *
   */
  static parseBranch (rawName) {
    let isActive = rawName.indexOf('*') == 0;
    let name = rawName.slice(2);

    let prettyName = null;
    let date = null;
    let state = null;

    if (name == 'master') {
      return {
        name: 'master',
        prettyName: 'Live',
        isMaster: true,
        isWip: false,
        isPublished: false,
        isArchived: false,
        isActive: isActive,
        canOpen: !isActive,
        canUpdate: true,
        canArchive: false,
        canDelete: false,
        date: new Date(Date.now())
      }
    } else {
      let matched = name.match(BranchSuffixPattern);

      if (!matched) {
        prettyName = name;
        state = State.Wip;
        date = Date.now();
      } else {
        prettyName = name.replace(BranchSuffixPattern, '').replace(/-/g, ' ');
        state = matched[1];
        date = new Date(parseInt(matched[2]));
      }

      let isWip = state == State.Wip;
      let isPublished = state == State.Published;
      let isArchived = state == State.Archived;

      return {
        name: name,
        prettyName, prettyName,
        isMaster: false,
        isWip: isWip,
        isPublished: isPublished,
        isArchived: isArchived,
        isActive: isActive,
        canUpdate: isWip,
        canOpen: !isActive,
        canArchive: !isArchived,
        canDelete: (isPublished || isArchived) && !isActive,
        date: date
      }
    }
  }

  /**
   *
   */
  static login (username, password, onGitNotFound) {

    if (!GitClient.initialize()) {
      onGitNotFound();
      return Promise.resolve();
    }

    // tmp
    const DefaultPath = os.userInfo().homedir;

    // git config --global --add credential.helper osxkeychain
    // also, user.name, user.email... though maybe this should
    // be stored in atom config and set locally on clone?

/*

git credential approve
host=source.theinsight.cloud
protocol=https
username=
password=

*/

    const stdin = [
      'host=source.theinsight.cloud',
      'protocol=https',
      `username=${username}`,
      `password=${password}`,
      '\n'
    ].join('\n');

    debug('Login', stdin.replace(password, '******'));

    return new Promise(function (resolve, reject) {
      GitProcess.exec(['credential', 'approve'], DefaultPath, { stdin: stdin }).then(function (res) {
        debug(res);
        resolve(res);
      });
    });
  }

  /**
   *
   */
  static clone (subnetId, location, auth, gitNotFound) {

    if (!GitClient.initialize()) {
      gitNotFound();
      return Promise.resolve();
    }

    // tmp
    const DefaultPath = os.userInfo().homedir;

    const remoteUrl = `https://source.theinsight.cloud/${subnetId}.git`;

    debug('GitClient.clone', `${subnetId} ${location}`);

    return new Promise(function (resolve, reject) {
      GitProcess.exec([ 'clone', remoteUrl, location ], DefaultPath).then(function (res) {
        debug(res)

        if (res.exitCode == 0) {
          resolve(new GitClient(location));
        } else {
          if (res.stderr.indexOf(LoginPattern) > -1) {
            auth();
          } else {
            reject(out(res))
          }
        }
      });
    })
  }

  /**
   *
   */
  constructor (path) {
    this.path = path;
    this.emitter = new Emitter()
    this.env  = this.getEnv();
  }

  destroy () {
    this.emitter.dispose();
  }

  /**
   *
   */
  onAuthError (callback) {
    this.emitter.on('auth-error', callback);
  }

  /**
   *
   */
  onGitNotFound (callback) {
    this.emitter.on('git-not-found', callback);
  }

  /**
   *
   */
  exec (args) {
    debug('GitClient.exec: ', args.join(' '));
    const git = this;

    if (!GitClient.initialize()) {
      this.emitter.emit('git-not-found');
      return Promise.reject();
    }

    return new Promise(function (resolve, reject) {
      GitProcess.exec(args, git.path).then(function (res) {
        debug(res)

        if (res.stderr.indexOf(LoginPattern) > -1) {
          git.emitter.emit('auth-error');
          reject(out(res));
        } else {
          resolve(res);
        }
      });
    });
  }

  setUserDetails ({username, email} = {}) {
    return this.exec(['config', 'user.name', username]).then(
      _ => this.exec(['config', 'user.email', email]))
  }

  getRemoteUrl () {
    return this.exec(['config', 'remote.origin.url']).then(_ => _.stdout.trim())
  }

  getEnv () {
    return this.getRemoteUrl().then(_ => _.indexOf('/') == 0 ? Env.Local : Env.Prod);
  }

  getPreviewUrl (subnetId, rev) {
    return this.env.then(function (env) {
      if (env == Env.Local) {
        return `http://staging-${subnetId}-${rev}.local.theinsight.cloud:9000/${subnetId}`;
      } else {
        return `https://staging-${subnetId}-${rev}.theinsight.cloud/${subnetId}`;
      }
    });
  }

  getLiveUrl (subnetId) {
    return this.env.then(function (env) {
      if (env == Env.Local) {
        return `http://local.theinsight.cloud:9000/${subnetId}`;
      } else {
        return `https://theinsight.cloud/${subnetId}`;
      }
    });
  }

  /**
   *
   */
  checkout (branch) {
    return this.exec(['checkout', branch]);
  }

  /**
   *
   */
  rename (from, to) {
    return this.exec(['branch', '-m', from, to])
  }

  /**
   *
   */
  commitAll (message='Saving changes') {
    return this.exec(['add', '.']).then(_ => this.exec(['commit', '-m', message]))
  }

  /**
   *
   */
  create (rawName) {
    const git = this;
    const name = GitClient.normalize(rawName) + GitClient.suffix(State.Wip);

    return git.getBranches().then(function (branches) {
      let commit = Promise.resolve();

      if (!branches.active.isMaster) {
        commit =
          git
            .commitAll('Saving changes before creating branch ' + name)
            .then(_ => git.checkout('master'))
      }

      return commit.then(_ => git.exec(['checkout', '-b', name]));
    });
  }

  /**
   *
   */
  saveActive (message='Saving current workspace') {
    const git = this;

    return git.exec(['status']).then(function (res) {
      const branchLine = res.stdout.split('\n')[0];
      const branchMatch = branchLine.match(/^On branch (.+)$/)
      const branch = branchMatch && branchMatch.length && branchMatch[1];

      if (!branchMatch || !branch) {
        return Promise.reject('Unexpected `git branch` output:\n' + out(res));
      } else {
        const isClean = res.stdout.indexOf('nothing to commit') > -1;

        if (branch == 'master' && !isClean) {
          return Promise.reject('You have unsaved changes to the live version. Please create a new version for your changes.');
        } else {
          let commit = Promise.resolve();

          if (!isClean) {
            commit = git.commitAll(message)
          }

          return commit.then(_ => branch);
        }
      }
    });
  }

  /**
   *
   */
  open (branch) {
    return this.saveActive().then(_ => this.checkout(branch));
  }

  /**
   *
   */
  getRev () {
    return this.exec(['rev-parse', '--short', 'HEAD']).then(_ => _.stdout.trim());
  }

  /**
   *
   */
  preview (subnetId) {
    const git = this;

    return (
      this.saveActive()
        .then(branch => git.exec(['push', 'origin', branch]))
        .then(_ => git.getRev())
        .then(_ => git.getPreviewUrl(subnetId, _)));
  }

  /**
   *
   */
  archive (branch) {
    // to be safe
    if (branch == 'master') return;

    const newName = GitClient.stateChange(branch, State.Archived);

    return this.saveActive().then(_ => this.rename(branch, newName));
  }

  /**
   *
   */
  delete (branch) {
    if (branch == 'master') return;

    return this.saveActive().then(_ =>
      this
        .exec(['branch', '-D', branch])
        .then(function (res) {
          if (out(res).indexOf('Cannot delete branch') > -1) {
            return Promise.reject(out(res))
          } else {
            return Promise.resolve(branch);
          }
        }));
  }

  /**
   *
   */
  update () {
    const git = this;
    return this.saveActive().then(function (branch) {
      if (branch == 'master') {
        return git.pullMaster();
      } else {
        return git
          .checkout('master')
          .then(_ => git.pullMaster())
          .then(_ => git.checkout(branch))
          .then(_ => git.mergeMaster())
        }
    });
  }

  /**
   *
   */
  push (branch) {
    return this.exec(['push', 'origin', branch]);
  }

  /**
   *
   */
  pullMaster () {
    return this.exec(['pull', 'origin', 'master']);
  }

  /**
   *
   */
  mergeMaster () {
    return this.exec(['merge', 'origin/master']);
  }

  /**
   *
   */
  publish (subnetId) {
    const git = this;
    return (
      this.saveActive().then(function (branch) {
        const publishedName = GitClient.stateChange(branch, State.Published);
        return git
          .push(branch)
          .then(_ => git.getRev())
          .then(_ => git.submitRevApi(subnetId, _))
          .then(_ => git.rename(branch, publishedName))
          .then(_ => git.checkout('master'))
          .then(_ => git.pullMaster())
          .then(_ => git.getLiveUrl(subnetId))
      }));
  }

  /**
   *
   */
  submitRevApi (subnetId, rev) {
    const git = this;

    return new Promise(function (resolve, reject) {
      git.env.then(function (env) {
        const host = (env == Env.Local) ?
          'http://local.theinsight.cloud:9000' : 'https://theinsight.cloud'

        const uri = `${host}/${subnetId}/submit/${rev}/json`;

        debug('POST ' + uri);

        request.post(uri, function (err, res, body) {
          const json = JSON.parse(body);

          if (json.status == 'success') {
            debug('submitRevApi success: ', json);
            resolve();
          } else {
            debug('submitRevApi error: ', json);
            reject(json);
          }
        });
      }, reject);
    });
  }

  /**
   *
   */
  getBranches () {
    function dateSort (a, b) {
      return b.date - a.date;
    }

    return this.exec(['branch']).then(function (res) {
      let ret = {
        master: null,
        active: null,
        open: [],
        published: [],
        archived: [],
        all: {}
      }

      res.stdout.split('\n').forEach(function (raw) {
        if (raw == '') return;

        let branch = GitClient.parseBranch(raw);

        if (branch.isActive) {
          ret.active = branch;
        }

        if (branch.isMaster) {
          ret.master = branch;
        } else if (branch.isPublished) {
          ret.published.push(branch);
        } else if (branch.isArchived) {
          ret.archived.push(branch);
        } else {
          ret.open.push(branch);
        }

        ret.all[branch.name] = branch;
      });

      // TODO
      ret.open.sort(dateSort).unshift(ret.master);
      ret.published.sort(dateSort)
      ret.archived.sort(dateSort)

      return ret;
    });
  }

}
