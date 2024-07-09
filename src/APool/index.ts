import Joi from "joi";
const apool_options_schema = Joi.object({
  create: Joi.function().required(),
  dispose: Joi.function(),
  reuse: Joi.function(),
  recycle: Joi.function(),
  warm_up: Joi.number().integer().min(0),
  max_count: Joi.number().integer().min(0),
  inject_pool_funcs: Joi.boolean(),
});

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
 * @apiGroup APool-异步对象池
 * @apiVersion 1.0.0
 * @apiDescription 异步对象池
 */
export default class APool<
  T extends object,
  O extends APoolOptions<T>,
  INJECT_FUNCS extends O["inject_pool_funcs"],
> {
  private list?: Array<T>;

  private create: APoolObjectCreate<T>;
  private dispose?: APoolObjectDispose<T>;
  private reuse?: APoolObjectReuse<T>;
  private recycle?: APoolObjectRecycle<T>;
  private max_count?: number;
  private inject_pool_funcs?: boolean;

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {UInt} Count 【变量】Count 池内对象个数
   **/
  Count: number;

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {constructor} constructor(options,...params) 【构造】APool 创建对象池
   * @apiParam {Object} options 对象池配置
   * @apiParam {Function=create(...params:Any):Promise<T>} options.create 对象创建方法
   * @apiParam {Function=dispose(obj:T,...params:Any):Promise} [options.dispose] 对象销毁方法
   * @apiParam {Function=reuse(obj:T,...params:Any):Promise} [options.reuse] 对象复用方法
   * @apiParam {Function=recycle(obj:T,...params:Any):Promise} [options.recycle] 对象回收方法
   * @apiParam {UInt} [options.warm_up] 预热数量
   * @apiParam {UInt} [options.max_count] 最大数量
   * @apiParam {Boolean} [options.inject_pool_funcs] 是否将对象池方法注入到对象中
   * @apiParam {Array=Any} [params] 预热参数
   * @apiSuccess (返回) {Object=Pool} pool 返回对象池实例
   * @apiError (错误) {Error} SchemaCheckFail 参数验证错误
   */
  constructor(options?: O, ...params: any[]) {
    const { error, value } = apool_options_schema.validate(options);
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

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {function} WarmUp(num,...params) 【方法】WarmUp 预热对象池
   * @apiParam {UInt} num 预热数量
   * @apiParam {Array=Any} [params] 创建/复用参数
   * @apiError (异步错误) {Error} SchemaCheckFail 参数验证错误
   */
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
    const resList = await Promise.all(proList);
    resList.forEach((obj) => {
      this.injectFuncs(obj);
      list.push(obj);
    });
  }

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {function} Get(...params) 【方法】Get 获取对象
   * @apiParam {Array=Any} [params] 创建/复用参数
   * @apiSuccess (异步返回) {Object=T} obj 异步返回对象实例
   * @apiSuccess (异步返回) {Function=$Recycle(...params:Any)} [obj.$Recycle] 对象池的回收方法（当inject_pool_funcs为true时）
   */
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

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {function} Recycle(obj,...params) 【方法】Recycle 回收对象
   * @apiParam {Object=T} obj 对象
   * @apiParam {Array=Any} [params] 回收/销毁参数
   * @apiError (异步错误) {Error} SchemaCheckFail 参数验证错误
   */
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

  /**
   * @apiGroup APool-异步对象池
   * @apiVersion 1.0.0
   * @api {function} Clear(...params) 【方法】Clear 清空对象池
   * @apiParam {Array=Any} [params] 回收/销毁参数
   */
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
