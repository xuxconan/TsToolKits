const COMPARE_RESULT = {
  LARGER: 1,
  EQUAL: 0,
  SMALLER: -1,
};

export default class VersionComparer {
  public static LARGER = COMPARE_RESULT.LARGER;
  public static EQUAL = COMPARE_RESULT.EQUAL;
  public static SMALLER = COMPARE_RESULT.SMALLER;

  private version?: string;
  constructor(version?: string) {
    this.SetVersion(version);
  }

  GetVersion() {
    return this.version;
  }

  SetVersion(version?: string) {
    this.version = version;
  }

  Compare(target: string | VersionComparer) {
    // 只比对纯数字的版本号

    const t_version =
      target instanceof VersionComparer ? target.version : target;
    const s_version = this.version;

    const tv_num_list = t_version?.split?.(/\D/gi).filter((str) => !!str) ?? [];
    const sv_num_list = s_version?.split?.(/\D/gi).filter((str) => !!str) ?? [];

    const max_len = Math.max(tv_num_list.length, sv_num_list.length);
    for (let i = 0; i < max_len; i++) {
      const t_num = isNaN(+tv_num_list[i]) ? 0 : +tv_num_list[i];
      const s_num = isNaN(+sv_num_list[i]) ? 0 : +sv_num_list[i];
      if (t_num === s_num) continue;
      return t_num > s_num ? COMPARE_RESULT.SMALLER : COMPARE_RESULT.LARGER;
    }
    return COMPARE_RESULT.EQUAL;
  }
}
