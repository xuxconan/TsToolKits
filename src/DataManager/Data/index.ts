import type { Moment, Duration } from "moment";

import { NotImplementedError } from "@/Errors";
import ExpiredDetector from "@/ExpiredDetector";

export default class Data {
  private value?: any; // 有效数据
  private version?: string; // 数据版本，可用于判断升级结构
  private time?: number | string | Moment; // 数据生成时间，用于判断数据过期

  public Value?: any;
  public Version?: string;
  public Time?: number | string | Moment;

  constructor(src_data?: any) {
    /** #region getters/setters */
    Object.defineProperties(this, {
      Value: {
        get() {
          return this.value;
        },
        set(value) {
          this.value = value;
        },
      },
      Version: {
        get() {
          return this.version;
        },
        set(value) {
          this.version = value;
        },
      },
      Time: {
        get() {
          return this.time;
        },
        set(value) {
          this.time = value;
        },
      },
    });
    /** #endregion */

    this.Time = Date.now();
    this.FromSrcData(src_data);
  }

  // 数据是否已过期
  IsExpired(expired?: number | string | Moment | Duration) {
    const detector = new ExpiredDetector({
      start: this.time,
      expired,
    });
    const result = detector.Detect();
    return result !== ExpiredDetector.UNEXPIRED;
  }

  // 将对象数据转换成源数据
  ToSrcData() {
    throw new NotImplementedError();
  }

  // 将源数据转换成对象数据
  FromSrcData(src_data?: any) {
    throw new NotImplementedError();
  }
}
