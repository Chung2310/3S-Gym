import type { Roadmap } from './RoadmapForm';

export default function RoadmapTimeline({ roadmap }: { roadmap: Roadmap }) {
  return <ol aria-label={`Timeline ${roadmap.title}`}>{[...roadmap.phases].sort((left, right) => left.order - right.order).map((phase) => <li key={phase.order}><strong>{phase.order}. {phase.name}</strong><span>{phase.durationWeeks} tuần</span></li>)}</ol>;
}
