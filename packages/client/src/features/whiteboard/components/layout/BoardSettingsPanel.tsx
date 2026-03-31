import {
  ChevronRight,
  Settings2,
  Shield,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { usePanelFocus } from "../../hooks/usePanelFocus";

interface BoardSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FUTURE_SECTIONS = [
  {
    title: "Permissions",
    description: "Board privacy, edit access, and invite rules will live here.",
    Icon: Shield,
  },
  {
    title: "Canvas Defaults",
    description:
      "Future options for theme, grid, export defaults, and template presets.",
    Icon: SlidersHorizontal,
  },
  {
    title: "Collaboration",
    description:
      "Presence, cursor visibility, and live collaboration preferences will be added here.",
    Icon: UsersRound,
  },
];

export default function BoardSettingsPanel({
  isOpen,
  onClose,
}: BoardSettingsPanelProps) {
  const closeButtonRef = usePanelFocus(isOpen);

  return (
    <>
      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop",
          isOpen && "wb-overlay-backdrop--open",
        )}
        onClick={onClose}
        aria-label="Close board settings"
      />

      <aside
        id="board-settings-panel"
        className={cn("wb-right-panel", isOpen && "wb-right-panel--open")}
        aria-hidden={!isOpen}
        aria-labelledby="board-settings-panel-title"
        role="dialog"
        tabIndex={-1}
      >
        <div className="wb-right-panel__shell">
          <div className="wb-right-panel__header">
            <div className="wb-right-panel__heading">
              <Settings2 size={16} />
              <h3
                id="board-settings-panel-title"
                className="wb-right-panel__title"
              >
                Board Settings
              </h3>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="wb-icon-button wb-icon-button--small"
              onClick={onClose}
              aria-label="Close board settings"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="wb-inspector">
            <section className="wb-inspector__section">
              <h4>Planned Settings Surface</h4>
              <p className="wb-inspector__empty wb-inspector__empty--strong">
                This panel is reserved for future board settings so we can keep
                metadata and configuration separate in the navigation.
              </p>
            </section>

            {FUTURE_SECTIONS.map(({ title, description, Icon }) => (
              <section key={title} className="wb-inspector__section">
                <div className="wb-inspector__section-title">
                  <Icon size={15} />
                  <h4>{title}</h4>
                </div>

                <div className="wb-settings-placeholder">
                  <p>{description}</p>
                  <span>Coming soon</span>
                </div>
              </section>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
