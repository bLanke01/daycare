// app/auth/page.js
import UserTypeSelection from '../components/auth/UserTypeSelection';

export default function AuthLanding() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to Daycare Management</h1>
        <p className="text-base-content/70">Choose how you would like to access the system</p>
      </div>
      <UserTypeSelection />
    </div>
  );
}