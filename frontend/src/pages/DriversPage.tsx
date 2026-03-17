import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Trash2, Edit } from 'lucide-react';
import { useDriverStore } from '../store/driverStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function DriversPage() {
  const navigate = useNavigate();
  const { drivers, totalCount, loading, error, fetchDrivers, deleteDriver } = useDriverStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrivers({ search: search || undefined });
  }, [fetchDrivers, search]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(id);
      } catch (err) {
        console.error('Failed to delete driver:', err);
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        description={`Manage your ${totalCount} drivers`}
        actions={
          <Button onClick={() => navigate('/drivers/new')}>
            <UserPlus size={18} />
            Add Driver
          </Button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
            <Input
              type="search"
              placeholder="Search name, email, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 p-4 bg-danger/10 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        {loading && drivers.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No drivers found. Add your first driver to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>License Class</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Emergency Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    {driver.user.first_name} {driver.user.last_name}
                  </TableCell>
                  <TableCell>{driver.user.email}</TableCell>
                  <TableCell>{driver.license_number}</TableCell>
                  <TableCell>{driver.license_class}</TableCell>
                  <TableCell>
                    {new Date(driver.license_expiry).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{driver.emergency_contact_name}</div>
                      <div className="text-text-secondary">{driver.emergency_contact_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/drivers/${driver.id}/edit`)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(driver.id)}
                      >
                        <Trash2 size={16} className="text-danger" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
