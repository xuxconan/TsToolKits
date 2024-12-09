import type { Moment, Duration } from "moment";

import Data from "../Data";
import DataSrc from "../DataSrc";
import DataUpdater from "../DataUpdater";

type IDataManagerConstructorOptions = {
  expired?: number | string | Moment | Duration;
  source?: DataSrc;
  updaters?: DataUpdater[];
};
type IDataManagerGetOptions = {
  from_data_src?: boolean; // 是否强制从数据源获取
};
type IDataManagerSetOptions = {
  update_cache?: boolean; // 是否同时更新缓存数据
  config_for_update?: any; // 请求参数用于更新缓存数据
};
type IDataUpdaterMap = { [version: string]: DataUpdater };

export default class DataManager {
  private cached?: Data;
  private expired?: number | string | Moment | Duration;
  private source?: DataSrc;
  private updaters?: DataUpdater[];

  public Expired?: number | string | Moment | Duration;
  public Source?: DataSrc;

  constructor(options?: IDataManagerConstructorOptions) {
    /** #region getters/setters */
    Object.defineProperties(this, {
      Expired: {
        get() {
          return this.expired;
        },
        set(value) {
          this.expired = value;
        },
      },
      Source: {
        get() {
          return this.source;
        },
        set(value) {
          this.source = value;
        },
      },
    });
    /** #endregion */

    this.expired = options?.expired;
    this.source = options?.source;
    this.AddUpdater(options?.updaters);
  }

  async Get(config?: any, options?: IDataManagerGetOptions): Promise<Data> {
    const { cached, source, expired } = this;
    const { from_data_src } = options ?? {};
    if (!from_data_src && cached && !cached.IsExpired(expired)) return cached;
    if (!source) throw new Error(`DataSource is missing !`);
    const data = await source.Get(config);
    const updaters = this.updaters;
    if (updaters) await Promise.all(updaters.map((u) => u.Update(data)));
    this.cached = data;
    return data;
  }

  async Set(config?: any, options?: IDataManagerSetOptions) {
    const { source } = this;
    const { update_cache, config_for_update } = options ?? {};
    if (!source) throw new Error(`DataSource is missing !`);
    const res = await source.Set(config);
    if (update_cache)
      await this.Get(config_for_update, { from_data_src: true });
    return res;
  }

  /** #region synchronize interface */
  GetSync(config?: any, options?: IDataManagerGetOptions): Data {
    const { cached, source, expired } = this;
    const { from_data_src } = options ?? {};
    if (!from_data_src && cached && !cached.IsExpired(expired)) return cached;
    if (!source) throw new Error(`DataSource is missing !`);
    const data = source.GetSync(config);
    const updaters = this.updaters;
    if (updaters) updaters.forEach((u) => u.Update(data));
    this.cached = data;
    return data;
  }

  SetSync(config?: any, options?: IDataManagerSetOptions) {
    const { source } = this;
    const { update_cache, config_for_update } = options ?? {};
    if (!source) throw new Error(`DataSource is missing !`);
    const res = source.SetSync(config);
    if (update_cache) this.GetSync(config_for_update, { from_data_src: true });
    return res;
  }
  /** #endregion */

  AddUpdater(updaters?: DataUpdater[] | IDataUpdaterMap) {
    if (!updaters) return;
    if (!(updaters instanceof Array))
      updaters = this.transfer_updater_map_to_list(updaters);
    const old_updaters = this.updaters ?? [];
    const new_updaters = [].concat(old_updaters, updaters);
    new_updaters.sort((lv, rv) => lv.VersionCompare(rv.Version));
    this.updaters = new_updaters;
  }

  RemoveUpdater(updaters?: DataUpdater[] | IDataUpdaterMap) {
    if (!updaters) return;
    if (!(updaters instanceof Array))
      updaters = this.transfer_updater_map_to_list(updaters);
    const old_updaters = this.updaters;
    if (!old_updaters?.length) return;
    updaters.forEach((u) => {
      const i = old_updaters.findIndex((ou) => ou === u);
      if (i < 0) return;
      old_updaters.splice(i, 1);
    });
  }

  transfer_updater_map_to_list(updaters: IDataUpdaterMap) {
    if (typeof updaters !== "object") return [];
    return Object.entries(updaters)
      .filter((entries) => {
        return !!entries && !!entries[1];
      })
      .map((entries) => {
        const [v, u] = entries;
        u.Version = v;
        return u;
      });
  }
}
