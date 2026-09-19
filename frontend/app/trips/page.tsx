"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "../../lib/routes";

export default function TripsPage() {
  const [tripId, setTripId] = useState<string | null>(null);
  useEffect(() => { const saved = localStorage.getItem("tripmate_active_trip"); if (saved) setTripId((JSON.parse(saved) as { thread_id?: string }).thread_id || null); }, []);
  return <div className="page-shell"><header className="site-header"><Link className="brand" href={ROUTES.HOME}><span className="brand-mark">✦</span><span>TripMate <b>AI</b></span></Link><nav className="main-nav"><Link href={ROUTES.PLAN}>Plan a trip</Link><Link className="active" href={ROUTES.TRIPS}>My trips</Link><Link href={ROUTES.EXPLORE}>Explore</Link></nav></header><main className="simple-page"><p className="eyebrow">Your journeys</p><h1>My trips</h1><p className="simple-lede">Your latest TripMate plan is saved on this device. Open it to continue reviewing or start a new adventure.</p>{tripId ? <div className="saved-trip-card"><span>✦</span><div><p className="eyebrow">Latest trip</p><h2>Continue planning</h2><p>Your saved TripMate itinerary is ready to reopen.</p></div><Link className="primary-link" href={ROUTES.TRIP(tripId)}>View trip ↗</Link></div> : <div className="trip-empty"><span>✦</span><h2>Your saved trips will appear here</h2><p>Create a plan and TripMate will keep the latest itinerary ready for you.</p><Link className="primary-link" href={ROUTES.PLAN}>Plan a new trip ↗</Link></div>}</main></div>;
}
