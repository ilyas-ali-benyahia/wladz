import { CloudShape as Cloud } from "@/components/ui/CloudShape";

export default function Clouds({ footer = false, section = false }: { footer?: boolean; section?: boolean }) {
  // Nuages derrière une section : ils descendent moins vite que le contenu et s'écartent.
  if (section) {
    return <div className="clouds clouds--section" aria-hidden="true">
      <div className="cloud-layer cloud-layer--s1" data-parallax-x="-70" data-parallax-y="170"><Cloud className="cloud-shape" /></div>
      <div className="cloud-layer cloud-layer--s2" data-parallax-x="80" data-parallax-y="110"><Cloud className="cloud-shape" /></div>
      <div className="cloud-layer cloud-layer--s3" data-parallax-x="-40" data-parallax-y="220" data-parallax-scale="0.08"><Cloud className="cloud-shape" /></div>
      <div className="cloud-layer cloud-layer--s4" data-parallax-x="60" data-parallax-y="140"><Cloud className="cloud-shape" /></div>
    </div>;
  }
  return <div className={`clouds ${footer ? "clouds--footer" : ""}`} aria-hidden="true">
    <div className="cloud-layer cloud-layer--far" data-parallax-x="-80" data-parallax-y="90" data-parallax-fade="0.8"><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--start" data-parallax-x={footer ? 15 : 180} data-parallax-y={footer ? -55 : 100} data-parallax-scale={footer ? 0.04 : 0.16} data-parallax-fade={footer ? 0 : 1}><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--end" data-parallax-x={footer ? -15 : -190} data-parallax-y={footer ? -40 : 60} data-parallax-scale={footer ? 0.04 : 0.2} data-parallax-fade={footer ? 0 : 1}><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--front" data-parallax-y="140" data-parallax-scale="0.12" data-parallax-fade="0.7"><Cloud className="cloud-shape" /></div>
  </div>;
}
