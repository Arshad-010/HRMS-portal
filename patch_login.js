const fs = require('fs');
const path = 'frontend/src/pages/Login.jsx';
let content = fs.readFileSync(path, 'utf8');

const importReplacement = `import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Shield,
  Users,
  ArrowRight,
  RefreshCw
} from 'lucide-react';`;

content = content.replace(/import \{ useAuth \} from '\.\.\/context\/AuthContext';\nimport \{\s+Layers,\s+Mail,\s+Lock,\s+Eye,\s+EyeOff,\s+LogIn,\s+AlertCircle,\s+ShieldCheck,\s+Shield,\s+Users,\s+ArrowRight\s+\} from 'lucide-react';/m, importReplacement);


const statesReplacement = `  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeToken, setChallengeToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);`;

content = content.replace(/  const \[submitting, setSubmitting\] = useState\(false\);\n  const \[errorMessage, setErrorMessage\] = useState\(''\);/, statesReplacement);

const methodsReplacement = `  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (result.requires2FA) {
        setRequires2FA(true);
        setChallengeToken(result.challengeToken);
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setErrorMessage(result.error);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!twoFactorCode) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setSubmitting(true);
    const result = await useAuth().verify2FALogin(challengeToken, twoFactorCode, isRecoveryMode);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };`;

content = content.replace(/  const handleSubmit = async \(e\) => \{[\s\S]*?  \};/m, methodsReplacement);

const googleSubmitReplacement = `  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setSubmitting(true);
    const result = await loginWithGoogle();
    setSubmitting(false);

    if (result.success) {
      if (result.requires2FA) {
        setRequires2FA(true);
        setChallengeToken(result.challengeToken);
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setErrorMessage(result.error);
    }
  };`;

content = content.replace(/  const handleGoogleLogin = async \(\) => \{[\s\S]*?  \};/m, googleSubmitReplacement);

const renderReplacement = `        {/* Two-Factor Auth Step */}
        {requires2FA ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-500 mt-2">
                {isRecoveryMode 
                  ? "Enter one of your emergency recovery codes." 
                  : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={isRecoveryMode ? "Recovery Code (e.g., a1b2-c3d4)" : "6-Digit Code"}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(isRecoveryMode ? e.target.value : e.target.value.replace(/\\D/g, ''))}
                  maxLength={isRecoveryMode ? 20 : 6}
                  required
                  autoFocus
                  className="w-full text-center tracking-widest text-lg px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none transition-all"
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting || (!isRecoveryMode && twoFactorCode.length !== 6)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Verify'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
            
            <div className="text-center">
              <button 
                onClick={() => { setIsRecoveryMode(!isRecoveryMode); setTwoFactorCode(''); setErrorMessage(''); }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {isRecoveryMode ? 'Use Authenticator App instead' : 'Lost access to your authenticator?'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">`;

content = content.replace(/          <form onSubmit=\{handleSubmit\} className="space-y-5">/, renderReplacement);

const endFormReplacement = `              </button>
            </div>
          </form>
        )}`;

content = content.replace(/              <\/button>\n            <\/div>\n          <\/form>/, endFormReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Login.jsx updated');
