// 接口未实现错误
export default class NotImplementedError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    if (typeof message === "undefined")
      this.message = "Interface is NOT implemented !";
  }
}
