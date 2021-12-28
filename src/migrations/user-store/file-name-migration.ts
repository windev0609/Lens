/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import fse from "fs-extra";
import path from "path";
import { getLegacyGlobalDiForExtensionApi } from "../../extensions/as-legacy-global-function-for-extension-api/legacy-global-di-for-extension-api";
import directoryForUserDataInjectable
  from "../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";

export function fileNameMigration() {
  const di = getLegacyGlobalDiForExtensionApi();

  const userDataPath = di.inject(directoryForUserDataInjectable);
  const configJsonPath = path.join(userDataPath, "config.json");
  const lensUserStoreJsonPath = path.join(userDataPath, "lens-user-store.json");

  try {
    fse.moveSync(configJsonPath, lensUserStoreJsonPath);
  } catch (error) {
    if (error.code === "ENOENT" && error.path === configJsonPath) { // (No such file or directory)
      return; // file already moved
    } else if (error.message === "dest already exists.") {
      fse.removeSync(configJsonPath);
    } else {
      // pass other errors along
      throw error;
    }
  }
}
