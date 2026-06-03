import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.octolabs.artisanmu",
  appName: "ArtisanMU",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
};

export default config;
