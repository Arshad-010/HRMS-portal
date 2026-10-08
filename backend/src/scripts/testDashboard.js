import http from 'http';

const loginData = JSON.stringify({ email: 'admin@example.com', password: 'lohith2605' });
const loginOptions = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
};

const req = http.request(loginOptions, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.data.token;
    console.log('Login successful, got token');
    
    // Now request dashboard
    const dashOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const t0 = Date.now();
    const dashReq = http.request(dashOptions, dashRes => {
      let dashBody = '';
      dashRes.on('data', d => dashBody += d);
      dashRes.on('end', () => {
        console.log(`Dashboard STATUS: ${dashRes.statusCode} in ${Date.now() - t0}ms`);
      });
    });
    dashReq.on('error', err => console.log('Dashboard error:', err.message));
    dashReq.end();
  });
});
req.on('error', err => console.log('Login error:', err.message));
req.write(loginData);
req.end();
