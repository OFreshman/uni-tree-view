declare module "vue" {
  export interface GlobalComponents {
    UniTreeView: typeof import("./components/uni-tree-view/uni-tree-view.vue")["default"];
  }
}

export {};