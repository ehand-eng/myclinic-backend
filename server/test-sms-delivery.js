// Test script for SMS delivery status endpoint
const fetch = require('node-fetch');

const testSMSDeliveryStatus = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  // Test data - replace with actual booking ID
  const testData = {
    bookingId: 'YOUR_BOOKING_ID_HERE', // Replace with actual booking ID
    status: 'sent', // or 'delivered', 'failed'
    details: 'SMS sent successfully via gateway',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Testing SMS delivery status update...');
    console.log('Test data:', testData);

    const response = await fetch(`${baseUrl}/sms-delivery-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result);
    } else {
      console.log('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Run the test
testSMSDeliveryStatus();
