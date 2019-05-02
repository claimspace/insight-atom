'use babel';

import path from 'path';
import { Emitter } from 'atom';

import LocalData from './local-data'

export default class HomeView {

  constructor (templates) {
    this.templates = templates;

    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('insight-atom');
    this.element.classList.add('insight-atom-sidebar');

    this.render()

    this.element.addEventListener('click', function (ev) {
      const classList = ev.target.classList;

      if (classList.contains('HomeAction-login')) {
        this.emitter.emit('login-click');
      } else if (classList.contains('HomeAction-openProject')) {
        this.emitter.emit('open-project-click')
      }

    }.bind(this));
  }

  onLoginClick (callback) {
    this.emitter.on('login-click', callback);
  }

  onOpenProjectClick (callback) {
    this.emitter.on('open-project-click', callback);
  }

  render () {
    const author = LocalData.getAuthor();

    const ctx = {
      isLoggedIn: author != null,
      isNotLoggedIn: author == null,
      username: author && author.username
    }

    this.element.innerHTML = this.templates.home(ctx);
  }

  getURI () { return 'atom://insight-atom'; }

  getTitle () { return 'Getting Started'; }

  destroy () {
    this.element.remove();
  }

  getElement () {
    return this.element;
  }

}
