function Struct<T>(json: T): Partial<T> {
  const obj = Object.create(null);
  const names = Object.getOwnPropertyNames(json);
  const symbols = Object.getOwnPropertySymbols(json);
  const keys = [...names, ...symbols];
  for (let key of keys) obj[key] = json[key];
  return obj;
}
