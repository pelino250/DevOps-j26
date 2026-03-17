import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore, type TripStartData } from '../store/tripStore';
import { useVehicleStore } from '../store/vehicleStore';
import { useDriverStore } from '../store/driverStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/layout/PageHeader';

export default function TripStartPage() {
  const navigate = useNavigate();
  const { startTrip, loading, error } = useTripStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { drivers, fetchDrivers } = useDriverStore();

  const [formData, setFormData] = useState<TripStartData>({
    vehicle_id: 0,
    driver_id: 0,
    start_time: new Date().toISOString().slice(0, 16),
    start_mileage: 0,
    start_location: '',
    purpose: '',
  });

  useEffect(() => {
    fetchVehicles({ status: 'active' });
    fetchDrivers();
  }, [fetchVehicles, fetchDrivers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await startTrip(formData);
      navigate('/trips');
    } catch (err) {
      console.error('Failed to start trip:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'vehicle_id' || name === 'driver_id' || name === 'start_mileage'
        ? Number(value)
        : value,
    }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = Number(e.target.value);
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);

    setFormData((prev) => ({
      ...prev,
      vehicle_id: vehicleId,
      start_mileage: selectedVehicle?.current_mileage || 0,
    }));
  };

  return (
    <div>
      <PageHeader
        title="Start Trip"
        description="Begin a new trip"
      />

      {error && (
        <Card className="mb-6 p-4 bg-danger/10 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_id">Vehicle</Label>
                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={handleVehicleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="driver_id">Driver</Label>
                <select
                  id="driver_id"
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select a driver...</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.user.id}>
                      {driver.user.first_name} {driver.user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="start_mileage">Start Mileage (km)</Label>
                <Input
                  id="start_mileage"
                  name="start_mileage"
                  type="number"
                  value={formData.start_mileage}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="start_location">Start Location</Label>
                <Input
                  id="start_location"
                  name="start_location"
                  value={formData.start_location}
                  onChange={handleChange}
                  placeholder="e.g., Kigali Office"
                />
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="e.g., Customer delivery"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Starting...' : 'Start Trip'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/trips')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
