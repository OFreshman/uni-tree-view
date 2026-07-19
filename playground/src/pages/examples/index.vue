<template>
  <app-page>
    <view class="page">
      <wd-tabs
        v-model="activeTab"
        :offset-top="-1"
        custom-class="page__tabs"
        custom-style="--wot-tabs-nav-bg: var(--wot-filled-oppo, #ffffff);"
        sticky>
        <wd-tab title="选择模式" name="selection">
          <view class="page__panel">
            <view class="page__card">
              <view class="page__card-title">
                单选（radio）
              </view>
              <uni-tree-view
                v-model="radioValue"
                show-checkbox
                theme-color="#299764"
                default-expand-all
                :data="orgData"
                :tree-props="treeProps"></uni-tree-view>
            </view>

            <view class="page__card">
              <view class="page__card-title">
                多选 · 严格模式（父子独立）
              </view>
              <uni-tree-view
                v-model="strictValue"
                show-checkbox
                multiple
                check-strictly
                theme-color="#299764"
                default-expand-all
                :data="orgData"
                :tree-props="treeProps"></uni-tree-view>
            </view>

            <view class="page__card">
              <view class="page__card-title">
                整行可点（check-on-click-node）
              </view>
              <uni-tree-view
                v-model="rowClickValue"
                show-checkbox
                multiple
                check-on-click-node
                expand-on-click-node
                theme-color="#299764"
                :default-expanded-keys="['dept-1']"
                :data="orgData"
                :tree-props="treeProps"></uni-tree-view>
            </view>
          </view>
        </wd-tab>

        <wd-tab title="懒加载" name="lazy">
          <view class="page__panel">
            <view class="page__card">
              <view class="page__card-header">
                <text class="page__card-title">
                  异步加载子节点
                </text>
                <wd-tag type="primary" variant="plain">
                  {{ lazyStatus }}
                </wd-tag>
              </view>
              <view class="page__card-desc-row">
                模拟 600ms 网络延迟，「设备部」固定加载失败，可点击重试
              </view>
              <uni-tree-view
                ref="lazyTreeRef"
                v-model="lazyValue"
                show-checkbox
                multiple
                load-mode
                theme-color="#299764"
                :data="lazyRootData"
                :load-api="mockLoadApi"
                :is-leaf-fn="isLazyLeaf"
                @load="onLazyLoad"
                @load-error="onLazyLoadError"></uni-tree-view>
            </view>
          </view>
        </wd-tab>

        <wd-tab title="插槽定制" name="slots">
          <view class="page__panel">
            <view class="page__card">
              <view class="page__card-title">
                icon / append 插槽 + 徽标
              </view>
              <uni-tree-view
                theme-color="#299764"
                default-expand-all
                :data="slotData"
                :tree-props="treeProps">
                <template #icon="{ node }">
                  <wd-icon
                    :name="node.isLeaf ? 'file' : 'folder'"
                    size="34rpx"
                    color="#299764"></wd-icon>
                </template>
                <template #append="{ data }">
                  <wd-tag
                    v-if="data.count"
                    type="primary"
                    variant="plain"
                    round>
                    {{ data.count }}
                  </wd-tag>
                </template>
              </uni-tree-view>
            </view>

            <view class="page__card">
              <view class="page__card-title">
                空状态插槽
              </view>
              <uni-tree-view :data="[]" theme-color="#299764">
                <template #empty>
                  <wd-empty description="这里什么都没有"></wd-empty>
                </template>
              </uni-tree-view>
            </view>
          </view>
        </wd-tab>

        <wd-tab title="弹窗选择" name="popup">
          <view class="page__panel">
            <view class="page__card">
              <view class="page__card-title">
                底部弹窗选择器（组合 wd-popup）
              </view>
              <view class="page__card-desc-row">
                移动端最常见的树选择形态：cell 唤起 + 弹窗内选择 + 确认回填
              </view>
              <wd-cell
                title="选择部门"
                :value="popupDisplayText"
                is-link
                clickable
                @click="openPopup"></wd-cell>
            </view>
          </view>

          <wd-popup
            v-model="showPopup"
            position="bottom"
            safe-area-inset-bottom
            custom-class="page__popup">
            <view class="page__popup-bar">
              <text class="page__popup-cancel" @click="showPopup = false">
                取消
              </text>
              <text class="page__popup-title">
                选择部门
              </text>
              <text class="page__popup-confirm" @click="confirmPopup">
                确定
              </text>
            </view>
            <view class="page__popup-body">
              <uni-tree-view
                v-model="popupDraftValue"
                show-checkbox
                multiple
                theme-color="#299764"
                default-expand-all
                :data="orgData"
                :tree-props="treeProps"></uni-tree-view>
            </view>
          </wd-popup>
        </wd-tab>
      </wd-tabs>
      <wd-gap height="48rpx" bg-color="transparent"></wd-gap>
    </view>
  </app-page>
</template>

<script setup lang='ts'>
import UniTreeView from "uni-tree-view";
import { computed, ref, shallowRef } from "vue";
import AppPage from "@/components/appPage/index.vue";

interface DemoNode {
  id: string;
  label: string;
  type?: string;
  count?: number;
  disabled?: boolean;
  children?: DemoNode[];
}

const activeTab = ref("selection");

const treeProps = {
  id: "id",
  label: "label",
  children: "children",
  disabled: "disabled"
};

const orgData: DemoNode[] = [
  {
    id: "dept-1",
    label: "研发中心",
    children: [
      {
        id: "dept-1-1",
        label: "前端组",
        children: [
          { id: "user-1", label: "小何" },
          { id: "user-2", label: "小明" }
        ]
      },
      {
        id: "dept-1-2",
        label: "后端组",
        children: [
          { id: "user-3", label: "小红" },
          { id: "user-4", label: "小刚", disabled: true }
        ]
      }
    ]
  },
  {
    id: "dept-2",
    label: "产品部",
    children: [
      { id: "user-5", label: "小美" }
    ]
  }
];

// ==================== 选择模式 ====================
const radioValue = shallowRef<string | number | null>("user-1");
const strictValue = shallowRef<Array<string | number>>(["dept-1-1"]);
const rowClickValue = shallowRef<Array<string | number>>([]);

// ==================== 懒加载 ====================
const lazyTreeRef = ref();
const lazyValue = shallowRef<Array<string | number>>([]);
const lazyStatus = shallowRef("待展开");

const lazyRootData: DemoNode[] = [
  { id: "lazy-1", label: "研发中心", type: "dept" },
  { id: "lazy-2", label: "设备部（模拟失败）", type: "dept" },
  { id: "lazy-3", label: "行政部", type: "dept" }
];

function isLazyLeaf(item: DemoNode) {
  return item.type === "member";
}

function mockLoadApi(node: { id: string | number }): Promise<DemoNode[]> {
  lazyStatus.value = "加载中…";
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (String(node.id) === "lazy-2") {
        reject(new Error("mock network error"));
        return;
      }

      resolve(
        Array.from({ length: 3 }, (_, index) => ({
          id: `${node.id}-child-${index + 1}`,
          label: `成员 ${index + 1}`,
          type: "member"
        }))
      );
    }, 600);
  });
}

function onLazyLoad(payload: any) {
  lazyStatus.value = `已加载 ${payload.children.length} 项`;
}

function onLazyLoadError(payload: any) {
  lazyStatus.value = "加载失败";
  uni.showModal({
    title: "加载失败",
    content: `重新加载「${payload.node.label}」？`,
    success: ({ confirm }) => {
      if (confirm) {
        lazyTreeRef.value?.retryLoad(payload.node.id);
      }
    }
  });
}

// ==================== 插槽定制 ====================
const slotData: DemoNode[] = [
  {
    id: "doc-1",
    label: "项目文档",
    count: 8,
    children: [
      { id: "doc-1-1", label: "需求说明.md", count: 0 },
      { id: "doc-1-2", label: "接口文档.md", count: 3 }
    ]
  },
  {
    id: "doc-2",
    label: "设计资源",
    count: 2,
    children: [
      { id: "doc-2-1", label: "首页视觉稿.fig" }
    ]
  }
];

// ==================== 弹窗选择 ====================
const showPopup = ref(false);
const popupValue = shallowRef<Array<string | number>>([]);
const popupDraftValue = shallowRef<Array<string | number>>([]);

const popupDisplayText = computed(() => {
  return popupValue.value.length ? `已选 ${popupValue.value.length} 项` : "请选择";
});

function openPopup() {
  // 弹窗内操作草稿值，确认时才回填，取消不影响已选
  popupDraftValue.value = [...popupValue.value];
  showPopup.value = true;
}

function confirmPopup() {
  popupValue.value = [...popupDraftValue.value];
  showPopup.value = false;
}
</script>

<style scoped lang='scss'>
.page {
  min-height: 100vh;
  background: var(--wot-filled-bottom, #f6f7fb);
}

.page__panel {
  padding: 24rpx;
}

.page__card {
  padding: 24rpx;
  background: var(--wot-filled-oppo, #ffffff);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(16, 24, 40, 0.04);

  & + .page__card {
    margin-top: 24rpx;
  }
}

.page__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.page__card-title {
  display: block;
  margin-bottom: 16rpx;
  color: var(--wot-text-main, #111827);
  font-size: 30rpx;
  font-weight: 600;
}

.page__card-header .page__card-title {
  margin-bottom: 0;
}

.page__card-desc-row {
  margin: 8rpx 0 16rpx;
  color: var(--wot-text-auxiliary, #667085);
  font-size: 24rpx;
  line-height: 36rpx;
}

// 弹窗
:deep(.page__popup) {
  border-radius: 32rpx 32rpx 0 0;
}

:deep(.page__tabs .wd-tabs__nav) {
  box-shadow: 0 1rpx 0 var(--wot-border-light, #e4e7ec);
}

.page__popup-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--wot-border-light, #e4e7ec);
}

.page__popup-title {
  color: var(--wot-text-main, #111827);
  font-size: 30rpx;
  font-weight: 600;
}

.page__popup-cancel {
  color: var(--wot-text-auxiliary, #667085);
  font-size: 28rpx;
}

.page__popup-confirm {
  color: var(--wot-primary-6, #299764);
  font-size: 28rpx;
  font-weight: 600;
}

.page__popup-body {
  height: 56vh;
  padding: 8rpx 0;
  overflow: hidden;
}
</style>