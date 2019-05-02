'use babel';

import os from 'os';
import path from 'path';
import fs from 'fs';

import { Emitter } from 'atom';

import LocalData from './local-data';
import GitClient from './git-client';

export default class OpenProjectView {

  constructor (templates) {
    this.templates = templates;
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('insight-atom');

    this.element.addEventListener('click', function (ev) {
      let existing = null;
      let el = ev.target;

      while (existing == null && el != this.element) {
        if (el.classList.contains('Existing')) {
          existing = el;
        } else {
          el = el.parentElement;
        }
      }

      if (existing) {
        this.open(existing.attributes['data-location'].value);
      }
    }.bind(this))
  }

  onOpen (callback) {
    this.emitter.on('open', callback);
  }

  onCancel (callback) {
    this.emitter.on('cancel', callback);
  }

  onAuthError (callback) {
    this.emitter.on('auth-error', callback);
  }

  onGitNotFound(callback) {
    this.emitter.on('git-not-found', callback);
  }

  render () {
    const existing = LocalData.getProjects();

    const ctx = {
      existing: existing,
      hasExisting: existing.length > 0
    }

    this.element.innerHTML = this.templates.open(ctx);

    this.subnetIdEl = this.element.querySelector('.OpenProject-subnetId');
    this.submitEl   = this.element.querySelector('.OpenProject-submit');
    this.cancelEl   = this.element.querySelector('.OpenProject-cancel');

    this.progressEl     = this.element.querySelector('.OpenProject-progress');
    this.errorEl        = this.element.querySelector('.OpenProject-error');
    this.errorContentEl = this.element.querySelector('.OpenProject-errorContent pre');

    this.submitEl.addEventListener('click', this.handleSubmit.bind(this));
    this.cancelEl.addEventListener('click', this.handleCancel.bind(this));
  }

  handleCancel () {
    this.reset();
    this.emitter.emit('cancel');
  }

  reset () {
    this.subnetIdEl.value = '';
    this.progressEl.classList.remove('shown');
    this.errorEl.classList.remove('shown');
  }

  handleSubmit () {
    this.errorEl.classList.remove('shown');
    this.progressEl.classList.add('shown');

    const subnetId = this.subnetIdEl.value.replace('$', '');
    const preferred = path.join(LocalData.getLocation(), subnetId);
    let location = preferred;

    for (var i = 1; fs.existsSync(location); i++) {
      // this.open(location);
      // return
      // Disable duplication for now
      location = preferred + i;
    }

    const auth = _ => {
      this.emitter.emit('auth-error');
      this.reset();
    };

    const gitNotFound = _ => {
      this.emitter.emit('git-not-found');
      this.reset();
    }

    GitClient.clone(subnetId, location, auth, gitNotFound)
      .then(git => git.setUserDetails(LocalData.getAuthor()))
      .then(_ => this.open(location), function (err) {
        this.errorContentEl.innerHTML = err;
        this.progressEl.classList.remove('shown');
        this.errorEl.classList.add('shown');
      }.bind(this));
  }

  open (location) {
    this.reset();
    this.emitter.emit('open', location);
  }

  serialize () {}

  destroy () {
    this.emitter.dispose();
    this.element.remove();
  }

  getElement () {
    return this.element;
  }

}
