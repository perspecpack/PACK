import { createClient } from '@supabase/supabase-js';

const sanitizeEnvVal = (val: string) => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

const supabaseUrl = sanitizeEnvVal(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '');
const supabaseAnonKey = sanitizeEnvVal(
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  ''
);

console.log('[Supabase Config] URL Status:', supabaseUrl ? 'LOADED' : 'MISSING');
console.log('[Supabase Config] Key Status:', supabaseAnonKey ? 'LOADED' : 'MISSING');

// Safe client initialization to prevent boot-time crash if environment variables are missing or misconfigured.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

/**
 * Uploads a file to a specific Supabase storage bucket under a structured path.
 * Path structure: organization-slug/module-type/revision/uuid.ext
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string,
  orgSlug: string,
  moduleType: string,
  revision?: string
): Promise<{ publicUrl: string; path: string; originalName: string }> {
  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    throw new Error('As credenciais do Supabase não estão configuradas. Por favor, adicione-as nas configurações do projeto.');
  }

  // Safe UUID generator
  const generateUUID = () => {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const ext = file.name.split('.').pop() || '';
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const uuidName = `${generateUUID()}${cleanExt ? `.${cleanExt}` : ''}`;
  
  const cleanRevision = revision 
    ? revision.replace(/[^a-zA-Z0-9.-]/g, '_') 
    : 'no_rev';

  // Construct secure path: organization/module_type/revision/uuid.ext
  const path = `${orgSlug}/${moduleType}/${cleanRevision}/${uuidName}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return {
    publicUrl,
    path: data.path,
    originalName: file.name
  };
}

/**
 * Deletes a file from Supabase storage by its path or public URL.
 */
export async function deleteFileFromStorage(bucket: string, pathOrUrl: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey || !supabase || !pathOrUrl) return;
  
  try {
    // Extract path if it is a full URL
    let path = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
      const parts = pathOrUrl.split(`/storage/v1/object/public/${bucket}/`);
      if (parts.length > 1) {
        path = parts[1];
      }
    }
    
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Error deleting file from storage:', error);
    }
  } catch (err) {
    console.error('Error parsing file path for deletion:', err);
  }
}

