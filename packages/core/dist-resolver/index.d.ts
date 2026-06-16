import { ComponentResolver } from '@uni-helper/vite-plugin-uni-components';

interface UniTreeViewResolverOptions {
    exclude?: RegExp;
}
declare function UniTreeViewResolver(options?: UniTreeViewResolverOptions): ComponentResolver;
type UniTreeListResolverOptions = UniTreeViewResolverOptions;
declare const UniTreeListResolver: typeof UniTreeViewResolver;

export { UniTreeListResolver, UniTreeViewResolver };
export type { UniTreeListResolverOptions, UniTreeViewResolverOptions };
