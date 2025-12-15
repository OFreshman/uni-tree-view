import { ComponentResolver } from '@uni-helper/vite-plugin-uni-components';

interface UniTreeListResolverOptions {
    exclude?: RegExp;
}
declare function UniTreeListResolver(options?: UniTreeListResolverOptions): ComponentResolver;

export { UniTreeListResolver };
export type { UniTreeListResolverOptions };
