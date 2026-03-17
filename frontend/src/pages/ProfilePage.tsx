import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <dl>
        <dt>Name</dt>
        <dd>
          {user.first_name} {user.last_name}
        </dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
        {user.tenant && (
          <>
            <dt>Organization</dt>
            <dd>{user.tenant.name}</dd>
          </>
        )}
      </dl>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
