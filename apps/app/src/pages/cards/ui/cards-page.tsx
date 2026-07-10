import { Check } from "lucide-react";
import {
  CARD_THEMES,
  CardVisual,
  setSelectedCardThemeId,
  useSelectedCardThemeId,
} from "@/entities/card";
import { Screen } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const CardsPage = () => {
  const selectedId = useSelectedCardThemeId();
  const activeId = selectedId ?? CARD_THEMES[0].id;

  return (
    <Screen className="h-full min-h-0 overflow-y-auto">
      <PageHeader title="카드" back />
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-2">
        <p className="mb-5 text-body text-foreground-subtle">
          결제할 때 보여줄 카드를 선택하세요.
        </p>
        <ul className="space-y-4">
          {CARD_THEMES.map((theme) => {
            const active = theme.id === activeId;
            return (
              <li key={theme.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCardThemeId(theme.id)}
                  aria-pressed={active}
                  className="block w-full text-left outline-hidden"
                >
                  <div className="relative">
                    <CardVisual
                      theme={theme}
                      className={
                        active
                          ? ""
                          : "opacity-60 transition-opacity active:opacity-100"
                      }
                    />
                    {active && (
                      <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_2px_6px_rgb(0_0_0/0.3)]">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="mt-2.5 block px-1 text-body font-semibold text-foreground">
                    {theme.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
};
