// https://zhuanlan.zhihu.com/p/702058045

function createSandBox(global: any) {
  const context = Object.create(null);
  const proxy = new Proxy(context, {
    has: () => true,
    get: (target, prop) => {
      switch (prop) {
        case Symbol.unscopables:
          return undefined;
        case "globalThis":
        case "window":
        case "parent":
        case "self":
          return proxy;
        default:
          if (prop in target) {
            return target[prop];
          }
          const value = global?.[prop];
          if (typeof value === "function" && !value.prototype) {
            return value.bind(global);
          }
          return undefined;
      }
    },
    set: (target, prop, value) => {
      target[prop] = value;
      return true;
    },
  });
  return proxy;
}

function createKey(
  object: any,
  length: number = 6,
  seed: string = `${Date.now()}`,
) {
  length = Math.max(1, Math.floor(length) || 0);
  let str;
  try {
    str = JSON.stringify(object);
  } catch (e) {
    //
  }
  if (!str && typeof object?.toString === "function") {
    str = object.toString();
  }
  if (typeof str !== "string") {
    str = "";
    while (str.length < length) {
      str = `${str}${seed}`;
    }
  }
  str = `${str}${seed}`;
  const numberStr = "0123456789";
  const wordStr = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const firstChars = `${wordStr}`;
  const otherChars = `${wordStr}${numberStr}`;
  let ret = str.slice(0, length);
  let sub = str.slice(0, length);
  str = str.slice(length, str.length);
  while (sub) {
    sub = str.slice(0, length);
    const codes = [];
    for (let i = 0; i < length; i++) {
      const code = (ret.charCodeAt(i) || i) + (sub.charCodeAt(i) || i);
      if (i === 0)
        codes.push(
          firstChars[Math.floor(code % firstChars.length)].charCodeAt(0),
        );
      else
        codes.push(
          otherChars[Math.floor(code % otherChars.length)].charCodeAt(0),
        );
    }
    ret = String.fromCharCode(...codes);
    str = str.slice(length, str.length);
  }
  return ret;
}

export default class SandBox {
  static Call(code: string, global: any) {
    const context = createSandBox(global);
    return new Function(`context`, `with(context){${code}}`).bind(context)(
      context,
    );
  }

  Context: typeof Proxy;
  constructor(global: any) {
    let context = createSandBox(global);

    const destroy = () => {
      context = null;
    };

    Object.defineProperties(this, {
      Context: {
        get() {
          return context;
        },
      },
      Destroy: {
        get() {
          return destroy;
        },
      },
    });
  }

  Call(code: string) {
    const context = this.Context;
    return new Function(`context`, `with(context){${code}}`).bind(context)(
      context,
    );
  }

  Add(object: any, key?: string) {
    const context = this.Context;
    if (!key) key = createKey(object, 12);
    context[key] = object;
    return key;
  }

  Destroy() {
    //
  }
}
