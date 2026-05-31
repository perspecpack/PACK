import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

// Safe client initialization to prevent boot-time crash if environment variables are missing or misconfigured.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

/**
 * Uploads a file to a specific Supabase storage bucket under a structured path.
 * Path structure: organization-slug/module-type/timestamp-file-name
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string,
  orgSlug: string,
  moduleType: string
): Promise<{ publicUrl: string; path: string }> {
  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    throw new Error('As credenciais do Supabase não estão configuradas. Por favor, adicione-as nas configurações do projeto.');
  }

  // Clean filename to prevent weird characters
  const cleanFileName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  // Format timestamp (YYYY-MM-DD-HHmmss)
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0] + '-' + date.toTimeString().split(' ')[0].replace(/:/g, '');
  
  const path = `${orgSlug}/${moduleType}/${timestamp}-${cleanFileName}`;
  
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
    path: data.path
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

