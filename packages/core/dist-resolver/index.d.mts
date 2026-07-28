import { ComponentResolverObject } from '@uni-helper/vite-plugin-uni-components';

interface UniTreeViewResolverOptions {
    exclude?: RegExp;
}
declare function UniTreeViewResolver(options?: UniTreeViewResolverOptions): ComponentResolverObject;

export { UniTreeViewResolver };
export type { UniTreeViewResolverOptions };
