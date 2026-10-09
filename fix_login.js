const fs = require('fs');
const path = 'frontend/src/pages/Login.jsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '<form onSubmit={handleSubmit} className="space-y-4">';
const endStr = '              <span>Continue with Google</span>\r\n            </button>\r\n          </div>';
let endStrUnix = '              <span>Continue with Google</span>\n            </button>\n          </div>';

let actualEndStr = content.includes(endStr) ? endStr : endStrUnix;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(actualEndStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end block", startIdx, endIdx);
  process.exit(1);
}

const replaceMe = content.substring(startIdx, endIdx + actualEndStr.length);

const newRender = "{requires2FA ? (\n\
          <div className=\"space-y-6\">\n\
            <div className=\"text-center\">\n\
              <div className=\"mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4\">\n\
                <ShieldCheck className=\"w-6 h-6 text-indigo-600 dark:text-indigo-400\" />\n\
              </div>\n\
              <h2 className=\"text-xl font-bold text-slate-900 dark:text-white\">Two-Factor Authentication</h2>\n\
              <p className=\"text-sm text-slate-500 dark:text-slate-400 mt-2\">\n\
                {isRecoveryMode \n\
                  ? \"Enter one of your emergency recovery codes.\"\n\
                  : \"Enter the 6-digit code from your authenticator app.\"}\n\
              </p>\n\
            </div>\n\
\n\
            <form onSubmit={handle2FASubmit} className=\"space-y-4\">\n\
              <div>\n\
                <input\n\
                  type=\"text\"\n\
                  placeholder={isRecoveryMode ? \"Recovery Code (e.g., a1b2-c3d4)\" : \"6-Digit Code\"}\n\
                  value={twoFactorCode}\n\
                  onChange={(e) => setTwoFactorCode(isRecoveryMode ? e.target.value : e.target.value.replace(/\\D/g, ''))}\n\
                  maxLength={isRecoveryMode ? 20 : 6}\n\
                  required\n\
                  autoFocus\n\
                  className=\"w-full text-center tracking-widest text-lg px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all shadow-sm text-slate-900 dark:text-white\"\n\
                />\n\
              </div>\n\
              \n\
              <button\n\
                type=\"submit\"\n\
                disabled={submitting || (!isRecoveryMode && twoFactorCode.length !== 6)}\n\
                className=\"w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/25\"\n\
              >\n\
                {submitting ? 'Verifying...' : 'Verify Code'}\n\
                {!submitting && <ArrowRight className=\"w-4 h-4\" />}\n\
              </button>\n\
            </form>\n\
            \n\
            <div className=\"text-center\">\n\
              <button \n\
                type=\"button\"\n\
                onClick={() => { setIsRecoveryMode(!isRecoveryMode); setTwoFactorCode(''); setErrorMessage(''); }}\n\
                className=\"text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors cursor-pointer\"\n\
              >\n\
                {isRecoveryMode ? 'Use Authenticator App instead' : 'Lost access to your authenticator?'}\n\
              </button>\n\
            </div>\n\
          </div>\n\
        ) : (\n\
          <>\n" + replaceMe + "\n          </>\n        )}";

content = content.replace(replaceMe, newRender);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched Login.jsx');
