export default {
  /**
   * 当前选中值
   */
  modelValue: {
    type: [Array, String, Number, null],
    default: undefined
  },
  /**
   * 树的数据
   */
  data: {
    type: Array,
    default: () => []
  },
  /**
   * 字段映射
   */
  treeProps: {
    type: Object,
    default: undefined
  },
  /**
   * 主题色
   */
  themeColor: {
    type: String,
    default: "#007aff"
  },
  /**
   * 是否启用并显示选择控件
   */
  showCheckbox: {
    type: Boolean,
    default: false
  },
  /**
   * 是否多选
   */
  multiple: {
    type: Boolean,
    default: false
  },
  /**
   * 点击节点内容时是否切换选中状态
   */
  checkOnClickNode: {
    type: Boolean,
    default: false
  },
  /**
   * 点击节点内容时是否展开或收起
   */
  expandOnClickNode: {
    type: Boolean,
    default: false
  },
  /**
   * 默认选中的节点，注意单选时为单个key，多选时为key的数组
   */
  defaultCheckedKeys: {
    type: [Array, String, Number],
    default: () => []
  },
  /**
   * 是否默认展开全部
   */
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  /**
   * 默认展开的节点
   */
  defaultExpandedKeys: {
    type: Array,
    default: () => []
  },
  /**
   * 默认展开节点的兼容别名
   */
  defaultExpandedIds: {
    type: Array,
    default: () => []
  },
  /**
   * 筛选关键词
   */
  filterValue: {
    type: String,
    default: ""
  },
  /**
   * 自定义节点过滤方法
   */
  filterMethod: {
    type: Function,
    default: undefined
  },
  /**
   * 是否高亮默认标签中的过滤关键词
   */
  highlightFilter: {
    type: Boolean,
    default: true
  },
  /**
   * 是否自动展开到选中的节点，默认不展开
   */
  expandChecked: {
    type: Boolean,
    default: false
  },
  /**
   * 数据刷新时是否保留运行时展开状态
   */
  cacheExpandedKeys: {
    type: Boolean,
    default: false
  },

  /**
   * (旧)字段对应内容，默认为 {label: 'label',key: 'key', children: 'children', disabled: 'disabled', append: 'append'}
   * 注意：1.5.0版本后不再兼容
   */
  field: {
    type: Object,
    default: null
  },
  /**
   * 标签字段(新，拆分了)
   */
  labelField: {
    type: String,
    default: "label"
  },
  /**
   * 值字段(新，拆分了)
   */
  valueField: {
    type: String,
    default: "id"
  },
  /**
   * 下级字段(新，拆分了)
   */
  childrenField: {
    type: String,
    default: "children"
  },
  /**
   * 禁用字段(新，拆分了)
   */
  disabledField: {
    type: String,
    default: "disabled"
  },
  /**
   * 末级节点字段(新，拆分了)
   */
  leafField: {
    type: String,
    default: "leaf"
  },
  /**
   * 节点图标字段
   */
  iconField: {
    type: String,
    default: "icon"
  },
  /**
   * 副标签字段(新，拆分了)
   */
  appendField: {
    type: String,
    default: "append"
  },
  isLeafFn: {
    type: Function,
    default: null
  },
  /**
   * 是否显示单选图标，默认显示
   */
  showRadioIcon: {
    type: Boolean,
    default: true
  },
  /**
   * 单选时只允许选中末级，默认可随意选中
   */
  onlyRadioLeaf: {
    type: Boolean,
    default: false
  },
  /**
   * 多选时，是否执行父子不关联的任意勾选，默认父子关联
   */
  checkStrictly: {
    type: Boolean,
    default: false
  },
  /**
   * 为 true 时，空的 children 数组会显示展开图标
   */
  loadMode: {
    type: Boolean,
    default: false
  },
  /**
   * 异步加载接口
   */
  loadApi: {
    type: Function,
    default: undefined
  },
  /**
   * 是否总在首次的时候加载一下内容，来比对是否一致
   */
  alwaysFirstLoad: {
    type: Boolean,
    default: false
  },
  /**
   * 是否渲染(操作)禁用值
   */
  checkedDisabled: {
    type: Boolean,
    default: false
  },
  /**
   * 是否返回已禁用的但已选中的key
   */
  packDisabledkey: {
    type: Boolean,
    default: true
  },
  /**
   * 选择框的位置，可选 left/right
   */
  checkboxPlacement: {
    type: String,
    default: "left"
  },
  /**
   * 子项缩进距离，默认40，单位rpx
   */
  indent: {
    type: Number,
    default: 40
  },
  /**
   * 空状态文本
   */
  emptyText: {
    type: String,
    default: "暂无数据"
  },
  /**
   * 是否显示节点路径
   */
  showPath: {
    type: Boolean,
    default: false
  },
  /**
   * 节点路径分隔符
   */
  pathSeparator: {
    type: String,
    default: " / "
  },
  /**
   * 是否启用固定行高虚拟渲染，适合大数据量场景
   */
  virtual: {
    type: Boolean,
    default: false
  },
  /**
   * 虚拟渲染单行高度，单位 px
   */
  virtualItemHeight: {
    type: Number,
    default: 36
  },
  /**
   * 虚拟渲染滚动容器高度，单位 px
   */
  virtualHeight: {
    type: Number,
    default: 400
  },
  /**
   * 虚拟渲染视口上下额外渲染行数
   */
  virtualOverscan: {
    type: Number,
    default: 8
  }
};