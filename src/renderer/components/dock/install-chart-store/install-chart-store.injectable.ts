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
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { InstallChartStore } from "./install-chart.store";
import dockStoreInjectable from "../dock-store/dock-store.injectable";
import createDockTabStoreInjectable from "../dock-tab-store/create-dock-tab-store.injectable";
import type { IReleaseUpdateDetails } from "../../../../common/k8s-api/endpoints/helm-releases.api";
import createStorageInjectable from "../../../utils/create-storage/create-storage.injectable";

const installChartStoreInjectable = getInjectable({
  instantiate: (di) => {
    const createDockTabStore = di.inject(createDockTabStoreInjectable);

    return new InstallChartStore({
      dockStore: di.inject(dockStoreInjectable),
      createStorage: di.inject(createStorageInjectable),
      versionsStore: createDockTabStore<string[]>(),
      detailsStore: createDockTabStore<IReleaseUpdateDetails>(),
    });
  },
  lifecycle: lifecycleEnum.singleton,
});

export default installChartStoreInjectable;
