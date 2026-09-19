import Link from "next/link";
import { ROUTES } from "../lib/routes";

export default function NotFound() {
  return <main className="simple-page"><p className="eyebrow">A wrong turn</p><h1>This journey doesn&apos;t exist.</h1><p className="simple-lede">We couldn&apos;t find the page you&apos;re looking for.</p><div className="trip-empty"><span>⌁</span><h2>Let&apos;s get you back on track</h2><p>Return to your saved trips or begin a new travel plan.</p><Link className="primary-link" href={ROUTES.TRIPS}>Back to My Trips</Link><Link className="text-link" href={ROUTES.PLAN}>Plan a new trip</Link></div></main>;
}
