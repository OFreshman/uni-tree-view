import { ComponentResolver } from '@uni-helper/vite-plugin-uni-components';

interface UniTreeViewResolverOptions {
    exclude?: RegExp;
}
declare function UniTreeViewResolver(options?: UniTreeViewResolverOptions): ComponentResolver;

export { UniTreeViewResolver };
export type { UniTreeViewResolverOptions };
