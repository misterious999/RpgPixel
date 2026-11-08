import fs from 'fs';

const globalSupabase = '/usr/local/lib/node_modules/@supabase/supabase-js';
const alias = fs.existsSync(globalSupabase) ? { '@supabase/supabase-js': globalSupabase } : {};

const currentBuildTime = Date.now().toString();

function autoVersionPlugin() {
  return {
    name: 'auto-version-plugin',
    buildStart() {
      const payload = JSON.stringify(
        {
          version: currentBuildTime,
          buildTime: new Date().toISOString()
        },
        null,
        2
      );
      try {
        fs.writeFileSync('./public/version.json', payload);
      } catch (e) {
        console.warn('Could not write public/version.json:', e);
      }
    }
  };
}

export default {
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  resolve: {
    alias
  },
  plugins: [autoVersionPlugin()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(currentBuildTime)
  }
};
