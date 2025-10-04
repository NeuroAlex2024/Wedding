import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '200.html'
    }),
    alias: {
      $components: 'src/lib/components',
      $ui: 'src/lib/components/ui',
      $lib: 'src/lib'
    },
    paths: {
      base: ''
    },
    trailingSlash: 'never',
    inlineStyleThreshold: 1024,
    csp: {
      mode: 'auto'
    }
  }
};

export default config;
