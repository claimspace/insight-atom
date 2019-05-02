'use babel';

import { CompositeDisposable } from 'atom';

import Templates from './templates'
import GitClient from './git-client'
import Subnet from './subnet'
import SubnetView from './subnet-view';
import HomeView from './home-view';
import OpenProjectView from './open-project-view'
import ErrorView from './error-view'
import InstallGitView from './install-git-view'
import LoginView from './login-view'

// "activationCommands": {
//   "atom-workspace": ["insight-atom:toggle", ...]
// },
export default {

  config: {
    datadir: {
      title: 'Claimspace Data Location',
      description: 'Where Claimspace projects will be stored on your computer. If you change this, make sure to copy any existing data to the new location.',
      type: 'string',
      default: null
    }
  },

  templates: false,
  isProjectPathInitialized: false,
  git: null,
  installGitView: null,
  loginView: null,
  openProjectView: null,
  errorView: null,
  subnetView: null,
  subnetViewOpenPromise: null,
  homeView: null,
  homeViewOpenPromise: null,
  subscriptions: null,

  activate (state) {
    this.templates = new Templates()

    // LOGIN
    this.loginView = new LoginView(this.templates)
    this.loginModal = atom.workspace.addModalPanel({
      item: this.loginView.getElement(),
      visible: false
    })

    this.loginView.onCancel(_ => this.loginModal.hide())
    this.loginView.onComplete(_ => {
      this.loginModal.hide();
      if (this.homeView) {
        this.homeView.render();
      }
    });
    this.loginView.onGitNotFound(_ => {
      this.loginModal.hide();
      this.installGitModal.show();
    });

    // ERROR
    this.errorView = new ErrorView(this.templates);
    this.errorModal = atom.workspace.addModalPanel({
      item: this.errorView.getElement(),
      visible: false
    })

    this.errorView.onAccept(_ => this.errorModal.hide())

    // INSTALL GIT
    this.installGitView = new InstallGitView(this.templates);
    this.installGitModal = atom.workspace.addModalPanel({
      item: this.installGitView.getElement(),
      visible: false
    })

    this.installGitView.onInstall(_ => this.installGitModal.hide())

    if (!GitClient.initialize()) {
      console.log('here')
      this.installGitModal.show();
    }

    // OPEN
    this.openProjectView = new OpenProjectView(this.templates);
    this.openProjectModal = atom.workspace.addModalPanel({
      item: this.openProjectView.getElement(),
      visible: false
    });

    this.openProjectView.onOpen(_ => this.handleOpenProject(_))
    this.openProjectView.onCancel(_ => this.openProjectModal.hide())
    this.openProjectView.onAuthError(_ => {
      this.openProjectModal.hide();
      this.loginModal.show();
    });
    this.openProjectView.onGitNotFound(_ => {
      this.openProjectModal.hide();
      this.installGitModal.show();
    });

    // ACTIONS
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'insight-atom:toggle':                  () => this.toggle(),
      'insight-atom:toggle-native':           () => this.toggleNative(),
      'insight-atom:show-open-project-modal': () => this.showOpenProjectModal(),
      'insight-atom:show-login-modal':        () => this.showLoginModal()
    }));

    // MAIN
    atom.workspace.project.onDidChangePaths(
      _ => this.possiblyInitializeProjectPath());

    this.possiblyInitializeProjectPath();
  },

  handleOpenProject (location) {
    this.openProjectModal.hide()

    if (atom.workspace.project.getPaths().length) {
      atom.open({
        pathsToOpen: [ location ],
        newWindow: true
      });
    } else {
      atom.workspace.project.addPath(location);

      this.killAllHomeViews();
    }
  },

  killAllHomeViews ()  {
    if (this.homeView) {
      // wherever the homeview ended up, kill it.
      atom.workspace.getPanes().forEach(_ => _.destroyItem(this.homeView));
    }
  },

  possiblyInitializeProjectPath () {
    const root = atom.workspace.project.getPaths()[0];

    if (root && !this.isProjectPathInitialized) {
      this.isProjectPathInitialized = true;
      this.initializeProjectPath(root);
    }
  },

  initializeProjectPath (root) {
    const subnet = Subnet.find(root);

    if (!subnet) return
    if (!GitClient.initialize()) {
      this.installGitModal.show()
      return
    }

    this.git = new GitClient(root);
    this.git.onAuthError(_ => this.loginModal.show());
    this.git.onGitNotFound(_ => this.installGitModal.show())

    this.subnetView = new SubnetView(this.git, subnet, this.templates);

    this.subnetView.onRender(_ => this.killAllHomeViews());

    this.subnetView.onError(function (data) {
      if (!this.loginModal.isVisible()) {
        this.errorView.render(data);
        this.errorModal.show();
      }
    }.bind(this));

    this.subnetViewOpenPromise =
      atom.workspace.open(this.subnetView, {
        activatePane: true,
        activateItem: true
      });
  },

  toggle () {
    if (!this.isProjectPathInitialized || !this.subnetView) {
      this.showOrUpdateHomeScreen();
    }
  },

  toggleNative () {
    if (!this.isProjectPathInitialized || !this.subnetView) {
      if (atom.workspace.project.getPaths().length == 0) {
        this.showOrUpdateHomeScreen();
      }
    }
  },

  showOrUpdateHomeScreen () {
    if (this.homeView) {
      this.homeView.render();
      return;
    }

    this.homeView = new HomeView(this.templates);

    this.homeView.onLoginClick(_ => this.showLoginModal());
    this.homeView.onOpenProjectClick(_ => this.showOpenProjectModal());

    this.homeViewOpenPromise =
      atom.workspace.open(this.homeView, {
        location: 'left',
        activatePane: true,
        activateItem: true
      });
  },

  showOpenProjectModal () {
    this.openProjectView.render();
    this.openProjectModal.show();
    this.openProjectView.subnetIdEl.focus();
  },

  showLoginModal () {
    this.loginModal.show();
  },

  async deactivate () {
    this.errorView.destroy();
    this.installGitView.destroy();
    this.loginView.destroy();
    this.openProjectView.destroy();

    if (this.subnetViewOpenPromise) {
      await this.subnetViewOpenPromise;
      this.subnetView.destroy();
      this.git.destroy();
    }

    if (this.homeViewOpenPromise) {
      await this.homeViewOpenPromise;
      this.homeView.destroy()
    }
  }

};
