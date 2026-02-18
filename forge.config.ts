import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'fs';
import path from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// Modules externalized in webpack.main.config.ts that must be copied into the packaged app
const externalModules = [
  'better-sqlite3',
  'express',
  'cors',
  'passport',
  'passport-google-oauth20',
  'passport-github2',
  'jsonwebtoken',
  'stream-chat',
  '@modelcontextprotocol/sdk',
];

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Nexus',
    executableName: 'Nexus',
    extraResource: [
      './server/agents.yml',
      './server/.env',
    ],
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const projectRoot = process.cwd();
      const destNodeModules = path.join(buildPath, 'node_modules');

      function copyModuleRecursive(moduleName: string, visited = new Set<string>()) {
        if (visited.has(moduleName)) return;
        visited.add(moduleName);

        // Handle scoped packages
        const modulePath = path.join(projectRoot, 'node_modules', moduleName);
        const destPath = path.join(destNodeModules, moduleName);

        if (!fs.existsSync(modulePath)) {
          console.warn(`Module not found: ${moduleName}`);
          return;
        }

        fs.cpSync(modulePath, destPath, { recursive: true });

        // Copy production dependencies of this module too
        const pkgPath = path.join(modulePath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          const deps = Object.keys(pkg.dependencies || {});
          for (const dep of deps) {
            // Only copy if the dep exists at the top level (hoisted)
            const depPath = path.join(projectRoot, 'node_modules', dep);
            if (fs.existsSync(depPath) && !fs.existsSync(path.join(destNodeModules, dep))) {
              copyModuleRecursive(dep, visited);
            }
          }
        }
      }

      fs.mkdirSync(destNodeModules, { recursive: true });
      for (const mod of externalModules) {
        console.log(`Copying external module: ${mod}`);
        copyModuleRecursive(mod);
      }
    },
  },
  makers: [
    new MakerDMG({
      format: 'ULFO',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerSquirrel({
      name: 'Nexus',
      setupExe: 'NexusSetup.exe',
    }),
    new MakerDeb({
      options: {
        name: 'nexus',
        productName: 'Nexus',
        maintainer: 'berkayAtActioner',
        homepage: 'https://github.com/berkayAtActioner/nexus',
      },
    }),
    new MakerRpm({
      options: {
        name: 'nexus',
        productName: 'Nexus',
        homepage: 'https://github.com/berkayAtActioner/nexus',
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
