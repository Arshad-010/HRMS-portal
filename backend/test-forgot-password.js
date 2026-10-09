import fetch from 'node-fetch';

async function test() {
  console.log("Testing forgot password...");
  const res = await fetch('http://localhost:5001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hrms.portal' })
  });
  const data = await res.json();
  console.log(data);
}

test();
