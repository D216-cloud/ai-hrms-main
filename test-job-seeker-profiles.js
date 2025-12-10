/**
 * Test Job Seeker Profiles API
 * This script tests the new job seeker profiles API endpoint
 */

import { supabaseAdmin } from './lib/supabase.js';

async function testJobSeekerProfiles() {
  console.log('Testing Job Seeker Profiles API...\n');
  
  // Test email for job seeker
  const testEmail = 'test.seeker@example.com';
  const testName = 'Test Seeker';
  
  try {
    // 1. Check if profile exists
    console.log('1. Checking if profile exists...');
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking profile:', fetchError);
      return;
    }
    
    if (!profile) {
      console.log('   Profile not found, creating...');
      // Create profile
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .insert([
          {
            email: testEmail,
            fullName: testName,
            phone: '+1234567890',
            location: 'New York, NY',
            title: 'Software Engineer',
            bio: 'Passionate software engineer with 5 years of experience',
            profileImage: '',
            resume: '',
            skills: JSON.stringify([
              { id: 1, name: 'JavaScript', level: 'Advanced' },
              { id: 2, name: 'React', level: 'Intermediate' }
            ]),
            experience: JSON.stringify([
              {
                id: 1,
                title: 'Senior Developer',
                company: 'Tech Corp',
                description: 'Led development team',
                startDate: '2020-01-01',
                endDate: '2023-12-31',
                isCurrent: false
              }
            ]),
            education: JSON.stringify([
              {
                id: 1,
                school: 'University of Technology',
                degree: 'BS Computer Science',
                fieldOfStudy: 'Computer Science',
                graduationYear: 2020,
                gpa: '3.8'
              }
            ]),
            certifications: JSON.stringify([]),
            profileCompletion: 85,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating profile:', createError);
        return;
      }
      
      profile = newProfile;
      console.log('   Created profile with ID:', profile.id);
    } else {
      console.log('   Found existing profile with ID:', profile.id);
    }
    
    // 2. Test updating profile
    console.log('\n2. Updating profile...');
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .update({
        fullName: 'Updated Test Seeker',
        phone: '+1987654321',
        updatedAt: new Date().toISOString()
      })
      .eq('email', testEmail)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }
    
    console.log('   Profile updated successfully');
    console.log('   New name:', updatedProfile.fullName);
    console.log('   New phone:', updatedProfile.phone);
    
    // 3. Test updating skills
    console.log('\n3. Updating skills...');
    const newSkills = [
      { id: 1, name: 'JavaScript', level: 'Expert' },
      { id: 2, name: 'React', level: 'Advanced' },
      { id: 3, name: 'Node.js', level: 'Intermediate' }
    ];
    
    const { data: skillsUpdatedProfile, error: skillsError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .update({
        skills: JSON.stringify(newSkills),
        updatedAt: new Date().toISOString()
      })
      .eq('email', testEmail)
      .select()
      .single();
      
    if (skillsError) {
      console.error('Error updating skills:', skillsError);
      return;
    }
    
    console.log('   Skills updated successfully');
    console.log('   Number of skills:', JSON.parse(skillsUpdatedProfile.skills).length);
    
    console.log('\n✅ Job Seeker Profiles API Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('  - Profile ID:', profile.id);
    console.log('  - Email:', profile.email);
    console.log('  - Name:', updatedProfile.fullName);
    console.log('  - Phone:', updatedProfile.phone);
    console.log('  - Skills count:', JSON.parse(skillsUpdatedProfile.skills).length);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testJobSeekerProfiles();