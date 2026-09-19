import Link from "next/link";
import { ROUTES } from "../../lib/routes";

const destinations = [
  ["🇯🇵", "Japan", "Culture, coastlines and late-night city lights."],
  ["🇦🇪", "Dubai", "Desert horizons, design and golden evenings."],
  ["🇹🇭", "Thailand", "Island mornings, street food and warm water."]
];

export default function ExplorePage() {
  return <div className="page-shell"><header className="site-header"><Link className="brand" href={ROUTES.HOME}><span className="brand-mark">✦</span><span>TripMate <b>AI</b></span></Link><nav className="main-nav"><Link href={ROUTES.PLAN}>Plan a trip</Link><Link href={ROUTES.TRIPS}>My trips</Link><Link className="active" href={ROUTES.EXPLORE}>Explore</Link></nav></header><main className="simple-page"><p className="eyebrow">Find your next feeling</p><h1>Explore destinations</h1><p className="simple-lede">Choose a direction and TripMate will open the planner with a thoughtful starting prompt.</p><div className="destination-grid">{destinations.map(([flag, name, description]) => <Link className="destination-card" href={`${ROUTES.PLAN}?destination=${encodeURIComponent(name)}`} key={name}><span>{flag}</span><h2>{name}</h2><p>{description}</p><b>Plan this trip ↗</b></Link>)}</div></main></div>;
}
