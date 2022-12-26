/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import React from "react";
import type { KubeObjectMenuProps } from "../kube-object-menu";
import type { DaemonSet, DaemonSetApi } from "../../../common/k8s-api/endpoints";
import { MenuItem } from "../menu";
import { Icon } from "../icon";
import { Notifications } from "../notifications";
import { withInjectables } from "@ogre-tools/injectable-react";
import daemonSetApiInjectable from "../../../common/k8s-api/endpoints/daemon-set.api.injectable";
import type { OpenConfirmDialog } from "../confirm-dialog/open.injectable";
import openConfirmDialogInjectable from "../confirm-dialog/open.injectable";

export interface DaemonSetMenuProps extends KubeObjectMenuProps<DaemonSet> {}

interface Dependencies {
  daemonsetApi: DaemonSetApi;
  openConfirmDialog: OpenConfirmDialog;
}

const NonInjectedDaemonSetMenu = ({
  daemonsetApi,
  object,
  toolbar,
  openConfirmDialog,
}: Dependencies & DaemonSetMenuProps) => (
  <>
    <MenuItem
      onClick={() => openConfirmDialog({
        ok: async () =>
        {
          try {
            await daemonsetApi.restart({
              namespace: object.getNs(),
              name: object.getName(),
            });
          } catch (err) {
            Notifications.checkedError(err, "Unknown error occured while restarting daemonset");
          }
        },
        labelOk: "Restart",
        message: (
          <p>
            {"Are you sure you want to restart daemonset "}
            <b>{object.getName()}</b>
            ?
          </p>
        ),
      })}
    >
      <Icon
        material="autorenew"
        tooltip="Restart"
        interactive={toolbar}
      />
      <span className="title">Restart</span>
    </MenuItem>
  </>
);

export const DaemonSetMenu = withInjectables<Dependencies, DaemonSetMenuProps>(NonInjectedDaemonSetMenu, {
  getProps: (di, props) => ({
    ...props,
    daemonsetApi: di.inject(daemonSetApiInjectable),
    openConfirmDialog: di.inject(openConfirmDialogInjectable),
  }),
});
