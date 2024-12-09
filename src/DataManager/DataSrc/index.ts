import { NotImplementedError } from "@/Errors";

import Data from "../Data";

export default class DataSrc {
  async Get(config?: any): Promise<Data> {
    throw new NotImplementedError();
  }

  async Set(config?: any): Promise<any> {
    throw new NotImplementedError();
  }

  /** #region synchronize interface */
  GetSync(config?: any): Data {
    throw new NotImplementedError();
  }

  SetSync(config?: any): any {
    throw new NotImplementedError();
  }
  /** #endregion */
}
