import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Carga .env en process.env


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
