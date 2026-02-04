/**
 * Debug Authentication Utility
 * Run this in the browser console to check auth state
 */

// Check authentication state
console.group('🔍 Authentication Debug Info');
console.log('Token exists:', !!localStorage.getItem('neyborhuud_access_token'));
console.log('Token preview:', localStorage.getItem('neyborhuud_access_token')?.substring(0, 30) + '...');
console.log('User data exists:', !!localStorage.getItem('neyborhuud_user'));
console.log('User data:', JSON.parse(localStorage.getItem('neyborhuud_user') || 'null'));
console.groupEnd();

// Test the gossip endpoint
async function testGossipEndpoint() {
  console.group('🧪 Testing Gossip Endpoint');
  try {
    const token = localStorage.getItem('neyborhuud_access_token');
    const baseURL = 'https://neyborhuud-serverside.onrender.com/api/v1';
    
    console.log('Making request to:', `${baseURL}/gossip`);
    console.log('With token:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
    
    const response = await fetch(`${baseURL}/gossip`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.status === 401) {
      console.error('❌ Got 401 error');
      console.error('Error message:', data.message || data.error);
    } else {
      console.log('✅ Request successful');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  console.groupEnd();
}

// Run the test
testGossipEndpoint();
