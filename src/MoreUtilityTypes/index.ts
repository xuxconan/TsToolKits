// 目录 https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
// 综述 https://www.typescriptlang.org/docs/handbook/2/generics.html
// 条件 https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
// 映射 https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
// 工具集 https://www.typescriptlang.org/docs/handbook/utility-types.html

export type UNI<S, T> = S & T; // 并集，S与T
export type SUB<S, T> = Omit<S, keyof T>; // 差集，S减去S与T相交的部分
export type SUP<S, T> = SUB<T, S>; // 补集，T减去T与S相交的部分，其实就是T对S的差集
export type XOR<S, T> = UNI<SUB<S, T>, SUB<T, S>>; // 异或集，S与T减去相交的部分
export type INT<S, T> = SUB<UNI<S, T>, XOR<S, T>>; // 交集，S与T相交的部分
