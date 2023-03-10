/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { App } from "electron";
import type { PathName } from "../../../common/app-paths/app-path-names";

interface Dependencies {
  app: App;
}

export type GetElectronAppPath = (name: PathName | "currentApp") => string;

export const getElectronAppPath = ({
  app,
}: Dependencies): GetElectronAppPath => (
  (name) => {
    try {
      if (name === "currentApp") {
        return app.getAppPath();
      }

      return app.getPath(name);
    } catch (e) {
      return "";
    }
  }
);
