/**
 * Test Job Seeker Login Flow
 * This script tests the job seeker authentication and profile creation flow
 */

import { supabaseAdmin } from './lib/supabase.js';

async function testJobSeekerFlow() {
  console.log('Testing Job Seeker Login Flow...\n');
  
  // Test email for job seeker
  const testEmail = 'jobseeker.test@example.com';
  const testName = 'Test Job Seeker';
  
  try {
    // 1. Check if job seeker exists in hr_users table
    console.log('1. Checking if user exists in hr_users table...');
    let { data: hrUser, error: hrError } = await supabaseAdmin
      .from('hr_users')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (hrError && hrError.code !== 'PGRST116') {
      console.error('Error checking hr_users:', hrError);
      return;
    }
    
    if (!hrUser) {
      console.log('   User not found in hr_users, creating...');
      // Create user in hr_users with job_seeker role
      const { data: newHrUser, error: createHrError } = await supabaseAdmin
        .from('hr_users')
        .insert([
          {
            email: testEmail,
            name: testName,
            role: 'job_seeker',
            password_hash: 'test-password-hash',
            is_active: true
          }
        ])
        .select()
        .single();
        
      if (createHrError) {
        console.error('Error creating hr_user:', createHrError);
        return;
      }
      
      hrUser = newHrUser;
      console.log('   Created hr_user with ID:', hrUser.id);
    } else {
      console.log('   Found existing hr_user with ID:', hrUser.id);
    }
    
    // 2. Check if job seeker profile exists
    console.log('\n2. Checking if job seeker profile exists...');
    let { data: seekerProfile, error: seekerError } = await supabaseAdmin
      .from('job_seekers')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (seekerError && seekerError.code !== 'PGRST116') {
      console.error('Error checking job_seekers:', seekerError);
      return;
    }
    
    if (!seekerProfile) {
      console.log('   Job seeker profile not found, creating...');
      // Create job seeker profile
      const { data: newSeeker, error: createSeekerError } = await supabaseAdmin
        .from('job_seekers')
        .insert([
          {
            auth_id: hrUser.id,
            email: testEmail,
            full_name: testName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (createSeekerError) {
        console.error('Error creating job seeker profile:', createSeekerError);
        return;
      }
      
      seekerProfile = newSeeker;
      console.log('   Created job seeker profile with ID:', seekerProfile.id);
    } else {
      console.log('   Found existing job seeker profile with ID:', seekerProfile.id);
    }
    
    // 3. Test adding a skill
    console.log('\n3. Adding a test skill...');
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('job_seeker_skills')
      .insert([
        {
          seeker_id: seekerProfile.id,
          skill_name: 'JavaScript',
          proficiency_level: 'intermediate',
          years_of_experience: 3
        }
      ])
      .select()
      .single();
      
    if (skillError) {
      if (skillError.code === '23505') {
        console.log('   Skill already exists (duplicate key error)');
      } else {
        console.error('Error adding skill:', skillError);
        return;
      }
    } else {
      console.log('   Added skill with ID:', skill.id);
    }
    
    // 4. Test adding experience
    console.log('\n4. Adding test experience...');
    const { data: experience, error: expError } = await supabaseAdmin
      .from('job_seeker_experience')
      .insert([
        {
          seeker_id: seekerProfile.id,
          title: 'Software Developer',
          company_name: 'Tech Corp',
          description: 'Worked on various web projects',
          start_date: '2020-01-01',
          end_date: '2022-12-31',
          is_current_job: false
        }
      ])
      .select()
      .single();
      
    if (expError) {
      console.error('Error adding experience:', expError);
      return;
    } else {
      console.log('   Added experience with ID:', experience.id);
    }
    
    // 5. Test adding education
    console.log('\n5. Adding test education...');
    const { data: education, error: eduError } = await supabaseAdmin
      .from('job_seeker_education')
      .insert([
        {
          seeker_id: seekerProfile.id,
          school_name: 'University of Technology',
          degree: 'Bachelor of Science',
          field_of_study: 'Computer Science',
          graduation_year: 2020,
          gpa: '3.8'
        }
      ])
      .select()
      .single();
      
    if (eduError) {
      console.error('Error adding education:', eduError);
      return;
    } else {
      console.log('   Added education with ID:', education.id);
    }
    
    console.log('\n✅ Job Seeker Flow Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('  - HR User ID:', hrUser.id);
    console.log('  - Job Seeker Profile ID:', seekerProfile.id);
    console.log('  - Skill added: JavaScript');
    console.log('  - Experience added: Software Developer at Tech Corp');
    console.log('  - Education added: BS in Computer Science');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testJobSeekerFlow();