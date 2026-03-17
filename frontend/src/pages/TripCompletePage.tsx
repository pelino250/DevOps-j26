import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTripStore, type TripCompleteData } from '../store/tripStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/layout/PageHeader';

export default function TripCompletePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, fetchTrip, completeTrip, loading, error } = useTripStore();

  const [formData, setFormData] = useState<TripCompleteData>({
    end_time: new Date().toISOString().slice(0, 16),
    end_mileage: 0,
    end_location: '',
    fuel_consumed: undefined,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchTrip(Number(id));
    }
  }, [id, fetchTrip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      await completeTrip(Number(id), formData);
      navigate('/trips');
    } catch (err) {
      console.error('Failed to complete trip:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'end_mileage' || name === 'fuel_consumed'
        ? value ? Number(value) : undefined
        : value,
    }));
  };

  if (!currentTrip && !loading) {
    return (
      <div>
        <PageHeader title="Trip Not Found" description="The requested trip could not be found" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Complete Trip"
        description={`Complete trip for ${currentTrip?.vehicle.make} ${currentTrip?.vehicle.model}`}
      />

      {error && (
        <Card className="mb-6 p-4 bg-danger/10 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      {currentTrip && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-text-secondary">Vehicle</Label>
                <p className="font-medium">
                  {currentTrip.vehicle.make} {currentTrip.vehicle.model}
                </p>
                <p className="text-sm text-text-secondary">{currentTrip.vehicle.license_plate}</p>
              </div>
              <div>
                <Label className="text-text-secondary">Driver</Label>
                <p className="font-medium">
                  {currentTrip.driver.first_name} {currentTrip.driver.last_name}
                </p>
              </div>
              <div>
                <Label className="text-text-secondary">Start Mileage</Label>
                <p className="font-medium">{currentTrip.start_mileage} km</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complete Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_mileage">End Mileage (km)</Label>
                    <Input
                      id="end_mileage"
                      name="end_mileage"
                      type="number"
                      value={formData.end_mileage || ''}
                      onChange={handleChange}
                      required
                      min={currentTrip.start_mileage}
                    />
                    <p className="text-sm text-text-secondary mt-1">
                      Must be greater than {currentTrip.start_mileage} km
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="end_location">End Location</Label>
                    <Input
                      id="end_location"
                      name="end_location"
                      value={formData.end_location}
                      onChange={handleChange}
                      placeholder="e.g., Musanze Warehouse"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fuel_consumed">Fuel Consumed (liters)</Label>
                    <Input
                      id="fuel_consumed"
                      name="fuel_consumed"
                      type="number"
                      step="0.1"
                      value={formData.fuel_consumed || ''}
                      onChange={handleChange}
                      placeholder="Optional"
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
                    placeholder="Any additional notes about this trip..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Completing...' : 'Complete Trip'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/trips')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
