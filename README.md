# Typecraft — Font Pairing Studio

A professional typography design tool for pairing fonts, customizing typography scales, and previewing designs in real-time. Perfect for UI/UX designers, web developers, and brand designers who need to create cohesive typography systems.

![Typecraft Preview](https://via.placeholder.com/800x400/1a1a2e/f0ede8?text=Typecraft+Font+Pairing+Studio)

## ✨ Features

### 🎨 Font Pairing
- **Curated Font Library**: 40+ Google Fonts across categories (Serif, Sans-Serif, Display, Handwriting, Monospace)
- **System Fonts**: Built-in support for common system fonts
- **Custom Font Upload**: Upload your own .ttf, .otf, .woff, and .woff2 files
- **Curated Pairings**: Pre-made font combinations for different styles (Editorial, Luxury, Modern Bold, etc.)
- **Random Pairing**: Generate random font combinations with one click

### 📐 Typography Controls
- **Heading Size**: 24-96px range
- **Body Size**: 12-24px range
- **Letter Spacing**: -3px to 10px
- **Line Height**: 1.0 to 2.5
- **Font Weights**: Regular, Semi-bold, Bold, Black

### 🎨 Color System
- **8 Predefined Themes**: Obsidian, Arctic, Forest, Rose, Midnight, Sand, Ink, Ivory
- **Custom Colors**: Full control over background, text, accent, and secondary colors
- **Contrast Checking**: Automatic WCAG AA/AAA compliance indicators

### 👁️ Preview Modes
- **Type Specimen**: See fonts in various sizes and contexts
- **Landing Page**: Mock website layout with navigation, hero section, and features
- **Brand Card**: Business card design with customizable text
- **Color Combos**: Grid showing your pairing across different color schemes

### 📤 Export Options
- **Copy CSS**: Generate CSS custom properties for your typography system
- **Export Config**: Download a JSON file with all settings and Google Fonts URL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arshitadewan7/typecraft.git
   cd typecraft
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using bun (recommended)
   bun install
   ```

3. **Run the development server**
   ```bash
   # Using npm
   npm run dev

   # Using yarn
   yarn dev

   # Using bun
   bun run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: CSS with CSS Custom Properties
- **Font Loading**: Google Fonts API
- **Package Manager**: [Bun](https://bun.sh/) (recommended)

## 📖 How to Use

### 1. Choose Your Fonts
- Click on the **Heading** or **Body** font slot in the sidebar
- Search through the font library or browse curated pairings
- Upload custom fonts if needed

### 2. Customize Typography
- Adjust font sizes, spacing, and weights using the sliders
- Fine-tune letter spacing and line height for optimal readability

### 3. Select a Color Theme
- Choose from predefined themes or create custom colors
- Check the contrast ratio indicator for accessibility compliance

### 4. Preview Your Design
- Switch between different preview modes (Specimen, Landing, Card, Combos)
- See how your typography looks in real-world contexts

### 5. Export Your Work
- Copy CSS variables for use in your projects
- Export a complete configuration file with all settings

## 🎯 Use Cases

- **Brand Design**: Create consistent typography systems for logos and marketing materials
- **Web Development**: Design readable, accessible text hierarchies for websites and apps
- **UI/UX Design**: Prototype typography in interface designs
- **Print Design**: Preview font pairings for brochures, books, and other print materials

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Font data sourced from [Google Fonts](https://fonts.google.com/)
- Inspired by typography tools like Type Scale, Modular Scale, and FontPair

---

**Made with ❤️ for designers and developers who care about typography**