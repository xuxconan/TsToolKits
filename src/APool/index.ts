import Joi from "joi";

type APoolObjectWithFuncs<T> = T & {
  $Recycle: (...params: any[]) => void;
};
type APoolObject<T> = T | APoolObjectWithFuncs<T>;

type APoolObjectCreate<T> = (...params: any[]) => Promise<T>;
type APoolObjectDispose<T> = (
  obj: APoolObject<T>,
  ...params: any[]
) => Promise<any>;
type APoolObjectReuse<T> = (
  obj: APoolObject<T>,
  ...params: any[]
) => Promise<any>;
type APoolObjectRecycle<T> = (
  obj: APoolObject<T>,
  ...params: any[]
) => Promise<any>;

type APoolOptions<T> = {
  create: APoolObjectCreate<T>;
  dispose?: APoolObjectDispose<T>;
  reuse?: APoolObjectReuse<T>;
  recycle?: APoolObjectRecycle<T>;
  warm_up?: number;
  max_count?: number;
  inject_pool_funcs?: boolean;
};

/**
 * @apiGroup APool
 * @apiDescription 异步对象池
 */
export default class APool<
  T extends object,
  O extends APoolOptions<T>,
  INJECT_FUNCS extends O["inject_pool_funcs"],
> {
  private static options_schema = Joi.object({
    create: Joi.function().required(),
    dispose: Joi.function(),
    reuse: Joi.function(),
    recycle: Joi.function(),
    warm_up: Joi.number().integer().min(0),
    max_count: Joi.number().integer().min(0),
    inject_pool_funcs: Joi.boolean(),
  });

  private list?: Array<T>;

  private create: APoolObjectCreate<T>;
  private dispose?: APoolObjectDispose<T>;
  private reuse?: APoolObjectReuse<T>;
  private recycle?: APoolObjectRecycle<T>;
  private max_count?: number;
  private inject_pool_funcs?: boolean;

  Count: number;

  /**
   * @api {constructor} constructor(options,...params) 创建对象池
   * @apiGroup APool
   * @apiVersion 1.0.0
   */
  constructor(options?: O, ...params: any[]) {
    const { error, value } = APool.options_schema.validate(options);
    if (error) throw error;

    this.create = value.create;
    this.dispose = value.dispose;
    this.reuse = value.reuse;
    this.recycle = value.recycle;
    this.max_count = value.max_count;
    this.inject_pool_funcs = value.inject_pool_funcs;

    this.Count = 0;
    Object.defineProperties(this, {
      Count: {
        get() {
          return this.list?.length ?? 0;
        },
      },
    });

    if (value.warm_up > 0) this.WarmUp(value.warm_up, ...params);
  }

  private injectFuncs(obj: APoolObject<T>) {
    if (!obj || !this.inject_pool_funcs) return;
    const self = this;
    const _obj: APoolObjectWithFuncs<T> = obj as APoolObjectWithFuncs<T>;
    const _$Recycle = _obj.$Recycle;
    _obj.$Recycle = async function (...params: any[]) {
      await self.Recycle(obj, ...params);
      if (typeof _$Recycle === "function")
        return _$Recycle.call(obj, ...params);
    };
    return;
  }

  async WarmUp(num: number, ...params: any[]) {
    const { error } = Joi.number().required().integer().min(0).validate(num);
    if (error) throw error;
    let list = this.list;
    if (!list) this.list = list = [];
    const max_count = this.max_count ?? Infinity;
    num =
      max_count === Infinity
        ? num
        : Math.max(Math.min(max_count - list.length, num), 0);
    if (!num) return;
    const proList = [];
    for (let i = 0; i < num; i++) {
      proList.push(this.create(...params));
    }
    const resList = await Promise.allSettled(proList);
    resList
      .filter((res) => res.status === "fulfilled")
      .map((res) => res.value)
      .forEach((obj) => {
        this.injectFuncs(obj);
        list.push(obj);
      });
  }

  async Get(
    ...params: any[]
  ): Promise<INJECT_FUNCS extends true ? APoolObjectWithFuncs<T> : T> {
    let list = this.list;
    if (!list) this.list = list = [];
    let obj = list.pop();
    if (!obj) {
      obj = await this.create(...params);
      this.injectFuncs(obj);
    }
    await this.reuse?.(obj, ...params);
    return obj as INJECT_FUNCS extends true ? APoolObjectWithFuncs<T> : T;
  }

  async Recycle(obj: APoolObject<T>, ...params: any[]) {
    let list = this.list;
    if (!list) this.list = list = [];
    const max_count = this.max_count ?? Infinity;
    if (list.length >= max_count) {
      await this.recycle?.(obj, ...params);
      await this.dispose?.(obj, ...params);
      return;
    }
    await this.recycle?.(obj, ...params);
    list.push(obj);
  }

  async Clear(...params: any[]) {
    const list = this.list;
    if (!list) return;
    const proList = [];
    for (let i = list.length - 1; i >= 0; i--) {
      let obj = list.pop();
      if (!obj) continue;
      proList.push(
        Promise.all([
          this.recycle?.(obj, ...params),
          this.dispose?.(obj, ...params),
        ]),
      );
    }
    await Promise.all(proList);
    this.list = undefined;
  }
}
