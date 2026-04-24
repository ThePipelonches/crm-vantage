import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssduoqrbkwyucqomwbix.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_XqIgIUzv8bGSOS3_YwVuEQ_8_R0GLgu';

export const supabase = createClient(supabaseUrl, supabaseKey);