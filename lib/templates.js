'use babel'

import path from 'path';
import fs from 'fs';
import hogan from 'hogan.js';

import Runtime from './runtime';

// These always need to be static up top, as dynamic
// requires are problematic with package loading...
const built = {
  error: require('../templates-build/error'),
  git: require('../templates-build/git'),
  login: require('../templates-build/login'),
  open: require('../templates-build/open'),
  subnet: require('../templates-build/subnet'),
  branch: require('../templates-build/branch'),
  home: require('../templates-build/home'),
  logo: require('../templates-build/logo')
}

export default class Templates {

  constructor () {
    const localRoot = Runtime.localPackageRoot();
    const isLocal = Runtime.isLocal();

    function compile (name) {
      if (isLocal) {
        return hogan.compile(
          fs.readFileSync(path.join(localRoot, 'templates', name + '.html'), {
            encoding: 'utf8'
          }));
      } else {
        return built[name];
      }
    }

    this._error = compile('error');
    this._git = compile('git');
    this._login = compile('login');
    this._open = compile('open');
    this._subnet = compile('subnet');
    this._branch = compile('branch');
    this._home = compile('home');
    this._logo = compile('logo')
  }

  open (ctx) {
    return this._open.render(ctx);
  }

  subnet (manifest) {
    return this._subnet.render(manifest, { branch: this._branch });
  }

  home (ctx) {
    return this._home.render(ctx, { logo: this._logo });
  }

  login (ctx) {
    return this._login.render(ctx);
  }

  error (ctx) {
    return this._error.render(ctx);
  }

  git () {
    return this._git.render();
  }

};
