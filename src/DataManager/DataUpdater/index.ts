import { NotImplementedError } from "@/Errors";
import VersionComparer from "@/VersionComparer";

import Data from "../Data";

export default class DataUpdater {
  private version?: string;
  private comparer?: VersionComparer;

  public Version?: string;

  constructor(version?: string) {
    /** #region getters/setters */
    Object.defineProperties(this, {
      Version: {
        get() {
          return this.version;
        },
        set(value) {
          this.version = value;
          this.comparer = new VersionComparer(version);
        },
      },
    });
    /** #endregion */

    this.Version = version;
  }

  VersionCompare(version?: string) {
    const comparer = this.comparer;
    return comparer?.Compare(version);
  }

  async Update(data?: Data) {
    if (!data) return;
    if (this.VersionCompare(data.Version) !== VersionComparer.SMALLER) return;
    await this.update(data);
    data.Version = this.version;
  }

  protected async update(data?: Data) {
    throw new NotImplementedError();
  }

  /** #region synchronize interface */
  UpdateSync(data?: Data) {
    if (!data) return;
    if (this.VersionCompare(data.Version) !== VersionComparer.SMALLER) return;
    this.update_sync(data);
    data.Version = this.version;
  }

  protected update_sync(data?: Data) {
    throw new NotImplementedError();
  }
  /** #endregion */
}
