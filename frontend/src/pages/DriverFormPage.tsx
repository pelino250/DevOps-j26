import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDriverStore, type DriverFormData } from '../store/driverStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/layout/PageHeader';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function DriverFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDriver, fetchDriver, createDriver, updateDriver, loading, error } = useDriverStore();

  const [driverUsers, setDriverUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<DriverFormData>({
    user_id: 0,
    license_number: '',
    license_expiry: '',
    license_class: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    // Fetch users with driver role
    const fetchDriverUsers = async () => {
      try {
        const response = await api.get('/auth/users/?role=driver');
        setDriverUsers(response.data.results || []);
      } catch (err) {
        console.error('Failed to fetch driver users:', err);
      }
    };

    fetchDriverUsers();

    if (id) {
      fetchDriver(Number(id));
    }
  }, [id, fetchDriver]);

  useEffect(() => {
    if (currentDriver && isEditMode) {
      setFormData({
        user_id: currentDriver.user.id,
        license_number: currentDriver.license_number,
        license_expiry: currentDriver.license_expiry,
        license_class: currentDriver.license_class,
        date_of_birth: currentDriver.date_of_birth,
        emergency_contact_name: currentDriver.emergency_contact_name,
        emergency_contact_phone: currentDriver.emergency_contact_phone,
        notes: currentDriver.notes || '',
      });
    }
  }, [currentDriver, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && id) {
        await updateDriver(Number(id), formData);
      } else {
        await createDriver(formData);
      }
      navigate('/drivers');
    } catch (err) {
      console.error('Failed to save driver:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'user_id' ? Number(value) : value,
    }));
  };

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Driver' : 'Add Driver'}
        description={isEditMode ? 'Update driver information' : 'Create a new driver profile'}
      />

      {error && (
        <Card className="mb-6 p-4 bg-danger/10 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isEditMode && (
              <div>
                <Label htmlFor="user_id">Driver User</Label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a driver user...</option>
                  {driverUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="license_class">License Class</Label>
                <Input
                  id="license_class"
                  name="license_class"
                  value={formData.license_class}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Class 5, CDL-A"
                />
              </div>

              <div>
                <Label htmlFor="license_expiry">License Expiry</Label>
                <Input
                  id="license_expiry"
                  name="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Additional notes about this driver..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditMode ? 'Update Driver' : 'Create Driver'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/drivers')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
