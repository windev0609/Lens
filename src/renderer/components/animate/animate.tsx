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

import "./animate.scss";
import React from "react";
import { observable, reaction, makeObservable } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import { cssNames, noop } from "../../utils";

export type AnimateName = "opacity" | "slide-right" | "opacity-scale" | string;

export interface AnimateProps {
  name?: AnimateName; // predefined names in css
  enter?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  enterDuration?: number;
  leaveDuration?: number;
}

@observer
export class Animate extends React.Component<AnimateProps> {
  static defaultProps: AnimateProps = {
    name: "opacity",
    enter: true,
    onEnter: noop,
    onLeave: noop,
    enterDuration: 100,
    leaveDuration: 100,
  };

  @observable isVisible = !!this.props.enter;
  @observable statusClassName = {
    enter: false,
    leave: false,
  };

  constructor(props: AnimateProps) {
    super(props);
    makeObservable(this);
  }

  get contentElem() {
    return React.Children.only(this.props.children) as React.ReactElement<React.HTMLAttributes<any>>;
  }

  componentDidMount() {
    disposeOnUnmount(this, [
      reaction(() => this.props.enter, enter => {
        if (enter) this.enter();
        else this.leave();
      }, {
        fireImmediately: true,
      }),
    ]);
  }

  enter() {
    this.isVisible = true; // triggers render() to apply css-animation in existing dom
    requestAnimationFrame(() => {
      this.statusClassName.enter = true;
      this.props.onEnter();
    });
  }

  leave() {
    if (!this.isVisible) return;
    this.statusClassName.leave = true;
    this.props.onLeave();
    this.resetAfterLeaveDuration();
  }

  resetAfterLeaveDuration() {
    setTimeout(() => this.reset(), this.props.leaveDuration);
  }

  reset() {
    this.isVisible = false;
    this.statusClassName.enter = false;
    this.statusClassName.leave = false;
  }

  render() {
    const { name, enterDuration, leaveDuration } = this.props;
    const contentElem = this.contentElem;
    const durations = {
      "--enter-duration": `${enterDuration}ms`,
      "--leave-duration": `${leaveDuration}ms`,
    } as React.CSSProperties;

    return React.cloneElement(contentElem, {
      className: cssNames("Animate", name, contentElem.props.className, this.statusClassName),
      children: this.isVisible ? contentElem.props.children : null,
      style: {
        ...contentElem.props.style,
        ...durations,
      },
    });
  }
}
