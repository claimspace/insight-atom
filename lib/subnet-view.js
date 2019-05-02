'use babel';

import { Emitter } from 'atom';
import opn from 'opn';
import GitClient from './git-client'

export default class SubnetView {

  constructor(git, subnet, templates) {
    this.templates = templates;
    this.git = git;
    this.subnet = subnet;
    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('insight-atom');
    this.element.classList.add('insight-atom-sidebar');

    // TODO move to main
    this.overlay = null;

    this.current = {
      preview: null,
      update: null,
      publish: null
    };

    this.branch = {
      name: null,
      create: null
    }

    const view = this;
    const branchAction = function (action, handler) {
      view.element.addEventListener('click', function (ev) {
        if (ev.target.classList.contains(`Subnet-branch${action}`)) {
          handler.call(view, ev.target.parentElement.attributes['data-name'].value);
        }
      });
    }

    branchAction('Open', this.handleOpen);
    branchAction('Archive', this.handleArchive);
    branchAction('Delete', this.handleDelete);

    this.reload();
  }

  reload () {
    this.git.getBranches().then(function (branches) {
      this.branches = branches;
      this.render();
    }.bind(this));
  }

  onError (callback) {
    this.emitter.on('error', callback);
  }

  onRender (callback) {
    this.emitter.on('render', callback);
  }

  error (message, details) {
    if (details instanceof Error) {
      throw details;
    }

    this.emitter.emit('error', {
      error: true,
      message: message,
      details: details
    });

    this.reload();
  }

  render () {
    this.element.innerHTML = this.templates.subnet({
      subnet: this.subnet,
      branches: this.branches,
      hasPublishedVersions: this.branches.published.length > 0,
      hasArchivedVersions: this.branches.archived.length > 0
    });

    const view = this;

    const find = function (q) {
      return view.element.querySelector(q);
    }

    this.overlay = find('.Subnet-overlay');

    this.current.preview = find('.Subnet-preview');
    this.current.update = find('.Subnet-update');
    this.current.publish = find('.Subnet-publish');

    this.branch.name = find('.Subnet-newBranchName');
    this.branch.create = find('.Subnet-newBranchCreate');

    const click = function (el, handler) {
      if (el) {
        el.addEventListener('click', handler.bind(view))
      }
    }

    click(this.current.preview, this.handlePreview);
    click(this.current.update, this.handleUpdate);
    click(this.current.publish, this.handlePublish);
    click(this.branch.create, this.handleCreateBranch);

    this.emitter.emit('render');
  }

  // For very fast actions, the loader is annoying.
  // Use an opacity transition to fade it in slowly,
  // so as to be inperceptible during fast actions.
  // defer the anim to keep it from being erased by
  // the display change.
  startProgress () {
    // ensure same ref!
    const overlay = this.overlay;
    overlay.classList.add('active');
    setTimeout(function () {
      overlay.classList.add('opaque');
    }, 100);
  }

  endProgress () {
    this.overlay.classList.remove('active');
    this.overlay.classList.remove('opaque');
  }

  handlePreview () {
    this.startProgress();
    this.git.preview(this.subnet.fileId).then(
      function (href) {
        opn(href);
        this.endProgress();
      }.bind(this),
      _ => this.error('Error previewing changes!', _));
  }

  handleUpdate () {
    this.startProgress();
    this.git.update().then(
      _ => this.reload(),
      _ => this.error('Error updating!', _));
  }

  handlePublish () {
    this.startProgress();
    this.git.publish(this.subnet.fileId).then(
      function (href) {
        opn(href);
        this.reload();
      }.bind(this),
      _ => this.error('Error publishing version!', _));
  }

  handleCreateBranch () {
    this.startProgress();

    const name = this.branch.name.value.trim();

    if (name.length == 0) {
      this.error('Version name is empty');
      return;
    }

    if (!GitClient.isValidBranchName(name)) {
      this.error('Version name is invalid. Must contain only letters, numbers, dashes (-) and spaces.');
      return
    }

    this.git.create(name).then(
      _ => this.reload(),
      _ => this.error('Error creating version!', _))
  }

  handleOpen (branch) {
    this.startProgress();

    this.git.open(branch).then(
      _ => this.reload(),
      _ => this.error('Error opening version!', _));
  }

  handleArchive (branch) {
    this.startProgress();
    this.git.archive(branch).then(_ => this.reload());
  }

  handleDelete (branch) {
    this.startProgress();
    this.git.delete(branch).then(
      _ => this.reload(),
      _ => this.error('Error deleting version!', _))
  }

  getURI () { return 'atom://insight-atom'; }
  isPermanentDockItem () { return true; }
  getTitle () { return 'Insight Project'; }
  getPreferredLocations () { return ["right"]; }
  getAllowedLocations () { return ["right"]; }

  destroy () {
    this.element.remove();
  }

  getElement () {
    return this.element;
  }
}
