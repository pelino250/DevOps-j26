import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function TripsPage() {
  const navigate = useNavigate();
  const { trips, totalCount, loading, error, fetchTrips, cancelTrip } = useTripStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTrips({
      search: search || undefined,
      status: statusFilter || undefined,
    });
  }, [fetchTrips, search, statusFilter]);

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this trip?')) {
      try {
        await cancelTrip(id);
      } catch (err) {
        console.error('Failed to cancel trip:', err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'secondary'> = {
      completed: 'success',
      in_progress: 'warning',
      cancelled: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Trips"
        description={`Manage your ${totalCount} trips`}
        actions={
          <Button onClick={() => navigate('/trips/start')}>
            <Plus size={18} />
            Start Trip
          </Button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
            <Input
              type="search"
              placeholder="Search location, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 p-4 bg-danger/10 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        {loading && trips.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No trips found. Start a new trip to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">
                    {trip.vehicle.make} {trip.vehicle.model}
                    <div className="text-sm text-text-secondary">{trip.vehicle.license_plate}</div>
                  </TableCell>
                  <TableCell>
                    {trip.driver.first_name} {trip.driver.last_name}
                  </TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(trip.start_time).toLocaleString()}</div>
                      <div className="text-text-secondary">{trip.start_location}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {trip.end_time ? (
                      <div className="text-sm">
                        <div>{new Date(trip.end_time).toLocaleString()}</div>
                        <div className="text-text-secondary">{trip.end_location}</div>
                      </div>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {trip.distance_km ? `${trip.distance_km} km` : '-'}
                  </TableCell>
                  <TableCell>
                    {trip.duration_hours ? `${trip.duration_hours.toFixed(1)} hrs` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {trip.status === 'in_progress' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/trips/${trip.id}/complete`)}
                        >
                          <CheckCircle size={16} className="text-success" />
                        </Button>
                      )}
                      {trip.status === 'in_progress' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(trip.id)}
                        >
                          <XCircle size={16} className="text-danger" />
                        </Button>
                      )}
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
