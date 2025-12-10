/**
 * Script to add a Google user to the HR system
 * 
 * Usage:
 * node add-google-user.js <email> <name> [role]
 * 
 * Example:
 * node add-google-user.js john.doe@company.com "John Doe" hr
 * node add-google-user.js admin@company.com "Admin User" admin
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const name = args[1];
const role = args[2] || 'hr'; // default to 'hr' role

// Validate arguments
if (!email || !name) {
  console.error('Error: Email and name are required');
  console.log('Usage: node add-google-user.js <email> <name> [role]');
  console.log('Example: node add-google-user.js john.doe@company.com "John Doe" hr');
  process.exit(1);
}

// Validate role
if (role !== 'hr' && role !== 'admin') {
  console.error('Error: Role must be either "hr" or "admin"');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service key are required in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGoogleUser() {
  try {
    console.log(`Adding Google user to HR system...`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('hr_users')
      .select('id, email, name, role')
      .eq('email', email)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw new Error(`Error checking existing user: ${fetchError.message}`);
    }
    
    if (existingUser) {
      console.log(`User already exists with ID: ${existingUser.id}`);
      
      // Update user if role is different
      if (existingUser.role !== role) {
        const { data, error: updateError } = await supabase
          .from('hr_users')
          .update({ role: role })
          .eq('id', existingUser.id);
        
        if (updateError) {
          throw new Error(`Error updating user role: ${updateError.message}`);
        }
        
        console.log(`User role updated to: ${role}`);
      } else {
        console.log(`User already has the correct role: ${role}`);
      }
      
      return existingUser;
    }
    
    // Create a placeholder password hash for Google users
    // (They won't use this since they'll sign in with Google)
    const placeholderPassword = 'google-auth-user-' + Date.now();
    const passwordHash = placeholderPassword; // In a real scenario, you'd hash this
    
    // Insert new user
    const { data, error } = await supabase
      .from('hr_users')
      .insert([
        {
          email: email,
          name: name,
          role: role,
          password_hash: passwordHash,
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
    
    console.log(`User created successfully with ID: ${data.id}`);
    return data;
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the function
addGoogleUser();