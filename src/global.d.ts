declare module "joi";
declare module "crypto-js";
declare module "crypto-browserify";
declare module "hammerjs";
declare module "howler";

declare interface Window {}

declare interface Document {
  mozHidden?: any;
  msHidden?: any;
  webkitHidden?: any;
}

declare interface Error {
  cause?: any;
}
