/* assets.d.ts文件 */

declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";

declare module "*.json";
declare module "*.js";

declare module "*.mp3";

// https://www.maosi.vip/2022/11/03/vue3ts-jsx%E5%86%99%E6%B3%95css-module%E5%A4%84%E7%90%86%E6%96%B9%E6%A1%88/
declare module "*.css" {
  const classes: { readonly [key: stirng]: string } | any;
  export default classes;
}
declare module "*.less" {
  const classes: { readonly [key: stirng]: string } | any;
  export default classes;
}
declare module "*.scss" {
  const classes: { readonly [key: stirng]: string } | any;
  export default classes;
}
