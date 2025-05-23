// app/auth/page.js
import UserTypeSelection from '../components/auth/UserTypeSelection';

export default function AuthLanding() {
  return (
    <div className="auth-page">
      <div className="auth-page-title">
        <h1>Login between two users</h1>
      </div>
      <div className="auth-container">
        <UserTypeSelection />
      </div>
    </div>
  );
}