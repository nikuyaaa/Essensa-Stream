export const TooltipTexts = {
  // Intermission Banner Screen
  "intermission.welcomeText": "Renders a small capitalized sub-header at the very top of the left banner section. Best suited for welcome messages, categories, or stream event titles.",
  "intermission.announcement": "The large, bold primary title displayed on the left half of the intermission screen. Supports [gold] and [green] color accent tags for highlights.",
  "intermission.tagline": "Renders a small sub-caption below the primary title on the left side of the intermission view, perfect for highlighting company slogans or credits.",
  "intermission.rightHeader": "The bold, primary title text displayed at the top center of the right half of the intermission screen.",
  "intermission.rightBody": "The main block text description displayed in the center of the right half. Explains the current state of the broadcast or when to expect resumption.",
  "intermission.alertText": "Renders a prominent, high-contrast alert badge at the bottom of the right panel, designed for notices, active sales, or promotional announcements.",
  "intermission.logoUrl": "Upload or choose an image/video file to replace the default brand logo fallback in the top-left area of the intermission overlay.",
  
  // Starting Soon Screen
  "starting.superTitle": "Small, high-contrast text positioned at the top left of the starting screen layout. Introduces the broadcast event title.",
  "starting.announcement": "The main focal text header displayed on the left half of the starting screen. Supports green/gold custom color highlights.",
  "starting.tagline": "A secondary footer tagline printed in fine capital letters beneath the announcement on the left panel.",
  "starting.subTitle": "A small intro title rendered directly above the countdown clock on the right panel to guide viewers.",
  "starting.logoUrl": "Select an image or animated video to display as the main brand logo in the top-left portion of the starting layout.",
  "starting.customTime": "Enter hours, minutes, and seconds, then click 'Apply' to load it. Start the live countdown using the START LIVE button.",

  // Main Stream Overlay
  "main.segmentName": "The title text displayed in the sliding header bar. Type text here and select 'Save Header Settings' to update the active segment name on the overlay.",
  "main.logoUrl": "Choose a brand logo asset specifically for the scrolling ticker. It will float on the far left of the ticker items.",
  "main.tickerItems": "Enter scrolling news items. Put each individual notice on a new line; they will cycle from right to left continuously on the stream overlay.",
  "main.hostName": "The primary name of the host or speaker. Will slide in from the left inside the nameplate lower-third container.",
  "main.hostTitle": "The credentials or role title of the host. Appears in smaller text directly beneath the host's name inside the lower-third.",
  "main.hostAutoHide": "When checked, the nameplate lower-third will automatically hide itself after the configured duration on screen.",
  "main.hostHideDuration": "The duration (in seconds) the host nameplate remains on screen before automatically sliding out and hiding.",
  "main.productName": "The main title name of the product card (e.g. Buah Merah Mix) rendered in bold inside the spotlight card.",
  "main.productPrice": "The currency-formatted price tag shown in gold text on the product flashcard spotlight.",
  "main.productPromoText": "A special offer tagline printed at the bottom of the card to motivate viewers (e.g. Buy 2 Get 1 Free!).",
  "main.productImage": "Upload a transparent PNG product mockup image to display on the left side of the product flashcard overlay.",
  "main.productPermanent": "If enabled, the product spotlight card stays permanently visible on the overlay rather than sliding out after a timer.",
  "main.productHideDuration": "The duration (in seconds) the product spotlight remains visible on screen before automatically hiding.",

  // Be Right Back Screen
  "brb.bannerText": "The primary bold header title printed in large uppercase text on the centered BRB panel card (supports [gold] and [green] tags).",
  "brb.announcements": "Configure notices that cycle under the countdown. Add one short notification statement per line to inform waiting viewers.",
  "brb.logoUrl": "Choose a brand logo asset specifically for the Be Right Back screen card.",
  "brb.customTime": "Set the estimated duration of the intermission break. Enter custom time values, apply them, and click START LIVE.",

  // Stream Ending Outro
  "ending.title": "The primary bold title greeting displayed on the outro card thanking viewers for joining the broadcast.",
  "ending.description": "The closing block statement shown in the center of the outro card. Best used for final summaries or call-to-actions.",
  "ending.signature": "A custom signature or team credit line displayed in small text at the very bottom of the card (e.g. Made with ❤️ by the Family).",
  "ending.logoUrl": "Choose a custom brand logo image or loop specifically for the stream ending screen layout.",

  // Global Settings & Styles
  "settings.typographyColor": "Configures the fallback text color used across primary screens and text layers on the overlays.",
  "settings.bannerBgColor": "Specifies the solid background color behind the dark-themed panels, defaults to dark charcoal.",
  "settings.logoUrl": "Select a primary fallback brand logo asset to use on all overlay views unless overridden in scene-specific settings.",
  "settings.timerPresets": "Set the preset shortcut timer values (in minutes) that operators can click to quickly reset starting or BRB countdowns.",
  "settings.socialHandles": "Input social handles. Choose platform type and enter screen name to render handles in the footer dock.",
  "settings.socialFormat": "Format social accounts: show icons and text side-by-side, show icon only, or show handle text only.",
  "settings.socialLayout": "Grid layout displays handles in columns (great for desktop), while Row layout fits them in a single horizontal row.",
  
  // Additional missing mappings
  "main.clockUptime": "Toggle this switch to render the live session duration clock badge at the bottom of the stream header overlay.",
  "main.presetSegments": "Select one of these pre-configured segment names to instantly fill out the Show Title input field.",
  "main.uptimeClock": "Operational stopwatch control deck. Start, pause, or reset the stream session timer badge displayed on the overlay.",
  "starting.durationPresets": "Quick select duration presets to instantly reset the starting soon timer duration (e.g. 5m, 10m, 15m).",
  "brb.durationPresets": "Quick select duration presets to instantly reset the Be Right Back countdown duration (e.g. 5m, 10m, 15m).",
  "main.productPresets": "Click a pre-configured product preset (e.g., Buah Merah Mix, Barley, etc.) to instantly populate the product showcase details.",

  // Speed & Glow Sliders (General mapping per tab)
  "animation.goldSpeed": "Adjusts the scroll speed of the sweeping Gold Sunray gradient animation. Lower values increase speed, higher values slow it down.",
  "animation.goldGlow": "Configures the drop-shadow glowing intensity of gold-highlighted text. Range is from 0.0 (no glow) to 1.0 (bright glow).",
  "animation.greenSpeed": "Controls the sweep frequency of the hardware-accelerated Green Sunray gradient wave on green-highlighted text.",
  "animation.greenGlow": "Adjusts the drop-shadow neon glow strength around green-highlighted text elements from 0.0 to 1.0."
};
