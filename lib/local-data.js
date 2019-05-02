'use babel'

import os from 'os';
import fs from 'fs';
import path from 'path';

import Subnet from './subnet'

export default class LocalData {

  static init () {
    if (!fs.existsSync(LocalData.internalDataRoot())) {
      fs.mkdirSync(LocalData.internalDataRoot());
    }
  }

  static internalDataRoot () {
    return path.join(atom.configDirPath, 'insight-data');
  }

  static authorFile () {
    return path.join(LocalData.internalDataRoot(), 'author.json');
  }

  static setAuthor (author) {
    LocalData.init();
    fs.writeFileSync(LocalData.authorFile(), JSON.stringify(author));
  }

  static getAuthor () {
    const file = LocalData.authorFile()

    if (!fs.existsSync(file)) {
      return null;
    } else {
      const author = JSON.parse(fs.readFileSync(file));
      if (!author.username) {
        return null;
      } else {
        return author;
      }
    }
  }

  static getLocation () {
    return atom.config.get('insight-atom.datadir') || path.join(os.userInfo().homedir, 'Documents', 'Insight Projects');
  }

  static getProjects () {
    const dir = LocalData.getLocation();

    let projects = [];

    if (!fs.existsSync(dir)) return [];

    fs.readdirSync(dir).forEach(function (file) {
      const manifest = Subnet.find(path.join(dir, file));

      if (manifest) projects.push(manifest);
    });

    return projects;
  }

}
