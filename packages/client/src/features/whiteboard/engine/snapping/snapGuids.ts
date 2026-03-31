export type SnapGuide = {
  type: "vertical" | "horizontal";
  position: number;
};

let guides: SnapGuide[] = [];

export function clearSnapGuides() {
  guides = [];
}

export function addSnapGuide(guide: SnapGuide) {
  guides.push(guide);
}

export function getSnapGuides() {
  return guides;
}
