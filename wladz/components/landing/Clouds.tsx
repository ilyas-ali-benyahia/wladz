import { useId } from "react";

function Cloud({ className }: { className: string }) {
  const id = useId().replaceAll(":", "");
  return <svg className={className} viewBox="0 0 900 480" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-puff`} cx="40%" cy="27%" r="75%"><stop offset="0%" stopColor="white" /><stop offset="48%" stopColor="#fff" /><stop offset="85%" stopColor="#e8f4ff" /><stop offset="100%" stopColor="#d6eaff" stopOpacity=".7" /></radialGradient>
      <linearGradient id={`${id}-mist`} x2="0" y2="1"><stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
    </defs>
    <g fill={`url(#${id}-puff)`}>
      <ellipse cx="165" cy="262" rx="155" ry="107" /><ellipse cx="690" cy="272" rx="185" ry="120" />
      <ellipse cx="295" cy="193" rx="143" ry="130" /><ellipse cx="518" cy="223" rx="160" ry="125" />
      <ellipse cx="391" cy="157" rx="126" ry="136" /><ellipse cx="580" cy="169" rx="102" ry="100" />
      <ellipse cx="239" cy="286" rx="153" ry="103" /><ellipse cx="419" cy="286" rx="175" ry="114" />
      <ellipse cx="599" cy="303" rx="141" ry="88" /><ellipse cx="92" cy="320" rx="108" ry="66" />
      <ellipse cx="790" cy="318" rx="102" ry="75" />
    </g>
    <ellipse cx="447" cy="350" rx="450" ry="116" fill={`url(#${id}-mist)`} />
  </svg>;
}

export default function Clouds({ footer = false }: { footer?: boolean }) {
  return <div className={`clouds ${footer ? "clouds--footer" : ""}`} aria-hidden="true">
    <div className="cloud-layer cloud-layer--far" data-parallax-x="-80" data-parallax-y="90" data-parallax-fade="0.8"><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--start" data-parallax-x={footer ? 15 : 180} data-parallax-y={footer ? -55 : 100} data-parallax-scale={footer ? 0.04 : 0.16} data-parallax-fade={footer ? 0 : 1}><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--end" data-parallax-x={footer ? -15 : -190} data-parallax-y={footer ? -40 : 60} data-parallax-scale={footer ? 0.04 : 0.2} data-parallax-fade={footer ? 0 : 1}><Cloud className="cloud-shape" /></div>
    <div className="cloud-layer cloud-layer--front" data-parallax-y="140" data-parallax-scale="0.12" data-parallax-fade="0.7"><Cloud className="cloud-shape" /></div>
  </div>;
}
