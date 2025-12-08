declare module "vue" {
  export interface GlobalComponents {
    UniTreeList: typeof import("./components/uni-tree-view/uni-tree-view.vue")["default"];
  }
}

export {};