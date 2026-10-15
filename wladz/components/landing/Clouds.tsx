import { CloudShape as Cloud } from "@/components/ui/CloudShape";

// Nuages du ciel du hero : ils s'écartent et grossissent au scroll (useParallax du hero).
export default function Clouds() {
  return <div className="clouds" aria-hidden="true">
    <div className="cloud-layer cloud-layer--far" data-parallax-x="-80" data-parallax-y="90" data-parallax-fade="0.8"><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--start" data-parallax-x="180" data-parallax-y="100" data-parallax-scale="0.16" data-parallax-fade="1"><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--end" data-parallax-x="-190" data-parallax-y="60" data-parallax-scale="0.2" data-parallax-fade="1"><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--front" data-parallax-y="140" data-parallax-scale="0.12" data-parallax-fade="0.7"><Cloud className="cloud-shape" /></div>
  </div>;
}
