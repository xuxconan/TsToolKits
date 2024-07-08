module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-prototype-builtins": "off",
    "no-undef": "off",
    "no-console": "off",
    "no-debugger": "off",
    "prefer-const": "off", // 不允许不再改变的变量使用let
    "@typescript-eslint/no-this-alias": "off", // 不允许变量保存this
    "@typescript-eslint/no-empty-function": "off", // 不允许空方法
    "@typescript-eslint/no-explicit-any": "off", // 不允许any
    "@typescript-eslint/no-empty-interface": "off", // 不允许生成空接口
    "@typescript-eslint/no-unused-vars": "off", // 不允许未使用的变量
    "@typescript-eslint/no-var-requires": "off", // 不允许import的内容用require导入
    "@typescript-eslint/no-inferrable-types": "off", // 不允许对基本类型的变量指定类型
    "no-control-regex": "off", // 禁止在正则表达式中使用控制字符
    "no-useless-escape": "off",
    "no-case-declarations": "off",
    "no-constant-condition": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
};
