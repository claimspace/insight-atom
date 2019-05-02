'use babel';

import { Emitter } from 'atom';

import LocalData from './local-data'
import GitClient from './git-client'

export default class LoginView {

  constructor (templates) {
    this.templates = templates;
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('insight-atom');

    this.render();
  }

  onComplete (callback) {
    this.emitter.on('complete', callback);
  }

  onCancel (callback) {
    this.emitter.on('cancel', callback);
  }

  onGitNotFound(callback) {
    this.emitter.on('git-not-found', callback);
  }

  render () {
    const author = LocalData.getAuthor();

    const ctx = {
      isLoggedIn: author != null,
      isNotLoggedIn: author == null,
      username: author && author.username
    }

    this.element.innerHTML = this.templates.login(ctx);

    this.username = this.element.querySelector('.Login-username');
    this.password = this.element.querySelector('.Login-password');
    this.submit = this.element.querySelector('.Login-submit');
    this.cancel = this.element.querySelector('.Login-cancel');

    this.submit.addEventListener('click', this.handleSubmit.bind(this))
    this.cancel.addEventListener('click', _ => this.emitter.emit('cancel'));
  }

  handleSubmit () {
    const onGitNotFound = _ => this.emitter.emit('git-not-found');

    GitClient.login(this.username.value, this.password.value, onGitNotFound).then(function (res) {
      LocalData.setAuthor({
        username: this.username.value,
        fullname: this.username.value,
        email: 'author+' + this.username.value + '@theinsight.cloud'
      });

      this.username.value = "";
      this.password.value = "";
      this.emitter.emit('complete');
    }.bind(this))
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
