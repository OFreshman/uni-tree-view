declare module "vue" {
  export interface GlobalComponents {
    UniTreeList: typeof import("./components/uni-tree-list/uni-tree-list.vue")["default"];
  }
}

export {};