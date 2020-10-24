import type { ExtensionId, ExtensionManifest, ExtensionModel, LensExtension } from "./lens-extension"
import type { LensMainExtension } from "./lens-main-extension"
import type { LensRendererExtension } from "./lens-renderer-extension"
import path from "path"
import { broadcastIpc } from "../common/ipc"
import { observable, reaction, toJS, } from "mobx"
import logger from "../main/logger"
import { app, ipcRenderer, remote } from "electron"
import { appPreferenceRegistry, kubeObjectMenuRegistry, menuRegistry, pageRegistry, statusBarRegistry } from "./registries";

export interface InstalledExtension extends ExtensionModel {
  manifestPath: string;
  manifest: ExtensionManifest;
}

// lazy load so that we get correct userData
export function extensionPackagesRoot() {
  return path.join((app || remote.app).getPath("userData"))
}

export class ExtensionLoader {
  @observable extensions = observable.map<ExtensionId, InstalledExtension>([], { deep: false });
  @observable instances = observable.map<ExtensionId, LensExtension>([], { deep: false })

  constructor() {
    if (ipcRenderer) {
      ipcRenderer.on("extensions:loaded", (event, extensions: InstalledExtension[]) => {
        extensions.forEach((ext) => {
          if (!this.getById(ext.manifestPath)) {
            this.extensions.set(ext.manifestPath, ext)
          }
        })
      })
    }
  }

  loadOnMain() {
    logger.info('[EXTENSIONS-LOADER]: load on main')
    this.autoloadExtensions((instance: LensMainExtension) => {
      instance.registerAppMenus(menuRegistry);
    })
  }

  loadOnClusterManagerRenderer() {
    logger.info('[EXTENSIONS-LOADER]: load on main renderer (cluster manager)')
    this.autoloadExtensions((instance: LensRendererExtension) => {
      instance.registerPages(pageRegistry)
      instance.registerAppPreferences(appPreferenceRegistry)
      instance.registerStatusBarIcon(statusBarRegistry)
    })
  }

  loadOnClusterRenderer() {
    logger.info('[EXTENSIONS-LOADER]: load on cluster renderer (dashboard)')
    this.autoloadExtensions((instance: LensRendererExtension) => {
      instance.registerPages(pageRegistry)
      instance.registerKubeObjectMenus(kubeObjectMenuRegistry)
    })
  }

  protected autoloadExtensions(callback: (instance: LensExtension) => void) {
    return reaction(() => this.extensions.toJS(), (installedExtensions) => {
      for (const [id, ext] of installedExtensions) {
        let instance = this.instances.get(ext.name)
        if (!instance) {
          const extensionModule = this.requireExtension(ext)
          if (!extensionModule) {
            continue
          }
          const LensExtensionClass = extensionModule.default;
          instance = new LensExtensionClass({ ...ext.manifest, manifestPath: ext.manifestPath, id: ext.manifestPath }, ext.manifest);
          instance.enable();
          callback(instance)
          this.instances.set(ext.name, instance)
        }
      }
    }, {
      fireImmediately: true,
      delay: 0,
    })
  }

  protected requireExtension(extension: InstalledExtension) {
    let extEntrypoint = ""
    try {
      if (ipcRenderer && extension.manifest.renderer) {
        extEntrypoint = path.resolve(path.join(path.dirname(extension.manifestPath), extension.manifest.renderer))
      } else if (!ipcRenderer && extension.manifest.main) {
        extEntrypoint = path.resolve(path.join(path.dirname(extension.manifestPath), extension.manifest.main))
      }
      if (extEntrypoint !== "") {
        return __non_webpack_require__(extEntrypoint)
      }
    } catch (err) {
      console.error(`[EXTENSION-LOADER]: can't load extension main at ${extEntrypoint}: ${err}`, { extension });
      console.trace(err)
    }
  }

  getById(id: ExtensionId): InstalledExtension {
    return this.extensions.get(id);
  }

  async removeById(id: ExtensionId) {
    const extension = this.getById(id);
    if (extension) {
      const instance = this.instances.get(extension.id)
      if (instance) {
        await instance.disable()
      }
      this.extensions.delete(id);
    }
  }

  broadcastExtensions(frameId?: number) {
    broadcastIpc({
      channel: "extensions:loaded",
      frameId: frameId,
      frameOnly: !!frameId,
      args: [this.toJSON().extensions],
    })
  }

  toJSON() {
    return toJS({
      extensions: Array.from(this.extensions).map(([id, instance]) => instance),
    }, {
      recurseEverything: true,
    })
  }
}

export const extensionLoader = new ExtensionLoader()
