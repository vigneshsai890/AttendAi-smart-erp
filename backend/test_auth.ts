import axios from 'axios';

async function testAuthorize() {
  const credentials = {
    email: 'vignesh@apollo.edu',
    password: 'faculty123',
    totp: ''
  };

  try {
    const backendUrl = "http://localhost:5001";
    const endpoint = credentials.totp ? "/api/auth/verify-otp" : "/api/auth/login";
    const payload = credentials.totp
      ? { email: credentials.email, otp: credentials.totp }
      : { email: credentials.email, password: credentials.password };

    console.log('Calling:', backendUrl + endpoint);
    console.log('Payload:', payload);

    const res = await axios.post(`${backendUrl}${endpoint}`, payload);
    const user = res.data;
    console.log('Response:', user);

    if (user.requiresOTP) {
      console.log('Result: OTP_REQUIRED');
      return;
    }

    console.log('Result: Success', user);
  } catch (error: any) {
    console.log('Result: Error');
    console.log('Error message:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
  }
}

testAuthorize();
