
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import api from '../../api/api';
import { useLanguage } from '../../i18n/LanguageContext';
import graduationStudent from '../../assets/graduation-student.png';
import './AdminLogin.css';

function AdminLogin({ onLogin }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/admin/login', {
        email,
        password,
      });

      const token = response.data.token;

      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }

      localStorage.setItem('admin_token', token);
      onLogin(response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <img
          className="login-image"
          src={graduationStudent}
          alt={t('Graduate holding a university guide')}
        />
        <div className="login-form-area">
          <div className="login-panel">
            <div className="login-brand">
              <img
                className="login-brand__logo"
                src="/images/unicam-logo.png"
                alt="UniCam"
              />
              <p className="login-brand__eyebrow">{t('University administration')}</p>
              <h1>UniCam Admin</h1>
            </div>

            {/* <p className="login-subtitle">
              {t('Sign in to access the university dashboard.')}
            </p> */}

            <form className="login-form" onSubmit={handleLogin}>
              <label className="login-field">
                <span>{t('Email')}</span>
                <div className="login-field__input-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('Enter email')}
                    required
                  />
                </div>
              </label>

              <div className="login-field">
                <label htmlFor="admin-password">{t('Password')}</label>
                <div className="login-field__input-wrap">
                  <LockKeyhole size={16} />
                  <input
                    id="admin-password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('Enter password')}
                    required
                  />
                  <button
                    className="login-password-toggle"
                    type="button"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={t(passwordVisible ? 'Hide password' : 'Show password')}
                    title={t(passwordVisible ? 'Hide password' : 'Show password')}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && <p className="login-error">{t(error)}</p>}

              <button className="login-btn" type="submit" disabled={loading}>
                {t(loading ? 'Signing in...' : 'Login')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
