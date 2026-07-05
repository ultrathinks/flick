import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
    (Story) => (
      <div className="min-h-screen bg-bg p-8 text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;
