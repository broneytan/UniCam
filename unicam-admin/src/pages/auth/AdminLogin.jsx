
import { useState } from 'react';
import { GraduationCap, LockKeyhole, Mail } from 'lucide-react';
import api from '../../api/api';
import graduationStudent from '../../assets/graduation-student.png';
import './AdminLogin.css';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          alt="Graduate holding a university guide"
        />
        <div className="login-form-area">
          <div className="login-panel">
            <div className="login-brand">
              <div className="login-brand__icon">
                <GraduationCap size={28} />
              </div>
              <div>
                <p className="login-brand__eyebrow">University administration</p>
                <h1>UniCam Admin</h1>
              </div>
            </div>

            <p className="login-subtitle">Sign in to access the university dashboard.</p>

            <form className="login-form" onSubmit={handleLogin}>
              <label className="login-field">
                <span>Email</span>
                <div className="login-field__input-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@unicam.edu"
                    required
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-field__input-wrap">
                  <LockKeyhole size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </label>

              {error && <p className="login-error">{error}</p>}

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
