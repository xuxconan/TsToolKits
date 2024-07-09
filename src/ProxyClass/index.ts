class ProxyClass {
  constructor() {
    if (this.constructor === ProxyClass) return this;
    const proxy: any = new ProxyClass();

    // TODO: 将子类的所有成员转移到proxy中

    return proxy;
  }
}
