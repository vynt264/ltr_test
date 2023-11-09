export function getMapByValueAndKey(enum1: any, enum2: any) {
  const enumMap = new Map();
  for (const key in enum1) {
    if (Object.prototype.hasOwnProperty.call(enum1, key)) {
      const value = enum1[key];
      const key2 = enum2[key];
      enumMap.set(key2, value);
    }
  }
  return enumMap;
}
