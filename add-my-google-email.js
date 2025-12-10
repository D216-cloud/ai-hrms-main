/**
 * Script to add your Google email to the HR system
 * 
 * Usage:
 * node add-my-google-email.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service key are required in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGoogleUser() {
  try {
    // Replace with your actual Google email and name
    const email = "deepakmaheta04@gmail.com"; // <-- CHANGE THIS
    const name = "maheta deepak"; // <-- CHANGE THIS
    
    if (email === "YOUR_GOOGLE_EMAIL_HERE" || name === "YOUR_NAME_HERE") {
      console.error("Error: Please update the email and name variables in this script with your actual Google email and name");
      process.exit(1);
    }
    
    console.log(`Adding Google user to HR system...`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: hr (default)`);
    
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
      console.log(`Current role: ${existingUser.role}`);
      console.log("You're ready to sign in with Google!");
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
          role: 'hr', // default to hr role
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
    console.log("You're now ready to sign in with Google!");
    return data;
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the function
addGoogleUser();