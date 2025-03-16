import { ProfilePage } from '@/components/profile-page';
import { ProtectedRoute } from '@/components/protected-route';

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
