import Joi from "joi";

type PoolObjectWithFuncs<T> = T & {
  $Recycle: (...params: any[]) => void;
};
type PoolObject<T> = T | PoolObjectWithFuncs<T>;

type PoolObjectCreate<T> = (...params: any[]) => T;
type PoolObjectDispose<T> = (obj: PoolObject<T>, ...params: any[]) => void;
type PoolObjectReuse<T> = (obj: PoolObject<T>, ...params: any[]) => void;
type PoolObjectRecycle<T> = (obj: PoolObject<T>, ...params: any[]) => void;

type PoolOptions<T> = {
  create: PoolObjectCreate<T>;
  dispose?: PoolObjectDispose<T>;
  reuse?: PoolObjectReuse<T>;
  recycle?: PoolObjectRecycle<T>;
  warm_up?: number;
  max_count?: number;
  inject_pool_funcs?: boolean;
};

/**
 * @apiGroup Pool
 * @apiDescription 对象池
 */
export default class Pool<
  T extends object,
  O extends PoolOptions<T>,
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

  private create: PoolObjectCreate<T>;
  private dispose?: PoolObjectDispose<T>;
  private reuse?: PoolObjectReuse<T>;
  private recycle?: PoolObjectRecycle<T>;
  private max_count?: number;
  private inject_pool_funcs?: boolean;

  Count: number;

  /**
   * @api {constructor} constructor(options,...params) 创建对象池
   * @apiGroup Pool
   * @apiVersion 1.0.0
   */
  constructor(options?: O, ...params: any[]) {
    const { error, value } = Pool.options_schema.validate(options);
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

  private injectFuncs(obj: PoolObject<T>) {
    if (!obj || !this.inject_pool_funcs) return;
    const self = this;
    const _obj: PoolObjectWithFuncs<T> = obj as PoolObjectWithFuncs<T>;
    const _$Recycle = _obj.$Recycle;
    _obj.$Recycle = function (...params: any[]) {
      self.Recycle(obj, ...params);
      if (typeof _$Recycle === "function") _$Recycle.call(obj, ...params);
    };
    return;
  }

  WarmUp(num: number, ...params: any[]) {
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
    for (let i = 0; i < num; i++) {
      let obj = this.create(...params);
      this.injectFuncs(obj);
      list.push(obj);
    }
  }

  Get(
    ...params: any[]
  ): INJECT_FUNCS extends true ? PoolObjectWithFuncs<T> : T {
    let list = this.list;
    if (!list) this.list = list = [];
    let obj = list.pop();
    if (!obj) {
      obj = this.create(...params);
      this.injectFuncs(obj);
    }
    this.reuse?.(obj, ...params);
    return obj as INJECT_FUNCS extends true ? PoolObjectWithFuncs<T> : T;
  }

  Recycle(obj: PoolObject<T>, ...params: any[]) {
    let list = this.list;
    if (!list) this.list = list = [];
    const max_count = this.max_count ?? Infinity;
    if (list.length >= max_count) {
      this.recycle?.(obj, ...params);
      this.dispose?.(obj, ...params);
      return;
    }
    this.recycle?.(obj, ...params);
    list.push(obj);
  }

  Clear(...params: any[]) {
    const list = this.list;
    if (!list) return;
    for (let i = list.length - 1; i >= 0; i--) {
      let obj = list.pop();
      if (!obj) continue;
      this.recycle?.(obj, ...params);
      this.dispose?.(obj, ...params);
    }
    this.list = undefined;
  }
}
