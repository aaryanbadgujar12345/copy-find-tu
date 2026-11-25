import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  CircleHelp,
  Coffee,
  Dumbbell,
  FlaskConical,
  Flower2,
  GraduationCap,
  Landmark,
  Library,
  Presentation,
  Train,
  TramFront,
  Trees,
} from "lucide-react";
import type { PlaceId } from "@/data/types";

const ICONS: Record<PlaceId, LucideIcon> = {
  library: Library,
  aula: Landmark,
  pulse: BookOpen,
  echo: Presentation,
  eemcs: GraduationCap,
  flux: Presentation,
  "bk-city": GraduationCap,
  x: Dumbbell,
  "science-centre": FlaskConical,
  "botanical-garden": Flower2,
  mekelpark: Trees,
  "delft-centraal": Train,
  "tram-19": TramFront,
  "bike-parking": Bike,
  food: Coffee,
  "services-desk": CircleHelp,
};

export function PlaceIcon({ id, size = 20 }: { id: PlaceId; size?: number }) {
  const Icon = ICONS[id];
  return <Icon aria-hidden size={size} strokeWidth={1.8} />;
}
