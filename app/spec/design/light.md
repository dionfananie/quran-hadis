---
name: Sacred Emerald
colors:
  surface: '#fafaf5'
  surface-dim: '#dadad6'
  surface-bright: '#fafaf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ef'
  surface-container: '#eeeee9'
  surface-container-high: '#e8e8e4'
  surface-container-highest: '#e2e3de'
  on-surface: '#1a1c19'
  on-surface-variant: '#3f4945'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ec'
  outline: '#707975'
  outline-variant: '#bfc9c4'
  surface-tint: '#29695b'
  primary: '#00342b'
  on-primary: '#ffffff'
  primary-container: '#004d40'
  on-primary-container: '#7ebdac'
  inverse-primary: '#94d3c1'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#13322c'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a4942'
  on-tertiary-container: '#96b7ae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#afefdd'
  primary-fixed-dim: '#94d3c1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#065043'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#c7eae0'
  tertiary-fixed-dim: '#accec4'
  on-tertiary-fixed: '#00201a'
  on-tertiary-fixed-variant: '#2d4c45'
  background: '#fafaf5'
  on-background: '#1a1c19'
  surface-variant: '#e2e3de'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system embodies a "Sacred Emerald" aesthetic—a fusion of high-end luxury and spiritual tranquility. It is designed for platforms that require deep focus, mindfulness, or cultural heritage, catering to an audience that values intentionality and premium craftsmanship.

The visual style is **Contemporary Minimalist with a Tactile twist**. It utilizes heavy whitespace to create a sense of breath, layered with rich textures and traditional motifs. The atmosphere is quiet yet authoritative. Distinctive "Girih" geometric patterns are used sparingly as decorative borders or ultra-faint background watermarks (2-4% opacity) to provide a sense of place and mathematical harmony without cluttering the interface.

## Colors
The palette is rooted in the "Sacred Emerald" philosophy:
- **Primary (Deep Emerald):** Used for key branding elements, primary buttons, and significant structural components. It represents stability and life.
- **Accent (Burnished Gold):** Reserved for highlights, active states, focus rings, and ornamental borders. It should be used with restraint to maintain its "precious" quality.
- **Surface (Parchment/Midnight):** In light mode, `#F9F9F4` provides a warm, organic feel that reduces eye strain. In dark mode, `#00211B` creates a deep, immersive "forest" atmosphere.
- **Interaction:** Active states should utilize the Burnished Gold to provide a warm glow against the Deep Emerald backgrounds.

## Typography
The typographic hierarchy relies on the contrast between the authoritative, timeless **Noto Serif** and the precision of **Manrope**. 

- **Headlines:** Use Noto Serif for all headings to evoke a literary, sophisticated feel.
- **Body:** Manrope provides excellent legibility for long-form content, maintaining a modern balance against the serif headings.
- **Functional UI:** Geist is used for labels, captions, and monospaced data points, offering a crisp, technical edge that ensures the system feels contemporary rather than purely historical.
- **Scale:** Large display sizes should be reduced by approximately 30% for mobile devices to maintain vertical rhythm.

## Layout & Spacing
The design system utilizes a **Fixed Grid** model for desktop to maintain a "manuscript" feel, centering content within a 1200px container. 

- **Rhythm:** An 8px base unit governs all spatial relationships.
- **Margins:** Generous outer margins (40px on desktop) reinforce the feeling of luxury and exclusivity. 
- **Adaptation:** On mobile, the grid shifts to a 4-column fluid layout with 16px side margins. 
- **Verticality:** Sections should be separated by significant vertical padding (80px–120px) to allow the "Girih" patterns to breathe in the negative space.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layering and Low-Contrast Outlines** rather than aggressive shadows.

1.  **Surfaces:** Use subtle shifts in parchment tones to differentiate sections.
2.  **Outlines:** Elements like cards or input fields should use a 1px "Burnished Gold" border at 20% opacity.
3.  **Active Elevation:** Only the highest priority interactive elements (like a primary modal) should use a shadow. Shadows should be ultra-diffused, using a Deep Emerald tint (`rgba(0, 77, 64, 0.08)`) to maintain the color story.
4.  **Glassmorphism:** Use background blurs (20px radius) on navigation bars to create a "frosted emerald" effect when scrolling over content.

## Shapes
The shape language is **Soft (0.25rem)**. While the patterns used in the background are geometric and sharp, the UI components themselves utilize a slight radius to appear approachable and "hand-finished."

- **Standard Elements:** 4px (0.25rem) radius for buttons and inputs.
- **Large Containers:** 8px (0.5rem) radius for cards and modals.
- **Ornaments:** Geometric pattern containers may remain sharp (0px) to preserve the integrity of the Islamic Girih motifs.

## Components
- **Buttons:** Primary buttons are Deep Emerald with white text. Secondary buttons are outlined in Burnished Gold with Emerald text. Use a "Gold Glow" (subtle outer box-shadow) on hover.
- **Cards:** Backgrounds should be 2% lighter or darker than the main surface. Incorporate a 4px "Girih" pattern strip at the top or bottom edge as a decorative accent.
- **Input Fields:** Use a "Parchment" fill with a bottom-only border in Burnished Gold for a sophisticated, minimal look.
- **Chips/Labels:** Use Geist font in all-caps. Backgrounds should be a very pale tint of the primary Emerald.
- **Dividers:** Instead of plain lines, use a centered, low-opacity geometric star or knot motif to break long sections of content.
- **Navigation:** The top bar should be minimal, utilizing the Burnished Gold for the active link indicator (a simple 2px line beneath the text).