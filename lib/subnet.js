'use babel'

import os from 'os';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

export default class Subnet {

  static find (root) {
    const manifestPath = path.join(root, 'Manifest');
    const projectPath  = path.join(root, 'Project');

    let file = null;

    if (fs.existsSync(manifestPath)) {
      file = manifestPath;
    } else if (fs.existsSync(projectPath)) {
      file = projectPath;
    }

    if (file) {
      try {
        const manifest = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        Subnet.cleanManifest(manifest, root);
        return manifest;
      } catch (e) {
        console.log('Error parsing Manifest yaml: ', e);
        return null;
      }
    }
  }

  static cleanManifest (manifest, root) {
    manifest.fileId = manifest.id.replace('$', '');
    manifest.root = root;
    manifest.prettyRoot = root.replace(os.userInfo().homedir, '~');

    let logo = manifest.logo || (manifest.theme && manifest.theme.logo)
    if (logo && logo.indexOf('//') == 0) {
      logo = 'http:' + logo;
    }
    manifest.logo = logo;
  }

}
