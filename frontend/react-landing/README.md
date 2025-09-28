# Best of Us - React Landing Page

A modern, professional landing page built with React and Tailwind CSS, styled to match the Persist Ventures design aesthetic.

## 🎨 Design Features

- **Color Palette**: Dark blue (#1a1a2e) and black theme with sophisticated gradients
- **Typography**: Inter font family with bold headings and clean body text
- **Components**: Modern cards, buttons with hover effects, and smooth animations
- **Responsive**: Fully responsive design that works on all devices
- **Interactive**: Login modal, smooth scrolling, and hover animations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd frontend/react-landing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation with mobile menu
│   ├── Hero.js            # Hero section with CTA
│   ├── About.js           # About section with features
│   ├── Stats.js           # Statistics section
│   ├── Description.js     # Description section
│   ├── Portfolio.js       # Portfolio/features showcase
│   ├── Careers.js         # Careers section
│   ├── Footer.js          # Footer with links
│   └── LoginModal.js      # Login/signup modal
├── App.js                 # Main app component
├── App.css               # App-specific styles
├── index.js              # React entry point
└── index.css             # Global styles and Tailwind imports
```

## 🎯 Key Features

### Hero Section
- Bold headline with gradient text
- Call-to-action button
- Visual placeholder with icon

### About Section
- Three feature cards with icons
- Mission statement
- Clean, centered layout

### Stats Section
- Four key metrics
- Clean typography
- Light background

### Portfolio Section
- Three project cards
- Action buttons for each project
- Hover effects and shadows

### Careers Section
- Two-column layout
- Startupathon information
- Highlight badges

### Navigation
- Fixed header with backdrop blur
- Mobile-responsive hamburger menu
- Smooth scroll to sections

### Login Modal
- Tabbed interface (Login/Signup)
- Google Sign-In integration
- Form validation ready

## 🎨 Styling

### Color Palette
- **Primary**: #1a1a2e (Dark Navy)
- **Secondary**: #16213e (Deep Blue)
- **Accent**: #0f3460 (Ocean Blue)
- **Text**: Various shades of gray
- **Background**: White and light gray

### Typography
- **Font**: Inter (Google Fonts)
- **Hero**: 4rem, font-weight 900
- **Sections**: 2.75rem, font-weight 800
- **Body**: 1rem, font-weight 400

### Components
- **Buttons**: Rounded corners, hover effects, consistent padding
- **Cards**: Subtle shadows, rounded corners, hover animations
- **Forms**: Clean inputs with focus states

## 📱 Responsive Design

- **Mobile**: Single column layout, stacked sections
- **Tablet**: Two-column layouts where appropriate
- **Desktop**: Full multi-column layouts
- **Breakpoints**: Tailwind's default breakpoints (sm, md, lg, xl)

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to modify the color palette:

```javascript
colors: {
  primary: {
    DEFAULT: '#1a1a2e', // Change this
    // ... other shades
  }
}
```

### Typography
Modify font sizes in `tailwind.config.js`:

```javascript
fontSize: {
  'hero': ['4rem', { lineHeight: '1.05' }], // Change this
}
```

### Components
Each component is modular and can be easily customized in the `src/components/` directory.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Drag the `build` folder to Netlify
3. Configure environment variables if needed

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect it's a React app
3. Deploy with zero configuration

## 📄 License

This project is created for the "Best of Us" platform and follows the design aesthetic of Persist Ventures.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ using React + Tailwind CSS**
