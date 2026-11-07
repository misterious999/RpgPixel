import fs from 'fs';

const globalSupabase = '/usr/local/lib/node_modules/@supabase/supabase-js';
const alias = fs.existsSync(globalSupabase) ? { '@supabase/supabase-js': globalSupabase } : {};

export default {
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  resolve: {
    alias
  }
};
