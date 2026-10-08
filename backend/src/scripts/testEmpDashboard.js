import http from 'http';

const loginData = JSON.stringify({ email: 'lohithbasetti@gmail.com', password: 'password123' }); // Try standard seeded password first
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
    if (!data.success) {
       console.log('Login failed:', data.message);
       // Try alternative password
       const loginData2 = JSON.stringify({ email: 'lohithbasetti@gmail.com', password: 'lohith2605' });
       const loginOptions2 = { ...loginOptions, headers: { 'Content-Type': 'application/json', 'Content-Length': loginData2.length }};
       const req2 = http.request(loginOptions2, res2 => {
         let body2 = ''; res2.on('data', d => body2 += d); res2.on('end', () => {
           const data2 = JSON.parse(body2);
           if (!data2.success) return console.log('Login 2 failed:', data2);
           testDash(data2.data.token);
         });
       });
       req2.write(loginData2); req2.end();
       return;
    }
    testDash(data.data.token);
  });
});
req.on('error', err => console.log('Login error:', err.message));
req.write(loginData);
req.end();

function testDash(token) {
    console.log('Login successful, got token');
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
    dashReq.setTimeout(5000, () => {
      console.log('Dashboard request timed out!');
      dashReq.destroy();
    });
    dashReq.end();
}
