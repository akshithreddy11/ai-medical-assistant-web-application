"use client";

import { useState } from "react";

import {
  AlertTriangle,
  Search,
  MapPin,
  Navigation,
  ExternalLink,
  Loader2,
  Hospital,
  ChevronDown,
} from "lucide-react";

const healthIssues = [
  "Accident",
  "Chest Pain",
  "Breathing Problem",
  "Severe Injury",
  "Fever",
  "Stomach Pain",
  "Headache",
  "Allergic Reaction",
  "Burn",
  "General Emergency",
];

const locations = [
  {
    name: "Hyderabad",
    value: "Hyderabad, Telangana, India",
    lat: 17.385,
    lng: 78.4867,
  },
  {
    name: "Secunderabad",
    value: "Secunderabad, Telangana, India",
    lat: 17.4399,
    lng: 78.4983,
  },
  {
    name: "Bengaluru",
    value: "Bengaluru, Karnataka, India",
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    name: "Chennai",
    value: "Chennai, Tamil Nadu, India",
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    name: "Mumbai",
    value: "Mumbai, Maharashtra, India",
    lat: 19.076,
    lng: 72.8777,
  },
  {
    name: "Delhi",
    value: "Delhi, India",
    lat: 28.6139,
    lng: 77.209,
  },
  {
    name: "Pune",
    value: "Pune, Maharashtra, India",
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    name: "Vijayawada",
    value: "Vijayawada, Andhra Pradesh, India",
    lat: 16.5062,
    lng: 80.648,
  },
  {
    name: "Visakhapatnam",
    value: "Visakhapatnam, Andhra Pradesh, India",
    lat: 17.6868,
    lng: 83.2185,
  },
];

type HospitalResult = {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
};

export default function EmergencyPage() {
  const [issue, setIssue] = useState("");
  const [location, setLocation] = useState("");

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [hospitals, setHospitals] = useState<HospitalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // USE CURRENT LOCATION
  // --------------------------------------------------

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location services.");
      return;
    }

    setLocationLoading(true);
    setError("");
    setHospitals([]);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLocation({
          lat,
          lng,
        });

        setLocation(
          `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        );

        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);

        setError(
          "Unable to get your current location. Please allow location permission or select a location from the dropdown."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------------------------
  // SELECT LOCATION FROM DROPDOWN
  // --------------------------------------------------

  const selectLocation = (value: string) => {
    setLocation(value);
    setHospitals([]);
    setError("");

    const selectedLocation = locations.find(
      (item) => item.value === value
    );

    if (selectedLocation) {
      setCurrentLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
    } else {
      setCurrentLocation(null);
    }
  };

  // --------------------------------------------------
  // SEARCH LOCATION
  // --------------------------------------------------

  const searchLocation = async () => {
    if (!location.trim()) {
      setError("Please select a location.");
      return;
    }

    setError("");
    setLocationLoading(true);
    setCurrentLocation(null);
    setHospitals([]);

    try {
      const response = await fetch(
        `/api/geocode?location=${encodeURIComponent(location)}`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Location API returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to find this location."
        );
      }

      setCurrentLocation({
        lat: Number(data.lat),
        lng: Number(data.lng),
      });

      setLocation(data.formattedAddress || location);
    } catch (err: any) {
      setError(
        err.message || "Unable to search this location."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // --------------------------------------------------
  // FIND NEARBY HOSPITALS
  // --------------------------------------------------

  const findHospitals = async () => {
    if (!issue.trim()) {
      setError("Please select a health issue.");
      return;
    }

    if (!currentLocation) {
      setError(
        "Please select a location or use your current location first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setHospitals([]);

    try {
      const response = await fetch(
        `/api/hospitals?issue=${encodeURIComponent(
          issue
        )}&lat=${currentLocation.lat}&lng=${currentLocation.lng}`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Hospital API returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to find nearby hospitals."
        );
      }

      const hospitalList = data.hospitals || [];

      setHospitals(hospitalList);

      if (!hospitalList.length) {
        setError(
          "No nearby hospitals were found for this location."
        );
      }
    } catch (err: any) {
      console.error("Hospital search error:", err);

      setError(
        err.message ||
          "Something went wrong while finding hospitals."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen p-6">
      {/* PAGE HEADER */}

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-500/10 p-3">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Emergency Assistance
            </h1>

            <p className="mt-1 text-muted-foreground">
              Find nearby hospitals based on your health issue
              and location.
            </p>
          </div>
        </div>
      </div>

      {/* EMERGENCY WARNING */}

      <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="font-semibold text-red-500">
              Emergency Notice
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              If someone needs immediate medical attention,
              contact local emergency services or go to the
              nearest emergency department. Do not wait for
              this application in a life-threatening situation.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH CARD */}

      <div className="rounded-2xl border p-6">
        {/* HEALTH ISSUE */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Health Issue
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <select
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value);
                setHospitals([]);
                setError("");
              }}
              className="w-full appearance-none rounded-xl border bg-background py-3 pl-11 pr-10 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">
                Select health issue
              </option>

              {healthIssues.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* LOCATION */}

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Location
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            {/* LOCATION DROPDOWN */}

            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <select
                value={location}
                onChange={(e) =>
                  selectLocation(e.target.value)
                }
                className="w-full appearance-none rounded-xl border bg-background py-3 pl-11 pr-10 outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">
                  Select location
                </option>

                {locations.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* SEARCH LOCATION */}

            <button
              onClick={searchLocation}
              disabled={!location || locationLoading}
              className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locationLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}

              Search Location
            </button>
          </div>

          {/* CURRENT LOCATION */}

          <button
            onClick={useCurrentLocation}
            disabled={locationLoading}
            className="mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}

            Use Current Location
          </button>

          {/* LOCATION SUCCESS */}

          {currentLocation && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-500">
              <MapPin className="h-4 w-4" />

              Location selected successfully
            </div>
          )}
        </div>

        {/* FIND HOSPITALS */}

        <button
          onClick={findHospitals}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Finding Hospitals...
            </>
          ) : (
            <>
              <Hospital className="h-5 w-5" />
              Find Nearby Hospitals
            </>
          )}
        </button>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}
      </div>

      {/* HOSPITAL RESULTS */}

      {hospitals.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Nearby Hospitals
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Hospitals found based on your selected health
              issue and location.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {hospitals.map((hospital) => {
              const fallbackMapsUrl =
                hospital.mapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${hospital.name}, ${hospital.address}`
                )}`;

              return (
                <div
                  key={hospital.id}
                  className="rounded-2xl border p-5 transition hover:border-cyan-500/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-red-500/10 p-2">
                      <Hospital className="h-5 w-5 text-red-500" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {hospital.name}
                      </h3>

                      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                        {hospital.address}
                      </p>
                    </div>
                  </div>

                  {/* GOOGLE MAPS */}

                  <a
                    href={fallbackMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />

                    View Location
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}