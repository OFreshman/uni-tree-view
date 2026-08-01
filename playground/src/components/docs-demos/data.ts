export type DemoTreeKey = string | number;

export interface DemoTreeNode {
  /** 节点唯一标识，v-model、default-expanded-keys、setCheckedKeys 用的都是它 */
  id: DemoTreeKey;
  /** 节点文本 */
  label: string;
  /** 尾部附加文本，内置渲染在节点右侧，也可用 append 插槽接管 */
  append?: string;
  /** 禁用节点：默认锁定选中状态、样式置灰 */
  disabled?: boolean;
  /** label 插槽演示用：为 true 时在名字后面挂一个 NEW 徽标 */
  isNew?: boolean;
  /** default 插槽演示用：节点副标题 */
  description?: string;
  children?: DemoTreeNode[];
}

// #region tree-data
// 文档示例与右侧实时预览共用的同一份组织架构数据
const treeData = [
  {
    id: "product",
    label: "产品研发中心",
    append: "12 人", // append 字段会渲染在节点右侧
    children: [
      {
        id: "frontend",
        label: "前端组",
        append: "5 人",
        children: [
          // isNew 是业务自定义字段，仅在 label 插槽里使用
          { id: "frontend-1", label: "林小满", description: "组件开发", isNew: true },
          { id: "frontend-2", label: "周一帆", description: "业务研发" }
        ]
      },
      {
        id: "backend",
        label: "后端组",
        append: "4 人",
        children: [
          { id: "backend-1", label: "陈远", description: "服务端" },
          // disabled 为组件内置字段：默认锁定选中状态、样式置灰
          { id: "backend-2", label: "顾宁", description: "基础架构", disabled: true }
        ]
      },
      {
        id: "design",
        label: "设计组",
        append: "3 人",
        children: [
          { id: "design-1", label: "沈青", description: "产品设计" },
          { id: "design-2", label: "苏禾", description: "视觉设计" }
        ]
      }
    ]
  },
  {
    id: "operations",
    label: "运营中心",
    append: "6 人",
    children: [
      { id: "operations-1", label: "内容运营", append: "3 人" },
      { id: "operations-2", label: "用户运营", append: "3 人" }
    ]
  }
];
// #endregion tree-data

export const demoTreeData: DemoTreeNode[] = treeData;