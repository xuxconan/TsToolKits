import moment, { Moment, Duration } from "moment";

const DETECT_RESULT = {
  EXPIRED: 1, // 已过期
  UNEXPIRED: 0, // 未过期
  INVALID: -1, // 无效
};

type IExpiredDetectorConstructorOptions = {
  start?: number | string | Moment;
  expired?: number | string | Moment | Duration;
};

export default class ExpiredDetector {
  public static EXPIRED = DETECT_RESULT.EXPIRED;
  public static UNEXPIRED = DETECT_RESULT.UNEXPIRED;
  public static INVALID = DETECT_RESULT.INVALID;

  private start?: Moment;
  private expired?: number | string | Moment | Duration;
  constructor(options?: IExpiredDetectorConstructorOptions) {
    this.SetStart(options?.start);
    this.SetExpired(options?.expired);
  }

  GetStart() {
    return this.start;
  }

  SetStart(start?: number | string | Moment) {
    const m = moment(start);
    if (start !== undefined && m.isValid()) this.start = m;
    else this.start = undefined;
  }

  GetExpired() {
    return this.expired;
  }

  SetExpired(expired?: number | string | Moment | Duration) {
    this.expired = expired;
  }

  Detect(end?: number | string | Moment) {
    // 无开始时间或者无过期条件，均无效
    const start = this.start;
    if (start === undefined || !start.isValid()) {
      return DETECT_RESULT.INVALID;
    }
    const expired = this.expired;
    if (expired === undefined || expired === null) {
      return DETECT_RESULT.INVALID;
    }

    // 无结束时间则以当前时间为结束时间
    if (end === undefined) end = moment();
    end = moment(end);
    if (!end.isValid()) end = moment();

    // NOTE: Moment和Duration只有type，没有具体的类型导出，只能创建一个对象获取原型构造器来获取类型
    const class_moment = (moment() as any).__proto__.constructor;
    const class_duration = (moment() as any).__proto__.constructor;

    let expired_moment = null;
    if (class_moment && expired instanceof class_moment) {
      // 指定过期日期
      expired_moment = expired;
    } else if (class_duration && expired instanceof class_duration) {
      // 指定过期时长
      expired_moment = start.add(expired as Duration);
    } else if (typeof expired === "number") {
      // 指定过期毫秒数
      expired_moment = start.add(moment.duration(expired));
    } else if (typeof expired !== "string") {
      // 指定类型之外的情况可尝试强行转换成moment，如果无效将会是invalidDate
      expired_moment = moment(expired as any);
    } else {
      // 字符串情况具体讨论
      if (!isNaN(expired as any)) {
        // 纯数字，则与数字一样的处理
        expired_moment = start.add(moment.duration(+expired));
      } else {
        const m = moment(expired);
        if (m.isValid()) {
          // 如果字符串可以直接转换成有效的moment，则直接转换
          expired_moment = m;
        } else {
          // 在字符串中提取时长参数，将其加到时长里
          const d = moment.duration();
          expired
            .replace(/\s/gi, "")
            .match(/\d+[^\d]+/gi)
            ?.filter((str) =>
              /\d+(milliseconds|ms|seconds|s|minutes|m|hours|h|days|d|weeks|w|months|years|y)$/gi.test(
                str,
              ),
            )
            .forEach((str) => {
              const num = str?.match(/\d+/gi)?.[0];
              if (!num) return;
              const unit = str.replace(num, "");
              if (unit !== "M") d.add(num, unit.toLowerCase() as any);
              else d.add(num, unit);
            });
          expired_moment = start.add(d);
        }
      }
    }

    if (!expired_moment?.isValid()) return DETECT_RESULT.INVALID;
    return end.diff(expired_moment) >= 0
      ? DETECT_RESULT.EXPIRED
      : DETECT_RESULT.UNEXPIRED;
  }
}
