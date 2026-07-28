export type DemoTreeKey = string | number;

export interface DemoTreeNode {
  id: DemoTreeKey;
  label: string;
  append?: string;
  icon?: string;
  disabled?: boolean;
  leaf?: boolean;
  isNew?: boolean;
  description?: string;
  count?: number;
  children?: DemoTreeNode[];
}

export const demoTreeData: DemoTreeNode[] = [
  {
    id: "product",
    label: "产品研发中心",
    append: "12 人",
    children: [
      {
        id: "frontend",
        label: "前端组",
        append: "5 人",
        children: [
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