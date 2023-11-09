export class Debug {
  static typeOf = (value: any) =>
    Object.prototype.toString.call(value).slice(8, -1);

  static handleRequest = (promise: any) => {
    return promise
      .then((data: any) => [undefined, data])
      .catch((err: any) => [err, undefined]);
  };
}
